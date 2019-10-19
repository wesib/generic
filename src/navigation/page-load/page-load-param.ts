/**
 * @module @wesib/generic
 */
import { bootstrapDefault } from '@wesib/wesib';
import { SingleContextKey, SingleContextRef } from 'context-values';
import { OnEvent } from 'fun-events';
import { PageParam } from '../page-param';
import { PageLoadResponse } from './page-load-response';
import { PageLoadParam as PageLoadParam_ } from './page-load-param.impl';
import { PageLoadRequest } from './page-load-request';

export const PageLoadParam: SingleContextRef<PageParam<OnEvent<[PageLoadResponse]>, PageLoadRequest>> =
    /*#__PURE__*/ new SingleContextKey<PageParam<OnEvent<[PageLoadResponse]>, PageLoadRequest>>(
    'page-load',
    {
      byDefault: bootstrapDefault(context => new PageLoadParam_(context)),
    },
);
