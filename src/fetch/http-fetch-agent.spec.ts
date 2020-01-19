import { ContextRegistry } from 'context-values';
import { EventEmitter, OnEvent, onSupplied } from 'fun-events';
import { HttpFetchAgent } from './http-fetch-agent';
import Mock = jest.Mock;

describe('fetch', () => {
  describe('HttpFetchAgent', () => {

    let registry: ContextRegistry;
    let agent: HttpFetchAgent;

    beforeEach(() => {
      registry = new ContextRegistry();

      const values = registry.newValues();

      agent = values.get(HttpFetchAgent);
    });

    let request: Request;
    let mockFetch: Mock<OnEvent<[Response]>, [RequestInfo?, RequestInit?]>;
    let emitter: EventEmitter<[Response]>;

    beforeEach(() => {
      request = new Request('http://localhost/test');
      emitter = new EventEmitter<[Response]>();
      mockFetch = jest.fn((_request?, _init?) => emitter.on);
    });

    it('performs the fetch without agents', () => {
      expect(agent(mockFetch, request)).toBe(emitter.on);
      expect(mockFetch).toHaveBeenCalledWith(request);
    });
    it('performs the fetch without agents with `null` fallback value', () => {
      agent = registry.newValues().get(HttpFetchAgent, { or: null })!;
      expect(agent(mockFetch, request)).toBe(emitter.on);
      expect(mockFetch).toHaveBeenCalledWith(request);
    });
    it('performs the fetch without agents by fallback agent', () => {

      const mockAgent = jest.fn();

      agent = registry.newValues().get(HttpFetchAgent, { or: mockAgent });
      agent(mockFetch, request);
      expect(mockAgent).toHaveBeenCalledWith(expect.anything(), request);
    });
    it('calls the registered agent', async () => {

      const emitter2 = new EventEmitter<[Response]>();
      const mockAgent = jest.fn(() => emitter2.on);

      registry.provide({ a: HttpFetchAgent, is: mockAgent });

      const response1 = new Response('response1');
      const response2 = new Response('response2');
      const response = await new Promise<Response>(resolve => {
        onSupplied(agent(mockFetch, request)).once(resolve);
        emitter.send(response1);
        emitter2.send(response2);
      });

      expect(response).toBe(response2);
    });
    it('performs the fetch by calling `next`', async () => {
      registry.provide({ a: HttpFetchAgent, is: next => next() });

      expect(agent(mockFetch, request)).toBe(emitter.on);
      expect(mockFetch).toHaveBeenCalledWith(request);
    });
    it('calls the next agent in chain by calling `next`', async () => {

      const mockAgent: Mock<ReturnType<HttpFetchAgent>, Parameters<HttpFetchAgent>> =
          jest.fn((next, _request) => next());

      registry.provide({ a: HttpFetchAgent, is: next => next() });
      registry.provide({ a: HttpFetchAgent, is: mockAgent });

      expect(agent(mockFetch, request)).toBe(emitter.on);
      expect(mockAgent).toHaveBeenCalledWith(expect.any(Function), request);
      expect(mockFetch).toHaveBeenCalledWith(request);
    });
  });
});
