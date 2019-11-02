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
  private readonly stateData: [URL, any][];
  private readonly eventTarget: HTMLElement;

  constructor() {
    this.eventTarget = document.body.appendChild(document.createElement('div'));

    const self = this;
    let index = 0;
    this.stateData = [[new URL('http://localhost/index'), 'initial']];

    this.href = jest.fn(() => this.stateData[index][0].href);
    this.location = {
      get href() {
        return self.href();
      }
    } as any;
    this.state = jest.fn(() => this.stateData[index][1]);
    this.historyLength = jest.fn(() => this.stateData.length);
    this.history = {
      get length() {
        return self.historyLength();
      },
      get state() {
        return self.state();
      },
      go: jest.fn((delta = 0) => {

        const oldIndex = index;

        index = Math.max(0, Math.min(this.stateData.length - 1, oldIndex + delta));
        if (oldIndex !== index) {
          self.window.dispatchEvent(new PopStateEvent('popstate', { state: this.state() }));
        }
      }),
      pushState: jest.fn((newState, _title, url?) => {
        this.stateData[++index] = [url != null ? new URL(url, self.baseURI()) : self.stateData[index][0], newState];
        this.stateData.length = index + 1;
      }),
      replaceState: jest.fn((newState, _title, url?) => {
        this.stateData[index] = [url != null ? new URL(url, self.baseURI()) : self.stateData[index][0], newState];
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

  getState(index: number): any {
    return this.stateData[index][1];
  }

  setState(index: number, state: any) {
    this.stateData[index][1] = state;
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
