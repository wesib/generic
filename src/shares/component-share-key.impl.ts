import { ContextValueSlot } from '@proc7ts/context-values';
import { ContextUpKey } from '@proc7ts/context-values/updatable';
import { AfterEvent, digAfter } from '@proc7ts/fun-events';
import { ComponentShare } from './component-share';
import { SharedValue } from './shared-value';

/**
 * @internal
 */
export class ComponentShareKey<T> extends ContextUpKey<AfterEvent<[T?]>, SharedValue<T>> {

  constructor(name: string, private readonly _share: ComponentShare<T>) {
    super(`${name}:share`);
  }

  get upKey(): this {
    return this;
  }

  grow(
      slot: ContextValueSlot<
          AfterEvent<[T?]>,
          ComponentShare.Source<T>,
          AfterEvent<SharedValue<T>[]>>,
  ): void {
    slot.insert(
        slot.seed.do(
            digAfter((...values) => this._share.selectValue(...values)),
        ),
    );
  }

}
