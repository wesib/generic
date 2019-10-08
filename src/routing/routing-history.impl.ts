import { bootstrapDefault } from '@wesib/wesib';
import { itsEach } from 'a-iterable';
import { ContextKey__symbol, SingleContextKey } from 'context-values';
import { Navigation, NavigationAgent } from '../navigation';
import { Route } from './route';
import { RouteParam, RouteParam__symbol } from './route-param';
import { Router } from './router';
import { RoutingStart, RoutingStop } from './routing-stage';

const RoutingHistory__key = /*#__PURE__*/ new SingleContextKey<RoutingHistory>(
    'routing-history',
    {
      byDefault: bootstrapDefault(() => new RoutingHistory()),
    },
);

/**
 * @internal
 */
export class RoutingHistory {

  static get [ContextKey__symbol]() {
    return RoutingHistory__key;
  }

  private future?: RoutingHistoryEntry;
  private current?: RoutingHistoryEntry;
  private readonly _entries = new Map<number, RoutingHistoryEntry>();
  private _lastId = 0;

  constructor() {
  }

  init(router: Router) {
    router.on(stage => {
      switch (stage.action) {
        case 'navigate':
        case 'replace':
        case 'abort':

          const { future } = this;

          if (future) {
            this.future = undefined;
            future[stage.action](stage);
          }

          break;
        case 'return':
          this.future = undefined;
          this._return(stage);
          break;
      }
    });
  }

  entry({ data }: Route): RoutingHistoryEntry | undefined {

    const id = routingHistoryId(data);

    return id ? this._entries.get(id) : undefined;
  }

  newEntry({ data }: Navigation.Location): RoutingHistoryEntry {
    if (this.future) {
      return this.future;
    }

    const currentId = routingHistoryId(data);

    this.current = currentId ? this._entries.get(currentId) : undefined;

    return this.future = new RoutingHistoryEntry(this, ++this._lastId);
  }

  navigate(to: RoutingHistoryEntry) {
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

  replace(by: RoutingHistoryEntry) {

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

  private _return(stage: RoutingStop) {

    const id = routingHistoryId(stage.to.data);
    const { current } = this;

    if (current) {
      current.leave();
    }

    this.current = id ? this._entries.get(id) : undefined;
    if (this.current) {
      this.current.enter(stage);
    }
  }

  private _forget(entry: RoutingHistoryEntry) {
    this._entries.delete(entry.id);
    entry.forget();
  }

}

/**
 * @internal
 */
export class RoutingHistoryEntry {

  next?: RoutingHistoryEntry;
  prev?: RoutingHistoryEntry;
  private readonly _params = new Map<RouteParam<any, any>, RouteParam.Handle<any, any>>();

  constructor(readonly _history: RoutingHistory, readonly id: number) {
  }

  getParam<T>(request: RouteParam.Request<T, unknown>): T | undefined {

    const handle: RouteParam.Handle<T, unknown> | undefined = this._params.get(request[RouteParam__symbol]);

    return handle && handle.get();
  }

  setParam<T, O>(stage: RoutingStart, request: RouteParam.Request<T, O>, options: O): T {

    const param = request[RouteParam__symbol];
    const handle: RouteParam.Handle<T, O> | undefined = this._params.get(param);

    if (handle) {
      handle.refine(stage, options);
      return handle.get();
    }

    const newHandle = param.create(stage, options);

    this._params.set(param, newHandle);

    return newHandle.get();
  }

  navigate(stage: RoutingStop) {
    this._history.navigate(this);
    this.enter(stage);
  }

  replace(stage: RoutingStop) {
    this._history.replace(this);
    this.enter(stage);
  }

  abort(stage: RoutingStop) {
    itsEach(this._params.values(), handle => handle.abort && handle.abort(stage));
  }

  enter(stage: RoutingStop) {
    itsEach(this._params.values(), handle => handle.enter && handle.enter(stage));
  }

  leave() {
    itsEach(this._params.values(), handle => handle.leave && handle.leave());
  }

  forget() {
    itsEach(this._params.values(), handle => handle.forget && handle.forget());
    this._params.clear();
  }

}

const ROUTING_HISTORY_ID = 'wesib:routingHistoryId';

/**
 * @internal
 */
export function routingHistoryAgent(history: RoutingHistory): NavigationAgent {
  return (next, _action, from, to) => {

    const future = history.newEntry(from);
    const { data } = to;

    if (data != null && typeof data === 'object') {
      data[ROUTING_HISTORY_ID] = future.id;
      return next({ data });
    }

    return next({
      data: { [ROUTING_HISTORY_ID]: future.id },
    });
  };
}

function routingHistoryId(data: any | undefined): number | undefined {
  return data && typeof data === 'object' && data[ROUTING_HISTORY_ID];
}
