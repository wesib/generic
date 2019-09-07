import Mocked = jest.Mocked;
import { bootstrapComponents, BootstrapContext, BootstrapWindow, Feature } from '@wesib/wesib';
import { noop } from 'call-thru';
import { EventInterest, EventReceiver } from 'fun-events';
import { HttpFetch } from './http-fetch';

describe('http-fetch', () => {

  let mockWindow: Mocked<Window>;
  let request: RequestInfo;
  let init: RequestInit | undefined;
  let response: Response;

  beforeEach(() => {
    request = { url: 'http://localhost/test' } as any;
    response = { name: 'http response' } as any;
    init = { headers: { 'X-Test': 'true' } };

    mockWindow = {
      fetch: jest.fn(() => Promise.resolve(response)),
    } as any;
  });

  let bsContext: BootstrapContext;

  beforeEach(async () => {

    @Feature({
      set: { a: BootstrapWindow, is: mockWindow },
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

      expect(mockWindow.fetch).toHaveBeenCalledWith(request, init);
      expect(receiver).toHaveBeenCalledWith(response);
      expect(interest.done).toBe(true);
      expect(done).toHaveBeenCalledWith(undefined);
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
      let mockAbortController: Mocked<AbortController>;

      beforeEach(() => {
        target = document.createElement('span');
        document.body.appendChild(target);
        mockAbortController = {
          signal: target as any,
          abort: jest.fn(() => {
            target.dispatchEvent(new CustomEvent('abort'));
          }),
        };
        (mockWindow as any).AbortController = jest.fn(() => mockAbortController);
      });
      afterEach(() => {
        target.remove();
      });

      it('applies abort controller', async () => {
        await fetch();
        expect(mockWindow.fetch).toHaveBeenCalledWith(request, { ...init, signal: mockAbortController.signal });
      });
      it('applies abort controller to absent init options', async () => {
        init = undefined;
        await fetch();
        expect(mockWindow.fetch).toHaveBeenCalledWith(request, { signal: mockAbortController.signal });
      });
      it('losing interest aborts the fetch', async () => {

        const receiver = jest.fn();
        const done = jest.fn();
        const interest = httpFetch(request, init)(receiver).whenDone(done);

        interest.off();

        expect(mockAbortController.abort).toHaveBeenCalled();
      });
      it('does not abort controller when interest is not explicitly lost', async () => {
        await fetch();
        expect(mockAbortController.abort).not.toHaveBeenCalled();
      });
      it('does not abort controller when interest is lost when fetch completed', async () => {

        const interest = await fetch();

        interest.off();

        expect(mockAbortController.abort).not.toHaveBeenCalled();
      });

      let preconfiguredSignal: AbortSignal;

      beforeEach(() => {
        preconfiguredSignal = document.body.appendChild(document.createElement('span')) as any;
      });
      afterEach(() => {
        afterEach(() => {
          (preconfiguredSignal as any).remove();
        });
      });

      it('aborts fetch on preconfigured abort signal', () => {
        init = { signal: preconfiguredSignal };
        fetch();
        preconfiguredSignal.dispatchEvent(new CustomEvent('abort'));
        expect(mockAbortController.abort).toHaveBeenCalled();
      });
      it('receives predefined abort signal', () => {
        (preconfiguredSignal as any).aborted = true;
        init = { signal: preconfiguredSignal };
        fetch();
        expect(mockAbortController.abort).toHaveBeenCalled();
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
