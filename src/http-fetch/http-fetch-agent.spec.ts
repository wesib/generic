import { ContextRegistry } from 'context-values';
import { EventEmitter, OnEvent, onEventFrom } from 'fun-events';
import { HttpFetchAgent } from './http-fetch-agent';
import Mock = jest.Mock;

describe('http-fetch', () => {
  describe('HttpFetchAgent', () => {

    let registry: ContextRegistry;
    let agent: HttpFetchAgent;

    beforeEach(() => {
      registry = new ContextRegistry();

      const values = registry.newValues();

      agent = values.get(HttpFetchAgent);
    });

    let request: Request;
    let init: RequestInit;
    let mockFetch: Mock<OnEvent<[Response]>, [RequestInfo?, RequestInit?]>;
    let emitter: EventEmitter<[Response]>;

    beforeEach(() => {
      request = { url: 'http://localhost/test' } as any;
      init = { headers: { 'X-Test': 'true' } };
      emitter = new EventEmitter<[Response]>();
      mockFetch = jest.fn((_request?, _init?) => emitter.on);
    });

    it('performs the fetch without agents', () => {
      expect(agent(mockFetch, request, init)).toBe(emitter.on);
      expect(mockFetch).toHaveBeenCalledWith(request, init);
    });
    it('performs the fetch without agents with `null` fallback value', () => {
      agent = registry.newValues().get(HttpFetchAgent, { or: null }) as HttpFetchAgent;
      expect(agent(mockFetch, request, init)).toBe(emitter.on);
      expect(mockFetch).toHaveBeenCalledWith(request, init);
    });
    it('calls the registered agent', async () => {

      const emitter2 = new EventEmitter<[Response]>();
      const mockAgent = jest.fn(() => emitter2.on);

      registry.provide({ a: HttpFetchAgent, is: mockAgent });

      const response1: Response = { name: 'response1' } as any;
      const response2: Response = { name: 'response1' } as any;
      const response = await new Promise<Response>(resolve => {
        onEventFrom(agent(mockFetch, request, init)).once(resolve);
        emitter.send(response1);
        emitter2.send(response2);
      });

      expect(response).toBe(response2);
    });
    it('performs the fetch by calling `next`', async () => {
      registry.provide({ a: HttpFetchAgent, is: next => next() });

      expect(agent(mockFetch, request, init)).toBe(emitter.on);
      expect(mockFetch).toHaveBeenCalledWith(request, init);
    });
    it('calls the next agent in chain by calling `next`', async () => {

      const mockAgent: Mock<ReturnType<HttpFetchAgent>, Parameters<HttpFetchAgent>> =
          jest.fn((next, _input, _init?) => next());

      registry.provide({ a: HttpFetchAgent, is: next => next() });
      registry.provide({ a: HttpFetchAgent, is: mockAgent });

      expect(agent(mockFetch, request, init)).toBe(emitter.on);
      expect(mockAgent).toHaveBeenCalledWith(expect.any(Function), request, init);
      expect(mockFetch).toHaveBeenCalledWith(request, init);
    });
  });
});
