import { inGroup, InGroup, InText, inText } from '@frontmeans/input-aspects';
import { onceAfter, trackValue } from '@proc7ts/fun-events';
import { bootstrapComponents, Component, ComponentContext } from '@wesib/wesib';
import { inputFromControl } from './input-from-control';
import { SetInputName } from './set-input-name.decorator';

describe('input', () => {
  describe('@SetInputName', () => {

    let root: Element;
    let input: HTMLInputElement;

    beforeEach(() => {
      root = document.body.appendChild(document.createElement('root-component'));
      input = root.appendChild(document.createElement('input'));
    });
    afterEach(() => {
      root.remove();
    });

    it('adds input control to group', async () => {

      const [group, control] = await bootstrap('ctrl');

      group.controls.read.do(onceAfter)(controls => {
        expect([...controls]).toEqual([control]);
      });
    });
    it('adds input control to group when name specified by function', async () => {

      const [group, control] = await bootstrap(() => 'ctrl');

      group.controls.read.do(onceAfter)(controls => {
        expect([...controls]).toEqual([control]);
      });
    });
    it('adds input control to group when name provided by keeper', async () => {

      const name = trackValue<string | undefined>('ctrl');
      const [group, control] = await bootstrap(() => name);

      group.controls.read.do(onceAfter)(controls => {
        expect([...controls]).toEqual([control]);
      });

      name.it = undefined;
      group.controls.read.do(onceAfter)(controls => {
        expect([...controls]).toHaveLength(0);
      });
    });
    it('does not add input control to missing group', async () => {

      const [group] = await bootstrap('ctrl', { createGroup: false });

      group.controls.read.do(onceAfter)(controls => {
        expect([...controls]).toHaveLength(0);
      });
    });
    it('does not add missing input control to group', async () => {

      const [group] = await bootstrap('ctrl', { createControl: false });

      group.controls.read.do(onceAfter)(controls => {
        expect([...controls]).toHaveLength(0);
      });
    });
    it('does not add missing input control to missing group', async () => {

      const [group] = await bootstrap('ctrl', { createGroup: false, createControl: false });

      group.controls.read.do(onceAfter)(controls => {
        expect([...controls]).toHaveLength(0);
      });
    });

    async function bootstrap(
        name: Parameters<typeof SetInputName>[0],
        {
          createGroup = true,
          createControl = true,
        }: {
          createGroup?: boolean;
          createControl?: boolean;
        } = {},
    ): Promise<[InGroup<{ ctrl: string }>, InText]> {

      const group = inGroup<{ ctrl: string }>({ ctrl: '' });

      @Component()
      class GroupComponent {

        constructor(context: ComponentContext) {
          if (createGroup) {
            context.whenConnected(() => {
              inputFromControl(context, group);
            });
          }
        }

      }

      const control = inText(input);

      @SetInputName(name)
      class InputComponent {

        constructor(context: ComponentContext) {
          if (createControl) {
            context.whenConnected(() => {
              inputFromControl(context, control);
            });
          }
        }

      }

      const bsContext = await bootstrapComponents(GroupComponent, InputComponent).whenReady;
      const groupFactory = await bsContext.whenDefined(GroupComponent);
      const controlFactory = await bsContext.whenDefined(InputComponent);

      groupFactory.mountTo(root);
      controlFactory.mountTo(input);

      return [group, control];
    }

  });
});
