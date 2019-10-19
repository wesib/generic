/**
 * @module @wesib/generic
 */
import { bootstrapDefault } from '@wesib/wesib';
import { SingleContextKey, SingleContextRef } from 'context-values';
import { PageParam } from '../page-param';
import { PageLoadParam as PageLoadParam_ } from './page-load-param.impl';
import { PageLoadRequest } from './page-load-request';

export const PageLoadParam: SingleContextRef<PageParam<void, PageLoadRequest>> =
    /*#__PURE__*/ new SingleContextKey<PageParam<void, PageLoadRequest>>(
    'page-load',
    {
      byDefault: bootstrapDefault(context => new PageLoadParam_(context)),
    },
);
