import Mocked = jest.Mocked;
import { bootstrapComponents, BootstrapContext, BootstrapWindow, Feature } from '@wesib/wesib';
import { noop } from 'call-thru';
import { EventInterest, EventReceiver } from 'fun-events';
import { HttpFetch } from './http-fetch';
import { HttpFetchAgent } from './http-fetch-agent';
import Mock = jest.Mock;
import SpyInstance = jest.SpyInstance;

describe('fetch', () => {

  let mockWindow: Mocked<Window>;
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
      set: [
        { a: BootstrapWindow, is: mockWindow },
        { a: HttpFetchAgent, is: mockAgent },
      ],
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
      const interest = await fetch(receiver, done);

      expect(mockWindow.fetch).toHaveBeenCalledWith(new Request(request, init));
      expect(receiver).toHaveBeenCalledWith(response);
      expect(interest.done).toBe(true);
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

      const interest = await fetch(receiver, done);

      expect(receiver).not.toHaveBeenCalled();
      expect(interest.done).toBe(true);
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
      it('losing interest aborts the fetch', async () => {

        const receiver = jest.fn();
        const done = jest.fn();
        const interest = httpFetch(request, init)(receiver).whenDone(done);

        interest.off();

        expect(abortSpy).toHaveBeenCalled();
      });
      it('does not abort controller when interest is not explicitly lost', async () => {
        await fetch();
        expect(abortSpy).not.toHaveBeenCalled();
      });
      it('does not abort controller when interest is lost when fetch completed', async () => {

        const interest = await fetch();

        interest.off();

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
    ): Promise<EventInterest> {
      return new Promise<EventInterest>(resolve => {

        const interest = httpFetch(request, init)(receiver);

        interest.whenDone(reason => {
          done(reason);
          resolve(interest);
        });
      });
    }
  });

});
