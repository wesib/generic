import Mock = jest.Mock;
import SpyInstance = jest.SpyInstance;

export type FnMock<F extends (...args: any[]) => any> = Mock<ReturnType<F>, Parameters<F>>;

export type MethodMock<T, K extends keyof T = keyof T> = T[K] extends (...args: any[]) => any ? FnMock<T[K]> : never;

export type FnSpy<F extends (...args: any[]) => any> = SpyInstance<ReturnType<F>, Parameters<F>>;

export type MethodSpy<T, K extends keyof T = keyof T> = T[K] extends (...args: any[]) => any ? FnSpy<T[K]> : never;

export type ObjectMock<T, K extends keyof T = keyof T> = {
  [P in K]: T[P] & (T[P] extends (...args: any[]) => any ? MethodMock<T, P> : ObjectMock<T, P>);
} & Pick<T, K>;
