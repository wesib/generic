import { EventKeeper } from '@proc7ts/fun-events';

export const SharedByComponent__symbol = (/*#__PURE__*/ Symbol('SharedByComponent'));

export type SharedByComponent<T> = T | SharedByComponent.Detailed<T>;

export namespace SharedByComponent {

  export interface Detailed<T> {

    readonly [SharedByComponent__symbol]: Details<T>;

  }

  export interface Details<T> {

    readonly order: number;

    get(): T | EventKeeper<[] | [T]>;

  }

}

export const SharedByComponent = {

  isDetailed<T>(
      this: void,
      value: SharedByComponent<T>,
  ): value is SharedByComponent.Detailed<T> {
    return !!value
        && typeof value === 'object'
        && typeof (value as SharedByComponent.Detailed<T>)[SharedByComponent__symbol] === 'object';
  },

};
