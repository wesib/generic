import Mock = jest.Mock;
import Mocked = jest.Mocked;
import { NAV_DATA_KEY, NavDataEnvelope, PartialNavData } from '../navigation/nav-history.impl';

export class LocationMock {

  readonly location: Mocked<Location>;
  readonly href: Mock<string, []>;
  readonly history: Mocked<History>;
  readonly historyLength: Mock<number, []>;
  readonly state: Mock<string, []>;
  readonly baseURI: Mock<string, []>;
  readonly window: Mocked<Window>;
  private _index = 0;
  private readonly stateData: [URL, any][];
  private readonly eventTarget: HTMLElement;

  constructor() {
    this.eventTarget = document.body.appendChild(document.createElement('div'));

    const self = this;
    this.stateData = [[new URL('http://localhost/index'), 'initial']];

    this.href = jest.fn(() => this.currentURL.href);
    this.location = {
      get href() {
        return self.href();
      }
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

    const win = {
      addEventListener: this.eventTarget.addEventListener.bind(this.eventTarget),
      removeEventListener: this.eventTarget.removeEventListener.bind(this.eventTarget),
      dispatchEvent: this.eventTarget.dispatchEvent.bind(this.eventTarget),
    };

    this.window = {
      location: this.location,
      history: this.history,
      addEventListener: jest.spyOn(win, 'addEventListener'),
      removeEventListener: jest.spyOn(win, 'removeEventListener'),
      dispatchEvent: jest.spyOn(win, 'dispatchEvent'),
      document: {
        get baseURI() {
          return self.baseURI();
        }
      },
    } as any;
  }

  get currentURL() {
    return this.stateData[this._index][0];
  }

  get currentState() {
    return this.getState(this._index);
  }

  getState(index: number): any {
    return this.stateData[index][1];
  }

  setState(index: number, state: any) {
    this.stateData[index][1] = state;
  }

  enter(hash: string, events: ('hashchange' | 'popstate')[] = ['hashchange', 'popstate']) {

    const oldURL = this.currentURL;
    const newURL = new URL(hash, oldURL);

    this.stateData[++this._index] = [newURL, null];
    this.stateData.length = this._index + 1;
    for (const event of events) {
      switch (event) {
        case 'popstate':
          this.window.dispatchEvent(new PopStateEvent('popstate', { state: this.currentState }));
          break;
        case 'hashchange':
          this.window.dispatchEvent(new HashChangeEvent('hashchange', { newURL: newURL.href, oldURL: oldURL.href }));
          break;
      }
    }
  }

  down() {
    this.eventTarget.remove();
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
    }
  };
}
