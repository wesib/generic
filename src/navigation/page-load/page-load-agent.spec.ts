import { ContextRegistry } from 'context-values';
import { EventEmitter, OnEvent, onEventFrom } from 'fun-events';
import { PageLoadAgent } from './page-load-agent';
import Mock = jest.Mock;

describe('navigation', () => {
  describe('PageLoadAgent', () => {

    let registry: ContextRegistry;
    let agent: PageLoadAgent;

    beforeEach(() => {
      registry = new ContextRegistry();

      const values = registry.newValues();

      agent = values.get(PageLoadAgent);
    });

    let request: Request;
    let mockLoad: Mock<OnEvent<[Document]>, [Request?]>;
    let emitter: EventEmitter<[Document]>;

    beforeEach(() => {
      request = new Request('http://localhost/test');
      emitter = new EventEmitter();
      mockLoad = jest.fn((_request?) => emitter.on);
    });

    it('performs the load without agents registered', () => {
      expect(agent(mockLoad, request)).toBe(emitter.on);
      expect(mockLoad).toHaveBeenCalledWith(request);
    });
    it('performs the load without agents registered and with `null` fallback value', () => {
      agent = registry.newValues().get(PageLoadAgent, { or: null })!;
      expect(agent(mockLoad, request)).toBe(emitter.on);
      expect(mockLoad).toHaveBeenCalledWith(request);
    });
    it('calls the registered agent', async () => {

      const emitter2 = new EventEmitter<[Document]>();
      const mockAgent = jest.fn(() => emitter2.on);

      registry.provide({ a: PageLoadAgent, is: mockAgent });

      const response1 = { name: 'document1' } as any;
      const response2 = { name: 'document2' } as any;
      const response = await new Promise<Document>(resolve => {
        onEventFrom(agent(mockLoad, request)).once(resolve);
        emitter.send(response1);
        emitter2.send(response2);
      });

      expect(response).toBe(response2);
    });
    it('performs the load by calling `next`', async () => {
      registry.provide({ a: PageLoadAgent, is: next => next() });

      expect(agent(mockLoad, request)).toBe(emitter.on);
      expect(mockLoad).toHaveBeenCalledWith(request);
    });
    it('calls the next agent in chain by calling `next`', async () => {

      const mockAgent: Mock<ReturnType<PageLoadAgent>, Parameters<PageLoadAgent>> =
          jest.fn((next, _request) => next());

      registry.provide({ a: PageLoadAgent, is: next => next() });
      registry.provide({ a: PageLoadAgent, is: mockAgent });

      expect(agent(mockLoad, request)).toBe(emitter.on);
      expect(mockAgent).toHaveBeenCalledWith(expect.any(Function), request);
      expect(mockLoad).toHaveBeenCalledWith(request);
    });
  });
});
