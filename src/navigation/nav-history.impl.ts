import { BootstrapContext, bootstrapDefault, BootstrapWindow } from '@wesib/wesib';
import { itsEach } from 'a-iterable';
import { noop } from 'call-thru';
import { ContextKey__symbol, SingleContextKey } from 'context-values';
import {
  EnterPageEvent,
  LeavePageEvent,
  Navigation,
  NavigationEventType,
  Page,
  StayOnPageEvent,
  TargetPage,
} from '../navigation';
import { PageParam, PageParam__symbol } from './page-param';

const RoutingHistory__key = /*#__PURE__*/ new SingleContextKey<NavHistory>(
    'navigation-history',
    {
      byDefault: bootstrapDefault(ctx => new NavHistory(ctx)),
    },
);

/**
 * @internal
 */
export class NavHistory {

  static get [ContextKey__symbol]() {
    return RoutingHistory__key;
  }

  private readonly _location: Location;
  private readonly _history: History;
  private readonly _entries = new Map<number, PageEntry>();
  private _lastId = 0;

  constructor(bsContext: BootstrapContext) {
    const window = bsContext.get(BootstrapWindow);
    this._location = window.location;
    this._history = window.history;
  }

  init(): Page {

    const [data] = toNavData(this._history.state);

    return {
      url: new URL(this._location.href),
      data,
      get: noop,
    };
  }

  leave(
      when: 'pre-open' | 'pre-replace',
      from: Page,
      to: Navigation.URLTarget,
  ): [LeavePageEvent, PageEntry] {

    const toEntry = new PageEntry(this, ++this._lastId);

    class LeaveEvent extends LeavePageEvent {

      set<T, O>(request: PageParam.Request<T, O>, options: O): this {
        toEntry.setParam(this, request, options);
        return this;
      }

    }

    return [
      new LeaveEvent(
          NavigationEventType.LeavePage,
          {
            when,
            from,
            to: {
              url: to.url,
              title: to.title,
              data: to.data,
              get(request) {
                return toEntry.getParam(request);
              },
            },
          },
      ),
      toEntry,
    ];
  }

  private _entry(pageId?: number): PageEntry | undefined {
    return pageId != null ? this._entries.get(pageId) : undefined;
  }

  open(fromEntry: PageEntry | undefined, page: TargetPage, entry: PageEntry): EnterPageEvent {
    this._entries.set(entry.id, entry);
    if (fromEntry) {
      // Forget all entries starting from next one
      for (let e = fromEntry.next; e; e = e.next) {
        this._forget(e);
      }

      entry.prev = fromEntry;
      fromEntry.next = entry;
      fromEntry.leave();
    }

    const enterPage = new EnterPageEvent(
        NavigationEventType.EnterPage,
        {
          when: 'open',
          to: {
            url: page.url,
            data: page.data,
            get(request) {
              return entry.getParam(request);
            },
          },
        },
    );

    entry.enter(enterPage);

    return enterPage;
  }

  replace(fromEntry: PageEntry | undefined, page: TargetPage, entry: PageEntry): EnterPageEvent {
    this._entries.set(entry.id, entry);
    if (fromEntry) {

      const prev = fromEntry.prev;

      if (prev) {
        entry.prev = prev;
        prev.next = entry;
      }

      fromEntry.leave();
      this._forget(fromEntry);
    }

    const enterPage = new EnterPageEvent(
        NavigationEventType.EnterPage,
        {
          when: 'replace',
          to: {
            url: page.url,
            data: page.data,
            get(request) {
              return entry.getParam(request);
            },
          },
        },
    );

    entry.enter(enterPage);

    return enterPage;
  }

  stay(from: Page, to: Navigation.URLTarget, toEntry: PageEntry | undefined, reason?: any): StayOnPageEvent {

    const stay = new StayOnPageEvent(
        NavigationEventType.StayOnPage,
        {
          from,
          to,
          reason,
        },
    );

    if (toEntry) {
      toEntry.stay(stay);
    }

    return stay;
  }

  return(fromEntry: PageEntry | undefined, popState: PopStateEvent): [EnterPageEvent, PageEntry?] {
    if (fromEntry) {
      fromEntry.leave();
    }

    const [data, pageId] = toNavData(popState.state);
    const entry = this._entry(pageId);
    const to: Page = {
      url: new URL(this._location.href),
      data: data,
      get: entry ? request => entry.getParam(request) : noop,
    };
    const enterPage = new EnterPageEvent(
        NavigationEventType.EnterPage,
        {
          when: 'return',
          to,
        },
    );

    if (entry) {
      entry.enter(enterPage);
    }

    return [enterPage, entry];
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

type NavData = [any, number | undefined];

const NAV_DATA_KEY = 'wesib:navigation:data' as const;

function toNavData(state?: any): NavData {
  return state != null && typeof state === 'object' ? state[NAV_DATA_KEY] : [state];
}

/**
 * @internal
 */
export function toHistoryState(data?: any, id?: number): any {
  return id != null ? { [NAV_DATA_KEY]: [data, id] } : data;
}
