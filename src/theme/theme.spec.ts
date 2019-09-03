import { bootstrapComponents, Class, Feature } from '@wesib/wesib';
import { itsEmpty, itsFirst } from 'a-iterable';
import { RefStypRule, StypLength, StypRule, StypRuleRef } from 'style-producer';
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
        expect(ref.read.kept).toEqual([{ $length: StypLength.zero }]);
      });
    });

    describe('style', () => {
      it('obtains unregistered style', async () => {
        await bootstrap();

        const rules = theme.style(style);

        expect(itsEmpty(rules)).toBe(true);

        const rule = theme.root.rules.add({ $: 'test' }, { $value: 'test' });

        expect([...rules]).toEqual([rule]);

        function style(_theme: Theme) {
          return _theme.root.rules.grab({ $: 'test' });
        }
      });
      it('obtains registered style', async () => {

        @Feature({
          needs: ThemeSupport,
          set: { a: ThemeStyle, is: style },
        })
        class StyleFeature {
        }

        await bootstrap(StyleFeature);

        const rule: StypRule = itsFirst(theme.style(style))!;

        expect(rule.read.kept).toEqual([{ $value: 'test' }]);

        function style(_theme: Theme) {
          _theme.root.rules.add({ $: 'test' }, { $value: 'test' });
          return _theme.root.rules.grab({ $: 'test' });
        }
      });
      it('caches style', async () => {
        await bootstrap();

        expect(theme.style(style)).toBe(theme.style(style));

        function style(_theme: Theme) {
          return _theme.root.rules.grab({ $: 'test' });
        }
      });

      describe('combining', () => {
        it('combines registered style and extension', async () => {

          @Feature({
            needs: ThemeSupport,
            set: [
              { a: ThemeStyle, is: style1 },
              { a: ThemeStyle, is: { style: style1, provide: style2 } },
            ],
          })
          class StyleFeature {
          }

          await bootstrap(StyleFeature);
          checkCombined();
        });
        it('combines style with extension registered before it', async () => {

          @Feature({
            needs: ThemeSupport,
            set: [
              { a: ThemeStyle, is: { style: style1, provide: style2 } },
              { a: ThemeStyle, is: style1 },
            ],
          })
          class StyleFeature {
          }

          await bootstrap(StyleFeature);
          checkCombined();
        });
        it('combines unregistered style and registered extension', async () => {

          @Feature({
            needs: ThemeSupport,
            set: [
              { a: ThemeStyle, is: { style: style1, provide: style2 } },
            ],
          })
          class StyleFeature {
          }

          await bootstrap(StyleFeature);
          checkCombined();
        });

        function style1(_theme: Theme) {
          _theme.root.rules.add({ $: 'test1' }, { $value: 'test1' });
          return _theme.root.rules.grab({ $: 'test1' });
        }

        function style2(_theme: Theme) {
          _theme.root.rules.add({ $: 'test2' }, { $value: 'test2' });
          return _theme.root.rules.grab({ $: 'test2' });
        }

        function checkCombined() {

          const rules: StypRule[] = [...theme.style(style1)];

          expect(rules).toHaveLength(2);
          expect(rules[0].read.kept).toEqual([{ $value: 'test1' }]);
          expect(rules[1].read.kept).toEqual([{ $value: 'test2' }]);
        }
      });
    });

    async function bootstrap(...features: Class<any>[]) {

      @Feature({
        needs: ThemeSupport,
        init(context) {
          theme = context.get(Theme);
        },
      })
      class TestFeature {
      }

      await new Promise(resolve => bootstrapComponents(TestFeature, ...features).whenReady(resolve));
    }

  });
});
