import { CustomElementClass } from '@frontmeans/drek';
import { OnEvent } from '@proc7ts/fun-events';
import { Class } from '@proc7ts/primitives';
import {
  bootstrapComponents,
  ComponentClass,
  ComponentDef,
  CustomElements,
  DefinitionContext,
  Feature,
} from '@wesib/wesib';

export function testDefinition<T extends object>(componentType: ComponentClass<T>): OnEvent<[DefinitionContext<T>]> {
  ComponentDef.define(componentType);

  const customElements: CustomElements = {

    define(): void {/* do not define */},

    whenDefined(): Promise<void> {
      return Promise.resolve();
    },

  };

  @Feature({
    needs: componentType,
    setup(setup) {
      setup.provide({ a: CustomElements, is: customElements });
    },
  })
  class TestFeature {}

  return bootstrapComponents(TestFeature).whenDefined(componentType);
}

export async function testElement(componentType: ComponentClass<any>): Promise<Class> {
  ComponentDef.define(componentType);

  let result!: Class;

  const customElements: CustomElements = {

    define(_compType: ComponentClass<any>, elementType: Class<any>): void {
      result = elementType;
    },

    whenDefined(): Promise<void> {
      return Promise.resolve();
    },

  };

  @Feature({
    setup(setup) {
      setup.provide({ a: CustomElements, is: customElements });
    },
    needs: componentType,
  })
  class TestFeature {
  }

  await bootstrapComponents(TestFeature).whenDefined(componentType);

  return result;
}

export class MockElement {

  readonly ownerDocument: Document;
  readonly dispatchEvent = jest.fn();
  readonly addEventListener = jest.fn();
  readonly removeEventListener = jest.fn();
  private readonly _target: any;
  private readonly _attributes: { [name: string]: string | null } = {};

  constructor({ ownerDocument = document }: { ownerDocument?: Document } = {}) {
    this.ownerDocument = ownerDocument;
    this._target = new.target as unknown as CustomElementClass;
  }

  getRootNode(): Node {
    return this.ownerDocument;
  }

  getAttribute(name: string): string | null {

    const value = this._attributes[name];

    return value ?? null;
  }

  hasAttribute(name: string): boolean {
    return this._attributes[name] != null;
  }

  setAttribute(name: string, value: string): void {

    const oldValue = this.getAttribute(name);

    this._attributes[name] = value;

    const observedAttributes = this._target.observedAttributes as readonly string[] | undefined;

    if (observedAttributes && observedAttributes.includes(name)) {
      this.attributeChangedCallback(name, oldValue, value);
    }
  }

  removeAttribute(name: string): void {

    const oldValue = this.getAttribute(name);

    delete this._attributes[name];

    const observedAttributes = this._target.observedAttributes as readonly string[] | undefined;

    if (observedAttributes && observedAttributes.includes(name)) {
      this.attributeChangedCallback(name, oldValue, null);
    }
  }

  attributeChangedCallback(_name: string, _oldValue: string | null, _newValue: string | null): void {
    /* attribute changed */
  }

}
