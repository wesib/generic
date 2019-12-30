import { bootstrapComponents, BootstrapContext, Component, ComponentContext } from '@wesib/wesib';
import { InControl, inText } from 'input-aspects';
import { ElementNode } from '../tree';
import { ComponentInElement, componentInElement } from './component-in-element';

describe('input', () => {
  describe('ComponentInElement', () => {

    let inElement: Element;

    beforeEach(() => {
      inElement = document.body.appendChild(document.createElement('in-element'));
    });
    afterEach(() => {
      inElement.remove();
    });

    it('attaches to input element', async () => {

      const inputEl = document.createElement('input');

      inElement.appendChild(inputEl);

      const [readEl] = await mount({
        selector: 'input',
        control: node => inText(node.element),
      });

      readEl.once(ctrl => {
        expect(ctrl).toBeDefined();
        expect(ctrl?.element).toBe(inputEl);
      });
    });
    it('disconnects when input element removed', async () => {

      const inputEl = document.createElement('input');

      inElement.appendChild(inputEl);

      const [readEl] = await mount({
        selector: 'input',
        control: node => inText(node.element),
      });

      inputEl.remove();
      await Promise.resolve();

      readEl.once(ctrl => {
        expect(ctrl).toBeUndefined();
      });
    });
    it('disconnects when component element removed', async () => {

      const inputEl = document.createElement('input');

      inElement.appendChild(inputEl);

      const [readEl, context] = await mount({
        selector: 'input',
        control: node => inText(node.element),
      });

      inElement.remove();
      await Promise.resolve();
      context.mount?.checkConnected();

      readEl.once(ctrl => {
        expect(ctrl).toBeUndefined();
      });
    });

    async function mount<Ctrl extends InControl<any>>(opts: {
      selector: string,
      selectorOpts?: ElementNode.SelectorOpts,
      control: (node: ElementNode.Any) => Ctrl,
    }): Promise<[ComponentInElement<Ctrl>, ComponentContext]> {

      const ref = componentInElement(opts);

      @Component(ref)
      class InElementComponent {}

      const bsContext = await new Promise<BootstrapContext>(
          resolve => bootstrapComponents(InElementComponent).whenReady(resolve),
      );

      const factory = await bsContext.whenDefined(InElementComponent);
      const context = factory.mountTo(inElement).context;

      return [context.get(ref), context];
    }
  });
});
