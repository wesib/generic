import { ContextValueSlot } from '@proc7ts/context-values';
import { ContextUpKey } from '@proc7ts/context-values/updatable';
import { AfterEvent, digAfter } from '@proc7ts/fun-events';
import { Share } from './share';
import { SharedValue } from './shared-value';

/**
 * @internal
 */
export class ShareKey<T> extends ContextUpKey<AfterEvent<[T?]>, SharedValue<T>> {

  constructor(name: string, private readonly _share: Share<T>) {
    super(`${name}:share`);
  }

  get upKey(): this {
    return this;
  }

  grow(
      slot: ContextValueSlot<
          AfterEvent<[T?]>,
          Share.Source<T>,
          AfterEvent<SharedValue<T>[]>>,
  ): void {
    slot.insert(
        slot.seed.do(
            digAfter((...values) => this._share.selectValue(...values)),
        ),
    );
  }

}
