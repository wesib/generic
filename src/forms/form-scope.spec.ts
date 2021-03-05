import { InAspect, InAspect__symbol, InControl, InRole, inValue } from '@frontmeans/input-aspects';
import { noop, Supply } from '@proc7ts/primitives';
import { FormScope } from './form-scope';

describe('forms', () => {
  describe('FormScope', () => {

    const TestAspect__symbol: InAspect<TestAspect> = {

      applyTo<TValue>(_control: InControl<TValue>): InAspect.Applied<TValue, TestAspect> {
        return {
          instance: new TestAspect(),
          convertTo: noop,
        };
      },

    };

    class TestAspect {

      static get [InAspect__symbol](): InAspect<TestAspect> {
        return TestAspect__symbol;
      }

      private _it = 0;

      get it(): number {
        return this._it;
      }

      set(): Supply {
        ++this._it;
        return new Supply(() => --this._it);
      }

    }

    let control: InControl<string>;

    beforeEach(() => {
      control = inValue('test');
    });

    describe('createSetup', () => {
      it('(when `true`) sets up any control', () => {
        createSetup(true)(control);
        expect(control.aspect(TestAspect).it).toBe(1);
      });
      it('(when `false`) does not set up control', () => {
        createSetup(false)(control);
        expect(control.aspect(TestAspect).it).toBe(0);
      });
      it('(when `null`) sets up control with default role only', () => {
        createSetup(null)(control);
        expect(control.aspect(TestAspect).it).toBe(1);

        const roleSupply = control.aspect(InRole).add('test-role');

        expect(control.aspect(TestAspect).it).toBe(0);

        roleSupply.off();
        expect(control.aspect(TestAspect).it).toBe(1);
      });
      it('(when role given`) sets up control with that role only', () => {
        createSetup('test-role')(control);
        expect(control.aspect(TestAspect).it).toBe(0);

        const roleSupply = control.aspect(InRole).add('test-role');

        expect(control.aspect(TestAspect).it).toBe(1);

        roleSupply.off();
        expect(control.aspect(TestAspect).it).toBe(0);
      });
      it('(when multiple roles given`) sets up control with that roles only', () => {
        createSetup(['role1', 'role2'])(control);
        expect(control.aspect(TestAspect).it).toBe(0);

        control.aspect(InRole).add('test-role');

        expect(control.aspect(TestAspect).it).toBe(0);

        const role1Supply = control.aspect(InRole).add('role1');
        const role2Supply = control.aspect(InRole).add('role2');

        expect(control.aspect(TestAspect).it).toBe(2);

        role1Supply.off();
        expect(control.aspect(TestAspect).it).toBe(1);

        role2Supply.off();
        expect(control.aspect(TestAspect).it).toBe(0);
      });
    });

    function createSetup(scope: FormScope): (control: InControl<string>) => Supply {
      return FormScope.createSetup<InControl<string>>(scope, control => control.aspect(TestAspect).set());
    }
  });
});
