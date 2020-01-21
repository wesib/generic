import {
  bootstrapComponents,
  Class,
  ComponentClass,
  ComponentDef,
  ComponentFactory,
  CustomElements,
  Feature,
} from '@wesib/wesib';

export function testComponentFactory<T extends object>(
    componentType: ComponentClass<T>,
): Promise<ComponentFactory<T>> {
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

export async function testElement(componentType: ComponentClass<any>): Promise<Class<any>> {
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

  readonly dispatchEvent = jest.fn();
  readonly addEventListener = jest.fn();
  private readonly _target: any;
  private readonly _attributes: { [name: string]: string | null } = {};

  constructor() {
    this._target = new.target;
  }

  getAttribute(name: string): string | null {

    const value = this._attributes[name];

    return value != null ? value : null;
  }

  setAttribute(name: string, value: string): void {

    const oldValue = this.getAttribute(name);

    this._attributes[name] = value;

    const observedAttributes: string[] = this._target.observedAttributes;

    if (observedAttributes && observedAttributes.includes(name)) {
      this.attributeChangedCallback(name, oldValue, value);
    }
  }

  attributeChangedCallback(_name: string, _oldValue: string | null, _newValue: string): void {
    /* attribute changed */
  }

}
