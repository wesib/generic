import Mock = jest.Mock;
import Mocked = jest.Mocked;

export class LocationMock {

  readonly location: Mocked<Location>;
  readonly href: Mock<string, []>;
  readonly history: Mocked<History>;
  readonly historyLength: Mock<number, []>;
  readonly state: Mock<string, []>;
  readonly baseURI: Mock<string, []>;
  readonly window: Mocked<Window>;
  private readonly eventTarget: HTMLElement;

  constructor() {
    this.eventTarget = document.body.appendChild(document.createElement('div'));

    const self = this;
    let index = 0;
    const stateData: [URL, any][] = [[new URL('http://localhost/index'), 'initial']];

    this.href = jest.fn(() => stateData[index][0].href);
    this.location = {
      get href() {
        return self.href();
      }
    } as any;
    this.state = jest.fn(() => stateData[index][1]);
    this.historyLength = jest.fn(() => stateData.length);
    this.history = {
      get length() {
        return self.historyLength();
      },
      get state() {
        return self.state();
      },
      go: jest.fn((delta = 0) => {

        const oldIndex = index;

        index = Math.max(0, Math.min(stateData.length - 1, oldIndex + delta));
        if (oldIndex !== index) {
          self.window.dispatchEvent(new PopStateEvent('popstate', { state: this.state() }));
        }
      }),
      pushState: jest.fn((newState, _title, url?) => {
        stateData[++index] = [url != null ? new URL(url, self.baseURI()) : stateData[index][0], newState];
        stateData.length = index + 1;
      }),
      replaceState: jest.fn((newState, _title, url?) => {
        stateData[index] = [url != null ? new URL(url, self.baseURI()) : stateData[index][0], newState];
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

  down() {
    this.eventTarget.remove();
  }

}
