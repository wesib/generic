import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { CxBuilder, cxConstAsset } from '@proc7ts/context-builder';
import { CxReferenceError, CxValues } from '@proc7ts/context-values';
import { EventEmitter, onceOn, OnEvent, onSupplied } from '@proc7ts/fun-events';
import { noop } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import { Mock } from 'jest-mock';
import { HttpFetchAgent } from './http-fetch-agent';

describe('fetch', () => {
  describe('HttpFetchAgent', () => {

    let cxBuilder: CxBuilder;
    let context: CxValues;
    let agent: HttpFetchAgent;

    beforeEach(() => {
      cxBuilder = new CxBuilder(get => ({ get }));
      context = cxBuilder.context;
      agent = context.get(HttpFetchAgent);
    });

    let request: Request;
    let mockFetch: Mock<OnEvent<[Response]>, [RequestInfo?, RequestInit?]>;
    let emitter: EventEmitter<[Response]>;

    beforeEach(() => {
      request = new Request('http://localhost/test');
      emitter = new EventEmitter<[Response]>();
      mockFetch = jest.fn((_request?, _init?) => emitter.on);
    });

    beforeEach(() => {
      Supply.onUnexpectedAbort(noop);
    });
    afterEach(() => {
      Supply.onUnexpectedAbort();
    });

    it('performs the fetch without agents', () => {
      expect(agent(mockFetch, request)).toBe(emitter.on);
      expect(mockFetch).toHaveBeenCalledWith(request);
    });
    it('returns `null` fallback value without agents', () => {
      agent = context.get(HttpFetchAgent, { or: null })!;
      expect(agent).toBeNull();
    });
    it('calls the registered agent', async () => {

      const emitter2 = new EventEmitter<[Response]>();
      const mockAgent = jest.fn<ReturnType<HttpFetchAgent>, Parameters<HttpFetchAgent>>(() => emitter2.on);

      cxBuilder.provide(cxConstAsset(HttpFetchAgent, mockAgent));

      const response1 = new Response('response1');
      const response2 = new Response('response2');
      const response = await new Promise<Response>(resolve => {
        onSupplied(agent(mockFetch, request)).do(onceOn)(resolve);
        emitter.send(response1);
        emitter2.send(response2);
      });

      expect(response).toBe(response2);
    });
    it('performs the fetch by calling `next`', () => {
      cxBuilder.provide(cxConstAsset(HttpFetchAgent, next => next()));

      expect(agent(mockFetch, request)).toBe(emitter.on);
      expect(mockFetch).toHaveBeenCalledWith(request);
    });
    it('calls the next agent in chain by calling `next`', () => {

      const mockAgent = jest.fn<ReturnType<HttpFetchAgent>, Parameters<HttpFetchAgent>>(
          (next, _request) => next(),
      );

      cxBuilder.provide(cxConstAsset(HttpFetchAgent, next => next()));
      cxBuilder.provide(cxConstAsset(HttpFetchAgent, mockAgent));

      expect(agent(mockFetch, request)).toBe(emitter.on);
      expect(mockAgent).toHaveBeenCalledWith(expect.any(Function), request);
      expect(mockFetch).toHaveBeenCalledWith(request);
    });
    it('throws when context destroyed', () => {

      const reason = new Error('reason');

      cxBuilder.supply.off(reason);

      expect(() => agent(mockFetch, request)).toThrow(new CxReferenceError(
          HttpFetchAgent,
          'The [HttpFetchAgent] is unavailable',
          reason,
      ));
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});
