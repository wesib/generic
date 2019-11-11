import { BootstrapContext, bootstrapDefault, BootstrapWindow } from '@wesib/wesib';
import { itsEach } from 'a-iterable';
import { noop } from 'call-thru';
import { ContextKey__symbol, ContextRegistry, SingleContextKey } from 'context-values';
import { ValueTracker } from 'fun-events';
import { Navigation } from './navigation';
import { Page } from './page';
import { PageParam, PageParam__symbol } from './page-param';
import { PageParamContext } from './page-param-context';

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
  private readonly _uid: string;
  private _lastId = 0;

  constructor(private readonly _context: BootstrapContext) {
    const window = _context.get(BootstrapWindow);

    this._document = window.document;
    this._location = window.location;
    this._history = window.history;
    this._uid = btoa(String(Math.random()));
  }

  init(): PageEntry {

    const { data } = extractNavData(this._history.state);
    const entry = this.newEntry({
      url: new URL(this._location.href),
      data,
      title: this._document.title,
    });

    this._entries.set(entry.id, entry);
    entry.schedule(() => {
      entry.enter('init');
      this._history.replaceState(this._historyState(entry), '');
    });

    return entry;
  }

  newEntry(target: Navigation.URLTarget): PageEntry {
    return new PageEntry(this._context, ++this._lastId, target);
  }

  open(
      toEntry: PageEntry,
      tracker: ValueTracker<PageEntry>,
  ) {

    const { page: { title = '', url } } = toEntry;

    this._history.pushState(
        this._historyState(toEntry),
        title,
        url.href,
    );

    this._enter('open', toEntry, tracker);
  }

  private _enter(
      when: 'open' | 'enter',
      toEntry: PageEntry,
      tracker: ValueTracker<PageEntry>,
  ) {

    const fromEntry = tracker.it;

    this._entries.set(toEntry.id, toEntry);

    try {
      // Forget all entries starting from next one
      for (let e = fromEntry.next; e; e = e.next) {
        this._forget(e);
      }
    } finally {
      toEntry.prev = fromEntry;
      fromEntry.next = toEntry;
      toEntry.schedule(() => {
        try {
          fromEntry.leave();
        } finally {
          toEntry.enter(when);
        }
      });
      tracker.it = toEntry;
    }
  }

  replace(
      toEntry: PageEntry,
      tracker: ValueTracker<PageEntry>,
  ) {

    const fromEntry = tracker.it;
    const { page: { title = '', url } } = toEntry;

    this._history.replaceState(
        this._historyState(toEntry),
        title,
        url.href,
    );

    this._entries.set(toEntry.id, toEntry);

    const prev = fromEntry.prev;

    if (prev) {
      toEntry.prev = prev;
      prev.next = toEntry;
    }

    toEntry.schedule(() => {
      try {
        fromEntry.leave();
      } finally {
        try {
          this._forget(fromEntry);
        } finally {
          toEntry.enter('replace');
        }
      }
    });
    tracker.it = toEntry;
  }

  popState(
      popState: PopStateEvent,
      tracker: ValueTracker<PageEntry>,
  ): PageEntry {

    const fromEntry = tracker.it;
    const { state } = popState;
    const { uid, data, id: pageId } = extractNavData(state);
    let toEntry: PageEntry;

    if (state == null) {
      toEntry = this.newEntry({
        url: new URL(this._location.href),
        data,
        title: this._document.title,
      });
      // hashchange. Not a return.
      try {
        fromEntry.transfer(toEntry, 'enter');
      } finally {
        this._history.replaceState(this._historyState(toEntry), '');
        this._enter('enter', toEntry, tracker);
      }

      return toEntry;
    }

    const existingEntry = uid === this._uid && pageId != null ? this._entries.get(pageId) : undefined;

    if (existingEntry) {
      toEntry = existingEntry;
    } else {
      // Returning to page existed in previous app version
      toEntry = this.newEntry({
        url: new URL(this._location.href),
        data,
        title: this._document.title,
      });
      fromEntry.transfer(toEntry, 'return');
      this._entries.set(toEntry.id, toEntry);
      this._history.replaceState(this._historyState(toEntry), '');
    }

    toEntry.schedule(() => {
      try {
        fromEntry.leave();
      } finally {
        toEntry.enter('return');
      }
    });

    tracker.it = toEntry;

    return toEntry;
  }

  private _forget(entry: PageEntry) {
    this._entries.delete(entry.id);
    entry.forget();
  }

  private _historyState({ id, page: { data } }: PageEntry): NavDataEnvelope {
    return {
      [NAV_DATA_KEY]: {
        uid: this._uid,
        id,
        data,
      }
    };
  }

}

/**
 * @internal
 */
export interface PartialNavData {
  readonly uid?: string;
  readonly id?: number;
  readonly data: any;
}

/**
 * @internal
 */
export interface NavData extends PartialNavData {
  readonly uid: string;
  readonly id: number;
}

/**
 * @internal
 */
export const NAV_DATA_KEY = 'wesib:navigation:data' as const;

/**
 * @internal
 */
export interface NavDataEnvelope {
  readonly [NAV_DATA_KEY]: NavData;
}

function extractNavData(state?: any): PartialNavData {
  return state == null || typeof state !== 'object' ? { data: state } : state[NAV_DATA_KEY];
}

/**
 * @internal
 */
export class PageEntry {

  next?: PageEntry;
  prev?: PageEntry;
  private _status: PageStatus = PageStatus.New;
  readonly page: Page;
  private readonly _params = new Map<PageParam<any, any>, PageParam.Handle<any, any>>();
  private _update: () => void = noop;

  constructor(
      private readonly _context: BootstrapContext,
      readonly id: number,
      target: Navigation.URLTarget,
  ) {

    const entry = this;

    this.page = {
      url: target.url,
      title: target.title,
      data: target.data,
      get visited() {
        return !!entry._status;
      },
      get current() {
        return entry._status === PageStatus.Current;
      },
      get(ref) {
        return entry.get(ref);
      },
      put(ref, input) {
        entry.put(ref, input);
      }
    };
  }

  get<T>(ref: PageParam.Ref<T, unknown>): T | undefined {

    const handle: PageParam.Handle<T, unknown> | undefined = this._params.get(ref[PageParam__symbol]);

    return handle && handle.get();
  }

  put<T, I>(ref: PageParam.Ref<T, I>, input: I): T {

    const param = ref[PageParam__symbol];
    const handle: PageParam.Handle<T, I> | undefined = this._params.get(param);

    if (handle) {
      handle.put(input);
      return handle.get();
    }

    const registry = new ContextRegistry<ParamContext>(this._context);

    class ParamContext extends PageParamContext {
      readonly get: PageParamContext['get'] = registry.newValues().get;
    }

    const newHandle = param.create(this.page, input, new ParamContext());

    this._params.set(param, newHandle);
    if (this.page.current && newHandle.enter) {
      newHandle.enter(this.page, 'init');
    }

    return newHandle.get();
  }

  transfer(to: PageEntry, when: 'pre-open' | 'pre-replace' | 'enter' | 'return') {
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

  enter(when: 'init' | 'open' | 'replace' | 'enter' | 'return') {
    this._status = PageStatus.Current;
    itsEach(this._params.values(), handle => handle.enter && handle.enter(this.page, when));
  }

  leave() {
    this._status = PageStatus.Visited;
    itsEach(this._params.values(), handle => handle.leave && handle.leave());
  }

  forget() {
    itsEach(this._params.values(), handle => handle.forget && handle.forget());
    this._params.clear();
  }

  schedule(update: () => void) {
    this._update = update;
  }

  apply() {

    const update = this._update;

    this._update = noop;
    update();
  }

}

const enum PageStatus {
  New,
  Visited,
  Current,
}
