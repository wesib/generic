/**
 * @module @wesib/generic
 */
import { bootstrapDefault } from '@wesib/wesib';
import { FnContextKey, FnContextRef } from 'context-values';
import { DomFetchResult } from './dom-fetch-result';
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
 * A key of bootstrap context value containing an [[DomFetch]] instance.
 */
export const DomFetch: FnContextRef<Parameters<DomFetch>, ReturnType<DomFetch>> =
    /*#__PURE__*/ new FnContextKey<Parameters<DomFetch>, ReturnType<DomFetch>>(
    'dom-fetch',
    {
      byDefault: bootstrapDefault(newDomFetch),
    },
);
