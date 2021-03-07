import { RefStypRule, StypLength, StypRule, StypRuleList, StypRuleRef } from '@frontmeans/style-producer';
import { ContextRegistry } from '@proc7ts/context-values';
import { onceAfter } from '@proc7ts/fun-events';
import { Class } from '@proc7ts/primitives';
import { itsEmpty, itsFirst } from '@proc7ts/push-iterator';
import { bootstrapComponents, BootstrapContext, Feature } from '@wesib/wesib';
import { Theme } from './theme';
import { ThemeStyle } from './theme-style';

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

        ref.read.do(onceAfter)(receiver);
        expect(receiver).toHaveBeenCalledWith({ $length: StypLength.zero });
      });
    });

    describe('style', () => {
      it('falls back the style', () => {

        const values = new ContextRegistry().newValues();

        expect(values.get(ThemeStyle, { or: null })).toBeNull();
      });
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
          setup(setup) {
            setup.provide({ a: ThemeStyle, is: style });
          },
        })
        class StyleFeature {
        }

        await bootstrap(StyleFeature);

        const rule: StypRule = itsFirst(theme.style(style))!;
        const receiver = jest.fn();

        rule.read.do(onceAfter)(receiver);
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

          rules[0].read.do(onceAfter)(receiver1);
          expect(receiver1).toHaveBeenCalledWith({ $value: 'test1' });
          rules[1].read.do(onceAfter)(receiver2);
          expect(receiver2).toHaveBeenCalledWith({ $value: 'test2' });
        }
      });
    });

    async function bootstrap(...features: Class[]): Promise<BootstrapContext> {

      @Feature({
        init(context) {
          theme = context.get(Theme);
        },
      })
      class TestFeature {
      }

      return bootstrapComponents(TestFeature, ...features).whenReady;
    }

  });
});
