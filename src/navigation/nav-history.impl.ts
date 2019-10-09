import { bootstrapDefault } from '@wesib/wesib';
import { itsEach } from 'a-iterable';
import { ContextKey__symbol, SingleContextKey } from 'context-values';
import { EnterPageEvent, LeavePageEvent, Navigation, StayOnPageEvent } from '../navigation';
import { PageParam, PageParam__symbol } from './page-param';

const RoutingHistory__key = /*#__PURE__*/ new SingleContextKey<NavHistory>(
    'navigation-history',
    {
      byDefault: bootstrapDefault(() => new NavHistory()),
    },
);

/**
 * @internal
 */
export class NavHistory {

  static get [ContextKey__symbol]() {
    return RoutingHistory__key;
  }

  private future?: PageEntry;
  private current?: PageEntry;
  private readonly _entries = new Map<number, PageEntry>();
  private _lastId = 0;

  constructor() {
  }

  init(navigation: Navigation) {
    navigation.on(event => {
      switch (event.when) {
        case 'open':
        case 'replace':
        case 'stay':

          const { future } = this;

          if (future) {
            this.future = undefined;
            future[event.when](event as (EnterPageEvent & StayOnPageEvent));
          }

          break;
        case 'return':
          this.future = undefined;
          this._return(event);
          break;
      }
    });
  }

  entry(pageId?: number): PageEntry | undefined {
    return pageId != null ? this._entries.get(pageId) : undefined;
  }

  newEntry(currentPageId?: number): PageEntry {
    this.current = currentPageId != null ? this._entries.get(currentPageId) : undefined;
    return this.future = new PageEntry(this, ++this._lastId);
  }

  open(to: PageEntry) {
    this._entries.set(to.id, to);

    const { current } = this;

    if (current) {
      // Forget all entries starting from next one
      for (let entry = current.next; entry; entry = entry.next) {
        this._forget(entry);
      }

      to.prev = current;
      current.next = to;
      current.leave();
    }

    // Assign current entry
    this.current = to;
  }

  replace(by: PageEntry) {
    this._entries.set(by.id, by);

    const current = this.current;

    if (current) {

      const prev = current.prev;

      if (prev) {
        by.prev = prev;
        prev.next = by;
      }

      current.leave();
      this._forget(current);
    }

    this.current = by;
  }

  private _return(event: EnterPageEvent) {

    const pageId: number | undefined = (event as any)[NAV_PAGE_ID];
    const { current } = this;

    if (current) {
      current.leave();
    }

    this.current = pageId ? this._entries.get(pageId) : undefined;
    if (this.current) {
      this.current.enter(event);
    }
  }

  private _forget(entry: PageEntry) {
    this._entries.delete(entry.id);
    entry.forget();
  }

}

/**
 * @internal
 */
export class PageEntry {

  next?: PageEntry;
  prev?: PageEntry;
  private readonly _params = new Map<PageParam<any, any>, PageParam.Handle<any, any>>();

  constructor(readonly _history: NavHistory, readonly id: number) {
  }

  getParam<T>(request: PageParam.Request<T, unknown>): T | undefined {

    const handle: PageParam.Handle<T, unknown> | undefined = this._params.get(request[PageParam__symbol]);

    return handle && handle.get();
  }

  setParam<T, O>(event: LeavePageEvent, request: PageParam.Request<T, O>, options: O): T {

    const param = request[PageParam__symbol];
    const handle: PageParam.Handle<T, O> | undefined = this._params.get(param);

    if (handle) {
      handle.refine(event, options);
      return handle.get();
    }

    const newHandle = param.create(event, options);

    this._params.set(param, newHandle);

    return newHandle.get();
  }

  open(event: EnterPageEvent) {
    this._history.open(this);
    this.enter(event);
  }

  replace(event: EnterPageEvent) {
    this._history.replace(this);
    this.enter(event);
  }

  stay(event: StayOnPageEvent) {
    itsEach(this._params.values(), handle => handle.stay && handle.stay(event));
  }

  enter(event: EnterPageEvent) {
    itsEach(this._params.values(), handle => handle.enter && handle.enter(event));
  }

  leave() {
    itsEach(this._params.values(), handle => handle.leave && handle.leave());
  }

  forget() {
    itsEach(this._params.values(), handle => handle.forget && handle.forget());
    this._params.clear();
  }

}

/**
 * @internal
 */
export const NAV_PAGE_ID = 'wesib:navigation:pageId';

/**
 * @internal
 */
export type NavData = [any, number | undefined];

const NAV_DATA_KEY = 'wesib:navigation:data' as const;

/**
 * @internal
 */
export function toNavData(state?: any): NavData {
  return state != null && typeof state === 'object' ? state[NAV_DATA_KEY] : [state];
}

/**
 * @internal
 */
export function toHistoryState(data?: any, id?: number): any {
  return id != null ? { [NAV_DATA_KEY]: [data, id] } : data;
}
