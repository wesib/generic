import { bootstrapComponents, BootstrapContext, Class, Feature } from '@wesib/wesib';
import { itsEmpty, itsFirst } from 'a-iterable';
import { RefStypRule, StypLength, StypRule, StypRuleList, StypRuleRef } from 'style-producer';
import { Theme } from './theme';
import { ThemeStyle } from './theme-style';
import { ThemeSupport } from './theme-support.feature';

describe('theme', () => {
  describe('Theme', () => {

    let theme: Theme;

    describe('ref', () => {

      interface RuleProperties {
        $length: StypLength;
      }

      let ref: StypRuleRef<RuleProperties>;

      beforeEach(async () => {
        await bootstrap();
        ref = theme.ref(RefStypRule.by({ c: 'custom' }, { $length: StypLength.zero }));
      });

      it('obtains CSS rule reference', () => {

        const receiver = jest.fn();

        ref.read().once(receiver);
        expect(receiver).toHaveBeenCalledWith({ $length: StypLength.zero });
      });
    });

    describe('style', () => {
      it('obtains unregistered style', async () => {
        await bootstrap();

        const rules = theme.style(style);

        expect(itsEmpty(rules)).toBe(true);

        const rule = theme.root.rules.add({ $: 'test' }, { $value: 'test' });

        expect([...rules]).toEqual([rule]);

        function style(_theme: Theme): StypRuleList {
          return _theme.root.rules.grab({ $: 'test' });
        }
      });
      it('obtains registered style', async () => {

        @Feature({
          needs: ThemeSupport,
          setup(setup) {
            setup.provide({ a: ThemeStyle, is: style });
          },
        })
        class StyleFeature {
        }

        await bootstrap(StyleFeature);

        const rule: StypRule = itsFirst(theme.style(style))!;
        const receiver = jest.fn();

        rule.read().once(receiver);
        expect(receiver).toHaveBeenCalledWith({ $value: 'test' });

        function style(_theme: Theme): StypRuleList {
          _theme.root.rules.add({ $: 'test' }, { $value: 'test' });
          return _theme.root.rules.grab({ $: 'test' });
        }
      });
      it('caches style', async () => {
        await bootstrap();

        expect(theme.style(style)).toBe(theme.style(style));

        function style(_theme: Theme): StypRuleList {
          return _theme.root.rules.grab({ $: 'test' });
        }
      });

      describe('combining', () => {
        // eslint-disable-next-line jest/expect-expect
        it('combines registered style and extension', async () => {

          @Feature({
            needs: ThemeSupport,
            setup(setup) {
              setup.provide({ a: ThemeStyle, is: style1 });
              setup.provide({ a: ThemeStyle, is: { style: style1, provide: style2 } });
            },
          })
          class StyleFeature {
          }

          await bootstrap(StyleFeature);
          checkCombined();
        });
        // eslint-disable-next-line jest/expect-expect
        it('combines style with extension registered before it', async () => {

          @Feature({
            needs: ThemeSupport,
            setup(setup) {
              setup.provide({ a: ThemeStyle, is: { style: style1, provide: style2 } });
              setup.provide({ a: ThemeStyle, is: style1 });
            },
          })
          class StyleFeature {
          }

          await bootstrap(StyleFeature);
          checkCombined();
        });
        // eslint-disable-next-line jest/expect-expect
        it('combines unregistered style and registered extension', async () => {

          @Feature({
            needs: ThemeSupport,
            setup(setup) {
              setup.provide({ a: ThemeStyle, is: { style: style1, provide: style2 } });
            },
          })
          class StyleFeature {
          }

          await bootstrap(StyleFeature);
          checkCombined();
        });

        function style1(_theme: Theme): StypRuleList {
          _theme.root.rules.add({ $: 'test1' }, { $value: 'test1' });
          return _theme.root.rules.grab({ $: 'test1' });
        }

        function style2(_theme: Theme): StypRuleList {
          _theme.root.rules.add({ $: 'test2' }, { $value: 'test2' });
          return _theme.root.rules.grab({ $: 'test2' });
        }

        function checkCombined(): void {

          const rules: StypRule[] = [...theme.style(style1)];

          expect(rules).toHaveLength(2);

          const receiver1 = jest.fn();
          const receiver2 = jest.fn();

          rules[0].read().once(receiver1);
          expect(receiver1).toHaveBeenCalledWith({ $value: 'test1' });
          rules[1].read().once(receiver2);
          expect(receiver2).toHaveBeenCalledWith({ $value: 'test2' });
        }
      });
    });

    async function bootstrap(...features: Class<any>[]): Promise<BootstrapContext> {

      @Feature({
        needs: ThemeSupport,
        init(context) {
          theme = context.get(Theme);
        },
      })
      class TestFeature {
      }

      return bootstrapComponents(TestFeature, ...features).whenReady();
    }

  });
});
