import Mock = jest.Mock;
import Mocked = jest.Mocked;
import { BootstrapWindow } from '@wesib/wesib';
import { NAV_DATA_KEY, NavDataEnvelope, PartialNavData } from '../navigation/nav-history.impl';

export class LocationMock {

  readonly location: Mocked<Location>;
  readonly href: Mock<string, []>;
  readonly history: Mocked<History>;
  readonly historyLength: Mock<number, []>;
  readonly state: Mock<string, []>;
  readonly baseURI: Mock<string, []>;
  readonly window: Mocked<BootstrapWindow>;
  private _index = 0;
  private readonly stateData: [URL, any][];
  private readonly eventTarget?: HTMLElement;

  constructor(
      {
        doc,
        win,
      }: {
        doc?: Document;
        win?: BootstrapWindow;
      } = {},
  ) {

    let mockWindow: Mocked<Window> | undefined;

    if (!win) {
      this.eventTarget = document.body.appendChild(document.createElement('div'));
      mockWindow = win = {
        addEventListener: this.eventTarget.addEventListener.bind(this.eventTarget),
        removeEventListener: this.eventTarget.removeEventListener.bind(this.eventTarget),
        dispatchEvent: this.eventTarget.dispatchEvent.bind(this.eventTarget),
      } as any;
    } else {
      mockWindow = undefined;
    }

    const self = this;
    this.stateData = [[new URL('http://localhost/index'), 'initial']];

    this.href = jest.fn(() => this.currentURL.href);
    this.location = {
      get href() {
        return self.href();
      },
    } as any;
    this.state = jest.fn(() => this.currentState);
    this.historyLength = jest.fn(() => this.stateData.length);
    this.history = {
      get length() {
        return self.historyLength();
      },
      get state() {
        return self.state();
      },
      go: jest.fn((delta = 0) => {

        const oldIndex = this._index;

        this._index = Math.max(0, Math.min(this.stateData.length - 1, oldIndex + delta));
        if (oldIndex !== this._index) {
          this.window.dispatchEvent(new PopStateEvent('popstate', { state: this.state() }));
        }
      }),
      pushState: jest.fn((newState, _title, url?) => {
        this.stateData[++this._index] = [url != null ? new URL(url, this.baseURI()) : this.currentURL, newState];
        this.stateData.length = this._index + 1;
      }),
      replaceState: jest.fn((newState, _title, url?) => {
        this.stateData[this._index] = [url != null ? new URL(url, this.baseURI()) : this.currentURL, newState];
      }),
    } as any;
    this.baseURI = jest.fn(() => 'http://localhost');

    if (mockWindow) {
      this.window = {
        location: this.location,
        history: this.history,
        addEventListener: jest.spyOn(mockWindow, 'addEventListener'),
        removeEventListener: jest.spyOn(mockWindow, 'removeEventListener'),
        dispatchEvent: jest.spyOn(mockWindow, 'dispatchEvent'),
        document: doc || {
          get baseURI() {
            return self.baseURI();
          },
        },
      } as any;
    } else {
      this.window = win as Mocked<BootstrapWindow>;
      jest.spyOn(this.window, 'location', 'get').mockImplementation(() => this.location);
      jest.spyOn(this.window, 'history', 'get').mockImplementation(() => this.history);
    }
  }

  get currentURL(): URL {
    return this.stateData[this._index][0];
  }

  get currentState(): any {
    return this.getState(this._index);
  }

  getState(index: number): any {
    return this.stateData[index][1];
  }

  setState(index: number, state: any): void {
    this.stateData[index][1] = state;
  }

  enter(hash: string, events: readonly ('hashchange' | 'popstate')[] = ['hashchange', 'popstate']): void {

    const oldURL = this.currentURL;
    const newURL = new URL(hash, oldURL);

    this.stateData[++this._index] = [newURL, null];
    this.stateData.length = this._index + 1;
    for (const event of events) {
      switch (event) {
        case 'popstate':
          this.window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
          break;
        case 'hashchange':
          this.window.dispatchEvent(new HashChangeEvent('hashchange', { newURL: newURL.href, oldURL: oldURL.href }));
          break;
      }
    }
  }

  down(): void {
    this.eventTarget?.remove();
  }

}

export function navHistoryState(
    {
      id = expect.anything(),
      uid = expect.anything(),
      data,
    }: Partial<PartialNavData>,
): NavDataEnvelope {
  return {
    [NAV_DATA_KEY]: {
      uid,
      id,
      data,
    },
  };
}
