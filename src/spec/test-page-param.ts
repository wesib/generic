import { Page, PageParam } from '../navigation';
import Mocked = jest.Mocked;

export function testPageParamHandle(
    state: { value: string } = { value: '' },
): Mocked<PageParam.Handle<string, string>> {
  return {
    get: jest.fn(() => state.value),
    put: jest.fn(newValue => {
      state.value = newValue;
    }),
    enter: jest.fn(),
    stay: jest.fn(),
    leave: jest.fn(),
    forget: jest.fn(),
  };
}

export function testPageParam(
    value = '',
): [PageParam<string, string>, Mocked<PageParam.Handle<string, string>>] {

  const state = { value };
  const handle = testPageParamHandle(state);

  class TestParam extends PageParam<string, string> {

    create(_page: Page, initValue: string): PageParam.Handle<string, string> {
      state.value = initValue;
      return handle;
    }

  }

  return [new TestParam(), handle];
}
