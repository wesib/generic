/**
 * @packageDocumentation
 * @module @wesib/generic
 */
import { bootstrapDefault } from '@wesib/wesib';
import { FnContextKey, FnContextRef } from 'context-values/updatable';
import { OnEvent } from 'fun-events';
import { newHttpFetch } from './http-fetch.impl';

/**
 * HTTP fetch function signature.
 *
 * This is a function that wraps browser's
 * [fetch()](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch) function and provides
 * additional functionality. E.g. request interception.
 *
 * This function returns an `OnEvent` sender instead of a `Promise`. This allows to report multiple responses.
 * E.g. when the resource refresh requested and delivered. The request is sent whenever a receiver is registered
 * in this sender. When the fetch completes the response supply is cut off, and callbacks registered with its
 * `whenOff()` method are notified. When fetch fails for whatever reason, this reason is passed to these callbacks.
 * The fetch can be aborted by cutting off the response supply. I.e. by calling its `off()` method.
 *
 * An instance of [[HttpFetch]] is available from bootstrap context.
 */
export type HttpFetch =
/**
 * @param input  The resource to fetch. This can either an URL string, or a `Request` object.
 * @param init  Custom settings to apply to the request.
 *
 * @returns An `OnEvent` sender of responses.
 */
    (this: void, input: RequestInfo, init?: RequestInit) => OnEvent<[Response]>;

/**
 * A key of bootstrap context value containing an [[HttpFetch]] instance.
 */
export const HttpFetch: FnContextRef<Parameters<HttpFetch>, ReturnType<HttpFetch>> = (
    /*#__PURE__*/ new FnContextKey<Parameters<HttpFetch>, ReturnType<HttpFetch>>(
        'http-fetch',
        {
          byDefault: bootstrapDefault(newHttpFetch),
        },
    )
);
