import Mock = jest.Mock;
import Mocked = jest.Mocked;
import SpyInstance = jest.SpyInstance;
import { bootstrapComponents, BootstrapContext, BootstrapWindow, Feature } from '@wesib/wesib';
import { noop } from 'call-thru';
import { EventReceiver, EventSupply } from 'fun-events';
import { HttpFetch } from './http-fetch';
import { HttpFetchAgent } from './http-fetch-agent';

describe('fetch', () => {

  let mockWindow: Mocked<BootstrapWindow>;
  let request: RequestInfo;
  let init: RequestInit | undefined;
  let response: Response;

  beforeEach(() => {
    request = new Request('http://localhost/test');
    response = new Response('http response');
    init = { headers: { 'X-Test': 'true' } };

    mockWindow = {
      fetch: jest.fn(() => Promise.resolve(response)),
    } as any;
  });

  let bsContext: BootstrapContext;
  let mockAgent: Mock<ReturnType<HttpFetchAgent>, Parameters<HttpFetchAgent>>;

  beforeEach(async () => {
    mockAgent = jest.fn((next, _request) => next());

    @Feature({
      setup(setup) {
        setup.provide({ a: BootstrapWindow, is: mockWindow });
        setup.provide({ a: HttpFetchAgent, is: mockAgent });
      },
    })
    class TestFeature {}

    bsContext = await new Promise(resolve => {

      const ctx = bootstrapComponents(TestFeature);

      ctx.whenReady(() => resolve(ctx));
    });
  });

  describe('HttpFetch', () => {

    let httpFetch: HttpFetch;

    beforeEach(() => {
      httpFetch = bsContext.get(HttpFetch);
    });

    it('is available in bootstrap context', () => {
      expect(httpFetch).toBeInstanceOf(Function);
    });
    it('fetches using `fetch()`', async () => {

      const receiver = jest.fn();
      const done = jest.fn();
      const supply = await fetch(receiver, done);

      expect(mockWindow.fetch).toHaveBeenCalledWith(new Request(request, init));
      expect(receiver).toHaveBeenCalledWith(response);
      expect(supply.isOff).toBe(true);
      expect(done).toHaveBeenCalledWith(undefined);
    });
    it('calls agent', async () => {
      await fetch();
      expect(mockAgent).toHaveBeenCalledWith(expect.any(Function), new Request(request, init));
      expect(mockWindow.fetch).toHaveBeenCalledWith(new Request(request, init));
    });
    it('respects agent modification', async () => {

      const request2 = new Request('http://localhost/test2');

      mockAgent.mockImplementation((next) => next(request2));

      await fetch();
      expect(mockAgent).toHaveBeenCalledWith(expect.any(Function), new Request(request, init));
      expect(mockWindow.fetch).toHaveBeenCalledWith(request2);
    });
    it('reports error when fetch fails', async () => {

      const receiver = jest.fn();
      const done = jest.fn();
      const error = new Error('Some error');

      mockWindow.fetch.mockImplementation(() => Promise.reject(error));

      const supply = await fetch(receiver, done);

      expect(receiver).not.toHaveBeenCalled();
      expect(supply.isOff).toBe(true);
      expect(done).toHaveBeenCalledWith(error);
    });

    describe('abort signal', () => {

      let target: HTMLElement;
      let AbortControllerSpy: SpyInstance<AbortController>;
      let abortController: AbortController;
      let abortSpy: SpyInstance<void, []>;

      beforeEach(() => {
        target = document.createElement('span');
        document.body.appendChild(target);

        const Original = AbortController;

        AbortControllerSpy = jest.spyOn(window as any, 'AbortController').mockImplementation(() => {
          abortController = new Original();
          abortSpy = jest.spyOn(abortController, 'abort');
          return abortController;
        });

        (mockWindow as any).AbortController = AbortControllerSpy;
      });
      afterEach(() => {
        target.remove();
      });

      it('applies abort controller', async () => {
        await fetch();
        expect(mockWindow.fetch)
            .toHaveBeenCalledWith(new Request(request, { ...init, signal: abortController.signal }));
      });
      it('applies abort controller to absent init options', async () => {
        init = undefined;
        await fetch();
        expect(mockWindow.fetch).toHaveBeenCalledWith(new Request(request, { signal: abortController.signal }));
      });
      it('supply cut off aborts the fetch', async () => {

        const receiver = jest.fn();
        const done = jest.fn();
        const supply = httpFetch(request, init)(receiver).whenOff(done);

        supply.off();

        expect(abortSpy).toHaveBeenCalled();
      });
      it('does not abort controller when supply cut off is not explicit', async () => {
        await fetch();
        expect(abortSpy).not.toHaveBeenCalled();
      });
      it('does not abort controller when supply cut off after fetch completed', async () => {

        const supply = await fetch();

        supply.off();

        expect(abortSpy).not.toHaveBeenCalled();
      });

      let customController: AbortController;

      beforeEach(() => {
        customController = new AbortController();
      });

      it('aborts fetch on preconfigured abort signal', () => {
        init = { signal: customController.signal };
        fetch();
        customController.abort();
        expect(abortSpy).toHaveBeenCalled();
      });
      it('receives predefined abort signal', () => {
        customController.abort();
        init = { signal: customController.signal };
        fetch();
        expect(abortSpy).toHaveBeenCalled();
      });
    });

    function fetch(
        receiver: EventReceiver<[Response]> = noop,
        done: (reason?: any) => void = noop,
    ): Promise<EventSupply> {
      return new Promise<EventSupply>(resolve => {

        const supply = httpFetch(request, init)(receiver);

        supply.whenOff(reason => {
          done(reason);
          resolve(supply);
        });
      });
    }
  });

});
