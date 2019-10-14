/**
 * @module @wesib/generic
 */
import { bootstrapDefault } from '@wesib/wesib';
import { SingleContextKey, SingleContextRef } from 'context-values';
import { EventReceiver, OnEvent } from 'fun-events';
import { PageParam } from '../page-param';
import { PageLoad } from './page-load';
import { PageLoadParam as PageLoadParam_ } from './page-load-param.impl';

export const PageLoadParam: SingleContextRef<PageParam<OnEvent<[PageLoad]>, EventReceiver<[PageLoad]>>> =
    /*#__PURE__*/ new SingleContextKey<PageParam<OnEvent<[PageLoad]>, EventReceiver<[PageLoad]>>>(
    'page-load',
    {
      byDefault: bootstrapDefault(context => new PageLoadParam_(context)),
    },
);
