import { bootstrapComponents, BootstrapContext, Feature } from '@wesib/wesib';
import { noop } from 'call-thru';
import { EventEmitter, eventInterest, EventInterest, EventReceiver, onEventBy } from 'fun-events';
import { DomFetch } from './dom-fetch';
import { HttpFetch } from './http-fetch';
import Mock = jest.Mock;
import Mocked = jest.Mocked;

describe('fetch', () => {

  let mockHttpFetch: Mock<ReturnType<HttpFetch>, Parameters<HttpFetch>>;
  let request: RequestInfo;
  let init: RequestInit | undefined;
  let mockResponse: Mocked<Response>;
  let mockResponseHeaders: Mocked<Headers>;

  beforeEach(() => {
    request = { url: 'http://localhost/test' } as any;
    init = { headers: { 'X-Test': 'true' } };
    mockResponseHeaders = {
      get: jest.fn(),
    } as any;
    mockResponse = {
      text: jest.fn(),
      headers: mockResponseHeaders,
    } as any;

    mockHttpFetch = jest.fn((_input, _init?) => onEventBy(receiver => {

      const emitter = new EventEmitter<[Response]>();
      const interest = emitter.on(receiver);

      Promise.resolve().then(
          () => emitter.send(mockResponse),
      ).then(
          () => interest.off(),
      );

      return interest;
    }));
  });

  let bsContext: BootstrapContext;

  beforeEach(async () => {
    @Feature({
      set: [
        { a: HttpFetch, is: mockHttpFetch },
      ],
    })
    class TestFeature {}

    bsContext = await new Promise(resolve => {

      const ctx = bootstrapComponents(TestFeature);

      ctx.whenReady(() => resolve(ctx));
    });
  });

  describe('DomFetch', () => {

    let domFetch: DomFetch;

    beforeEach(() => {
      domFetch = bsContext.get(DomFetch);
    });

    it('is available in bootstrap context', () => {
      expect(domFetch).toBeInstanceOf(Function);
    });

    describe('onResponse', () => {
      it('fetches using `HttpFetch`', async () => {

        const receiver = jest.fn();
        const done = jest.fn();
        const interest = await fetchResponse(receiver, done);

        expect(mockHttpFetch).toHaveBeenCalledWith(request, init);
        expect(receiver).toHaveBeenCalledWith(mockResponse);
        expect(interest.done).toBe(true);
        expect(done).toHaveBeenCalledWith(undefined);
      });

      function fetchResponse(
          receiver: EventReceiver<[Response]> = noop,
          done: (reason?: any) => void = noop,
      ): Promise<EventInterest> {
        return new Promise<EventInterest>(resolve => {

          const interest = domFetch(request, init).onResponse(receiver);

          interest.whenDone(reason => {
            done(reason);
            resolve(interest);
          });
        });
      }
    });

    describe('onNode', () => {
      it('parses the response as HTML by default', async () => {
        mockResponse.text.mockImplementation(() => Promise.resolve('<div>test</div>'));

        const receiver = jest.fn();
        const done = jest.fn();
        const interest = await fetchNode(receiver, done);

        expect(receiver).toHaveBeenCalled();
        expect(interest.done).toBe(true);
        expect(done).toHaveBeenCalledWith(undefined);

        const node: Element = receiver.mock.calls[0][0];
        const div: Element = node.querySelector('div') as Element;

        expect(div.ownerDocument).toBeInstanceOf(HTMLDocument);
        expect(div).toBeInstanceOf(HTMLDivElement);
        expect(div.textContent).toBe('test');
      });
      it('parses the response accordingly to `Context-Type` header', async () => {
        mockResponseHeaders.get.mockImplementation(_name => 'application/xml; charset=utf-8');
        mockResponse.text.mockImplementation(
            () => Promise.resolve('<?xml version="1.0"?><content>test</content>'));

        const receiver = jest.fn();
        const done = jest.fn();
        const interest = await fetchNode(receiver, done);

        expect(receiver).toHaveBeenCalled();
        expect(interest.done).toBe(true);
        expect(done).toHaveBeenCalledWith(undefined);

        const node: Element = receiver.mock.calls[0][0];
        const content = node.querySelector('content') as Node;

        expect(content).toBeInstanceOf(Element);
        expect(content).not.toBeInstanceOf(HTMLElement);
        expect(content.textContent).toBe('test');
      });
      it('reports fetch error', async () => {

        const error = new Error('Some error');

        mockHttpFetch = jest.fn((_input, _init?) => onEventBy(() => {

          const failedInterest = eventInterest();

          failedInterest.off(error);

          return failedInterest;
        }));

        const receiver = jest.fn();
        const done = jest.fn();

        mockResponse.text.mockImplementation(() => Promise.reject(error));

        const interest = await fetchNode(receiver, done);

        expect(receiver).not.toHaveBeenCalled();
        expect(interest.done).toBe(true);
        expect(done).toHaveBeenCalledWith(error);
      });
      it('reports parse error', async () => {
        mockResponse.text.mockImplementation(() => Promise.reject(error));

        const receiver = jest.fn();
        const done = jest.fn();
        const error = new Error('Some error');
        const interest = await fetchNode(receiver, done);

        expect(receiver).not.toHaveBeenCalled();
        expect(interest.done).toBe(true);
        expect(done).toHaveBeenCalledWith(error);
      });

      function fetchNode(
          receiver: EventReceiver<[Node]> = noop,
          done: (reason?: any) => void = noop,
      ): Promise<EventInterest> {
        return new Promise<EventInterest>(resolve => {

          const interest = domFetch(request, init).onNode(receiver);

          interest.whenDone(reason => {
            done(reason);
            resolve(interest);
          });
        });
      }
    });

    describe('into', () => {
      it('inserts the the fetched DOM tree into the document', async () => {
        mockResponse.text.mockImplementation(() => Promise.resolve('<div>test</div>'));

        const mockRange: Mocked<Range> = {
          deleteContents: jest.fn(),
          insertNode: jest.fn(),
        } as any;

        domFetch(request).into(mockRange);

        await Promise.resolve();

        expect(mockRange.deleteContents).toHaveBeenCalledWith();
        expect(mockRange.insertNode).toHaveBeenCalled();

        const inserted = mockRange.insertNode.mock.calls[0][0] as Element;
        const div: Element = inserted.querySelector('div') as Element;

        expect(div.textContent).toBe('test');
      });
    });
  });
});
