import { BootstrapContext, bootstrapDefault, BootstrapWindow } from '@wesib/wesib';
import { itsEach } from 'a-iterable';
import { ContextKey__symbol, SingleContextKey } from 'context-values';
import { Navigation } from './navigation';
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
    this._history.replaceState(toHistoryState(data, entry.id), '');

    return entry;
  }

  newEntry(target: Navigation.URLTarget): PageEntry {
    return new PageEntry(++this._lastId, target);
  }

  open(fromEntry: PageEntry, toEntry: PageEntry) {

    const { page: { data, title = '', url } } = toEntry;

    this._history.pushState(
        toHistoryState(data, toEntry.id),
        title,
        url.href,
    );

    this._entries.set(toEntry.id, toEntry);
    // Forget all entries starting from next one
    for (let e = fromEntry.next; e; e = e.next) {
      this._forget(e);
    }

    toEntry.prev = fromEntry;
    fromEntry.next = toEntry;
    fromEntry.leave();
    toEntry.enter('open');
  }

  replace(fromEntry: PageEntry, toEntry: PageEntry) {

    const { page: { data, title = '', url } } = toEntry;

    this._history.replaceState(
        toHistoryState(data, toEntry.id),
        title,
        url.href,
    );

    this._entries.set(toEntry.id, toEntry);

    const prev = fromEntry.prev;

    if (prev) {
      toEntry.prev = prev;
      prev.next = toEntry;
    }

    fromEntry.leave();
    this._forget(fromEntry);
    toEntry.enter('replace');
  }

  return(fromEntry: PageEntry, popState: PopStateEvent): PageEntry {
    fromEntry.leave();

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

    toEntry.enter('return');

    return toEntry;
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
  readonly page: Page;
  private _current: 0 | 1 = 0;
  private readonly _params = new Map<PageParam<any, any>, PageParam.Handle<any, any>>();

  constructor(
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
      handle.refine(options);
      return handle.get();
    }

    const newHandle = param.create(this.page, options);

    this._params.set(param, newHandle);
    if (this._current && newHandle.enter) {
      newHandle.enter(this.page, 'init');
    }

    return newHandle.get();
  }

  transfer(to: PageEntry, when: 'pre-open' | 'pre-replace') {
    itsEach(this._params.entries(), ([param, handle]) => {
      if (handle.transfer) {

        const transferred = handle.transfer(to.page, when);

        if (transferred) {
          to._params.set(param, transferred);
        }
      }
    });
  }

  stay(at: Page) {
    itsEach(this._params.values(), handle => handle.stay && handle.stay(at));
  }

  enter(when: 'init' | 'open' | 'replace' | 'return') {
    this._current = 1;
    itsEach(this._params.values(), handle => handle.enter && handle.enter(this.page, when));
  }

  leave() {
    this._current = 0;
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
export function toHistoryState(data: any, id: number): any {
  return { [NAV_DATA_KEY]: [data, id] };
}
