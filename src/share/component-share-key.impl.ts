import { ContextValueSlot } from '@proc7ts/context-values';
import { ContextUpKey } from '@proc7ts/context-values/updatable';
import { AfterEvent, digAfter, EventKeeper } from '@proc7ts/fun-events';
import { ComponentShare } from './component-share';
import { SharedByComponent } from './shared-by-component';

/**
 * @internal
 */
export class ComponentShareKey<T> extends ContextUpKey<AfterEvent<[T] | []>, SharedByComponent<T>> {

  constructor(name: string, private readonly _share: ComponentShare<T>) {
    super(`${name}:share`);
  }

  get upKey(): this {
    return this;
  }

  grow(
      slot: ContextValueSlot<
          AfterEvent<[T] | []>,
          EventKeeper<SharedByComponent<T>[]> | SharedByComponent<T>,
          AfterEvent<SharedByComponent<T>[]>>,
  ): void {
    slot.insert(
        slot.seed.do(
            digAfter((...values) => this._share.selectValue(...values)),
        ),
    );
  }

}
