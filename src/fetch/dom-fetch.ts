/**
 * @module @wesib/generic
 */
import { bootstrapDefault } from '@wesib/wesib';
import { FnContextKey, FnContextRef } from 'context-values';
import { EventInterest, OnEvent } from 'fun-events';
import { newDomFetch } from './dom-fetch.impl';

/**
 * DOM contents fetch function signature.
 *
 * Uses [[HttpFetch]] to fetch remote documents. The results can be applied to current document.
 */
export type DomFetch =
/**
 * @param input  The resource to fetch. This can either an URL string, or a `Request` object.
 * @param init  Custom settings to apply to the request.
 *
 * @returns DOM fetch result.
 */
    (
        this: void,
        input: RequestInfo,
        init?: RequestInit,
    ) => DomFetchResult;

/**
 * DOM contents fetch result.
 *
 * This is returned from [[DomFetch]] function. The actual fetch would be initiated once event receiver is registered,
 * or contents requested to be inserted to document.
 */
export interface DomFetchResult {

  /**
   * An `OnEvent` registrar of original response object(s) receivers.
   */
  readonly onResponse: OnEvent<[Response]>;

  /**
   * An `OnEvent` registrar of parsed DOM nodes contained in response.
   */
  readonly onNode: OnEvent<Node[]>;

  /**
   * Inserts the requested DOM nodes into the given document range.
   *
   * Replaces the range contents with received DOM nodes.
   *
   * @param target  Document range to insert received DOM nodes into.
   *
   * @returns An event interest that aborts the fetch when lost.
   */
  into(target: Range): EventInterest;

}

/**
 * A key of bootstrap context value containing an [[DomFetch]] instance.
 */
export const DomFetch: FnContextRef<Parameters<DomFetch>, ReturnType<DomFetch>> =
    /*#__PURE__*/ new FnContextKey<Parameters<DomFetch>, ReturnType<DomFetch>>(
    'dom-fetch',
    {
      byDefault: bootstrapDefault(newDomFetch),
    },
);
