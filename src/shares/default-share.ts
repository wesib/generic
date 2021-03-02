import { ContextKey__symbol } from '@proc7ts/context-values';
import { Class } from '@proc7ts/primitives';
import { Form } from '../forms';
import { Share } from './share';
import { Share__symbol } from './share-ref';

const Share$map = (/*#__PURE__*/ new WeakMap<Class, Share<any>>());

/**
 * A share that has a default instance.
 *
 * @typeParam T - Shared value type.
 */
export class DefaultShare<T> extends Share<T> {

  /**
   * Default share instance name.
   */
  static get defaultShareName(): string {
    return this.name;
  }

  /**
   * Default share instance.
   */
  static get [Share__symbol](): DefaultShare<any> {

    let instance = Share$map.get(this);

    if (!instance) {
      instance = new this(this.defaultShareName);
      Share$map.set(this, instance);
    }

    return instance;
  }

  /**
   * A key of component context value containing a value shared by default share instance.
   */
  static get [ContextKey__symbol](): Share.Key<Form> {
    return this[Share__symbol][ContextKey__symbol];
  }

}
