import { InAspect, InAspect__symbol, InControl, InRole, inValue } from '@frontmeans/input-aspects';
import { noop } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import { ScopedFormConfig } from './scoped-form-config';

describe('forms', () => {
  describe('ScopedFormConfig', () => {

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

      private readonly _it: string[] = [];

      get it(): readonly string[] {
        return this._it;
      }

      setup({ value }: { value: string }): Supply {
        this._it.push(value);
        return new Supply(() => this._it.splice(this._it.indexOf(value), 1));
      }

    }

    let control: InControl<string>;

    beforeEach(() => {
      control = inValue('test');
    });

    describe('createSetup', () => {
      it('(with options, without scope) sets up control with default role only', () => {
        createSetup({ value: 'custom' })(control);
        expect(control.aspect(TestAspect).it).toEqual(['custom']);

        const roleSupply = control.aspect(InRole).add('test-role');

        expect(control.aspect(TestAspect).it).toHaveLength(0);

        roleSupply.off();
        expect(control.aspect(TestAspect).it).toEqual(['custom']);
      });
      it('(with options and `true` scope) sets up any control', () => {
        createSetup([{ value: 'custom' }, true])(control);
        expect(control.aspect(TestAspect).it).toEqual(['custom']);

        const roleSupply = control.aspect(InRole).add('test-role');

        expect(control.aspect(TestAspect).it).toEqual(['custom']);

        roleSupply.off();
        expect(control.aspect(TestAspect).it).toEqual(['custom']);
      });
      it('(without scope and options) sets up control with default role and default options', () => {
        createSetup(null)(control);
        expect(control.aspect(TestAspect).it).toEqual(['default']);

        const roleSupply = control.aspect(InRole).add('test-role');

        expect(control.aspect(TestAspect).it).toHaveLength(0);

        roleSupply.off();
        expect(control.aspect(TestAspect).it).toEqual(['default']);
      });
      it('(with role, without options) sets up control with that role and options', () => {
        createSetup('test-role')(control);
        expect(control.aspect(TestAspect).it).toHaveLength(0);

        const roleSupply = control.aspect(InRole).add('test-role');

        expect(control.aspect(TestAspect).it).toEqual(['default']);

        roleSupply.off();
        expect(control.aspect(TestAspect).it).toHaveLength(0);
      });
      it('(with roles, without options) sets up control with that roles and default options', () => {
        createSetup(['role1', 'role2'])(control);
        expect(control.aspect(TestAspect).it).toHaveLength(0);

        const role1Supply = control.aspect(InRole).add('role1');

        expect(control.aspect(TestAspect).it).toEqual(['default']);

        const role2Supply = control.aspect(InRole).add('role2');

        expect(control.aspect(TestAspect).it).toEqual(['default', 'default']);

        role2Supply.off();
        expect(control.aspect(TestAspect).it).toEqual(['default']);

        role1Supply.off();
        expect(control.aspect(TestAspect).it).toHaveLength(0);
      });
      it('(with options and roles) sets up control with that roles and default options', () => {
        createSetup([{ value: 'custom' }, 'role1', 'role2'])(control);
        expect(control.aspect(TestAspect).it).toHaveLength(0);

        const role1Supply = control.aspect(InRole).add('role1');

        expect(control.aspect(TestAspect).it).toEqual(['custom']);

        const role2Supply = control.aspect(InRole).add('role2');

        expect(control.aspect(TestAspect).it).toEqual(['custom', 'custom']);

        role2Supply.off();
        expect(control.aspect(TestAspect).it).toEqual(['custom']);

        role1Supply.off();
        expect(control.aspect(TestAspect).it).toHaveLength(0);
      });
      it('(with options and scope) sets up control with that roles and default options', () => {
        createSetup([{ value: 'custom' }, ['role1', 'role2']])(control);
        expect(control.aspect(TestAspect).it).toHaveLength(0);

        const role1Supply = control.aspect(InRole).add('role1');

        expect(control.aspect(TestAspect).it).toEqual(['custom']);

        const role2Supply = control.aspect(InRole).add('role2');

        expect(control.aspect(TestAspect).it).toEqual(['custom', 'custom']);

        role2Supply.off();
        expect(control.aspect(TestAspect).it).toEqual(['custom']);

        role1Supply.off();
        expect(control.aspect(TestAspect).it).toHaveLength(0);
      });
    });

    function createSetup(config: ScopedFormConfig<{ value: string }>): (control: InControl<string>) => Supply {
      return ScopedFormConfig.createSetup(
          config,
          ({ value = 'default' }: { value?: string } = {}) => control => control.aspect(TestAspect).setup({ value }),
      );
    }
  });
});
