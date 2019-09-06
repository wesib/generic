import Mocked = jest.Mocked;
import { bootstrapComponents, BootstrapContext, BootstrapWindow, Feature } from '@wesib/wesib';
import { EventInterest } from 'fun-events';
import { HttpFetch } from './http-fetch';

describe('http-fetch', () => {

  let mockWindow: Mocked<Window>;
  let request: RequestInfo;
  let init: RequestInit;
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

    let fetch: HttpFetch;

    beforeEach(() => {
      fetch = bsContext.get(HttpFetch);
    });

    it('is available in bootstrap context', () => {
      expect(fetch).toBeInstanceOf(Function);
    });
    it('fetches using `fetch()`', async () => {

      const receiver = jest.fn();
      const done = jest.fn();
      const interest = await new Promise<EventInterest>(resolve => {
        const fetchInterest = fetch(request, init)(resp => {
          receiver(resp);
          resolve(fetchInterest);
        }).whenDone(done);
      });

      expect(mockWindow.fetch).toHaveBeenCalledWith(request, init);
      expect(receiver).toHaveBeenCalledWith(response);
      expect(interest.done).toBe(true);
      expect(done).toHaveBeenLastCalledWith(undefined);
    });
  });
});
