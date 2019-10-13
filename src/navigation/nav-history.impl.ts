import { BootstrapContext, bootstrapDefault, BootstrapWindow } from '@wesib/wesib';
import { itsEach } from 'a-iterable';
import { ContextKey__symbol, SingleContextKey } from 'context-values';
import { Navigation } from './navigation';
import { EnterPageEvent, LeavePageEvent, NavigationEventType, StayOnPageEvent } from './navigation.event';
import { Page } from './page';
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

  private readonly _document: Document;
  private readonly _location: Location;
  private readonly _history: History;
  private readonly _entries = new Map<number, PageEntry>();
  private _lastId = 0;

  constructor(bsContext: BootstrapContext) {

    const window = bsContext.get(BootstrapWindow);

    this._document = window.document;
    this._location = window.location;
    this._history = window.history;
  }

  init(): PageEntry {

    const [data] = toNavData(this._history.state);
    const entry = this.newEntry({
      url: new URL(this._location.href),
      data,
      title: this._document.title,
    });

    this._entries.set(entry.id, entry);
    entry.enter('init');

    return entry;
  }

  newEntry(target: Navigation.URLTarget): PageEntry {
    return new PageEntry(this, ++this._lastId, target);
  }

  leave(
      when: 'pre-open' | 'pre-replace',
      fromEntry: PageEntry,
      toTarget: Navigation.URLTarget,
  ): [LeavePageEvent, PageEntry] {

    const toEntry = this.newEntry(toTarget);

    return [
      new LeavePageEvent(
          NavigationEventType.LeavePage,
          {
            when,
            from: fromEntry.page,
            to: toEntry.page,
          },
      ),
      toEntry,
    ];
  }

  pushState(fromEntry: PageEntry | undefined, toEntry: PageEntry): EnterPageEvent {
    this._entries.set(toEntry.id, toEntry);
    if (fromEntry) {
      // Forget all entries starting from next one
      for (let e = fromEntry.next; e; e = e.next) {
        this._forget(e);
      }

      toEntry.prev = fromEntry;
      fromEntry.next = toEntry;
      fromEntry.leave();
    }

    const enterPage = new EnterPageEvent(
        NavigationEventType.EnterPage,
        {
          when: 'open',
          to: toEntry.page,
        },
    );

    toEntry.enter('open');

    return enterPage;
  }

  replaceState(fromEntry: PageEntry | undefined, toEntry: PageEntry): EnterPageEvent {
    this._entries.set(toEntry.id, toEntry);
    if (fromEntry) {

      const prev = fromEntry.prev;

      if (prev) {
        toEntry.prev = prev;
        prev.next = toEntry;
      }

      fromEntry.leave();
      this._forget(fromEntry);
    }

    const enterPage = new EnterPageEvent(
        NavigationEventType.EnterPage,
        {
          when: 'replace',
          to: toEntry.page,
        },
    );

    toEntry.enter('replace');

    return enterPage;
  }

  private _forget(entry: PageEntry) {
    this._entries.delete(entry.id);
    entry.forget();
  }

  stay(at: PageEntry, to: Navigation.URLTarget, toEntry?: PageEntry, reason?: any): StayOnPageEvent {

    const stay = new StayOnPageEvent(
        NavigationEventType.StayOnPage,
        {
          from: at.page,
          to,
          reason,
        },
    );

    if (toEntry) {
      toEntry.stay(at.page);
    }

    return stay;
  }

  return(fromEntry: PageEntry | undefined, popState: PopStateEvent): [EnterPageEvent, PageEntry] {
    if (fromEntry) {
      fromEntry.leave();
    }

    const [data, pageId] = toNavData(popState.state);
    const existingEntry = pageId != null ? this._entries.get(pageId) : undefined;
    let toEntry: PageEntry;

    if (existingEntry) {
      toEntry = existingEntry;
    } else {
      toEntry = this.newEntry({
        url: new URL(this._location.href),
        data,
        title: this._document.title,
      });
      this._entries.set(toEntry.id, toEntry);
    }

    const enterPage = new EnterPageEvent(
        NavigationEventType.EnterPage,
        {
          when: 'return',
          to: toEntry.page,
        },
    );

    toEntry.enter('return');

    return [enterPage, toEntry];
  }

}

/**
 * @internal
 */
export class PageEntry {

  next?: PageEntry;
  prev?: PageEntry;
  readonly page: Page;
  private _whenEntered?: 'init' | 'open' | 'replace' | 'return';
  private readonly _params = new Map<PageParam<any, any>, PageParam.Handle<any, any>>();

  constructor(
      readonly _history: NavHistory,
      readonly id: number,
      target: Navigation.URLTarget,
  ) {

    const entry = this;

    this.page = {
      url: target.url,
      title: target.title,
      data: target.data,
      get(request) {
        return entry.get(request);
      },
      set(request, options) {
        entry.set(request, options);
      }
    };
  }

  get<T>(request: PageParam.Request<T, unknown>): T | undefined {

    const handle: PageParam.Handle<T, unknown> | undefined = this._params.get(request[PageParam__symbol]);

    return handle && handle.get();
  }

  set<T, O>(request: PageParam.Request<T, O>, options: O): T {

    const param = request[PageParam__symbol];
    const handle: PageParam.Handle<T, O> | undefined = this._params.get(param);

    if (handle) {
      handle.refine(this.page, options);
      return handle.get();
    }

    const newHandle = param.create(this.page, options);

    this._params.set(param, newHandle);
    if (this._whenEntered && newHandle.enter) {
      newHandle.enter(this.page, this._whenEntered);
    }

    return newHandle.get();
  }

  stay(at: Page) {
    itsEach(this._params.values(), handle => handle.stay && handle.stay(at));
  }

  enter(when: 'init' | 'open' | 'replace' | 'return') {
    this._whenEntered = when;
    itsEach(this._params.values(), handle => handle.enter && handle.enter(this.page, when));
  }

  leave() {
    this._whenEntered = undefined;
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