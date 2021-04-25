import { nodeWindow } from '@frontmeans/dom-primitives';
import { drekContextOf, drekReplacer } from '@frontmeans/drek';
import { queuedRenderScheduler, RenderSchedule, RenderScheduleOptions } from '@frontmeans/render-scheduler';
import { Class } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import {
  Component,
  ComponentContext,
  DefaultPreRenderScheduler,
  DefaultRenderScheduler,
  statePropertyPathTo,
} from '@wesib/wesib';
import { testDefinition } from '@wesib/wesib/testing';
import { FragmentRendererExecution } from './fragment-renderer';
import { RenderFragmentDef } from './render-fragment-def';
import { RenderFragment } from './render-fragment.decorator';

describe('fragment', () => {
  describe('@RenderFragment', () => {

    let doc: Document;
    let element: Element;

    beforeEach(() => {
      doc = document.implementation.createHTMLDocument('test');
      element = doc.body.appendChild(doc.createElement('test-element'));
    });

    let mockRenderScheduler: jest.Mock<RenderSchedule, [RenderScheduleOptions?]>;
    let mockPreRenderScheduler: jest.Mock<RenderSchedule, [RenderScheduleOptions?]>;

    beforeEach(() => {
      mockRenderScheduler = jest.fn(queuedRenderScheduler);
      mockPreRenderScheduler = jest.fn(queuedRenderScheduler);
    });

    let render: jest.Mock<void, [FragmentRendererExecution]>;

    beforeEach(() => {
      render = jest.fn();
    });

    it('includes property name into enclosing comments', async () => {
      render.mockImplementation(({ content }) => {
        content.appendChild(doc.createTextNode('test'));
      });

      await bootstrap({}, 'custom');

      const [start, content, end] = Array.from(element.childNodes);

      expect(start.textContent).toBe(' [[ custom [[ ');
      expect(content.textContent).toBe('test');
      expect(end.textContent).toBe(' ]] custom ]] ');
    });
    it('includes property name without `render` prefix into enclosing comments', async () => {
      render.mockImplementation(({ content }) => {
        content.appendChild(doc.createTextNode('test'));
      });

      await bootstrap();

      const [start, content, end] = Array.from(element.childNodes);

      expect(start.textContent).toBe(' [[ Fragment [[ ');
      expect(content.textContent).toBe('test');
      expect(end.textContent).toBe(' ]] Fragment ]] ');
    });
    it('re-renders fragment on state update', async () => {

      let counter = 0;

      render.mockImplementation(({ content }) => {
        content.appendChild(doc.createTextNode(`test-${++counter}`));
      });

      const context = await bootstrap();

      expect(element.textContent).toBe('test-1');

      context.updateState(statePropertyPathTo('test'), 1, 2);
      expect(element.textContent).toBe('test-2');
    });

    describe('{ settle: false }', () => {
      it('does not upgrade custom elements', async () => {

        const upgradeSpy = jest.spyOn(nodeWindow(doc).customElements, 'upgrade');

        await bootstrap({ settle: false });

        expect(upgradeSpy).not.toHaveBeenCalled();
      });
      it('settles content when it is placed to document', async () => {

        const whenSettled = jest.fn();

        render.mockImplementation(({ content }) => {
          drekContextOf(content).whenSettled(whenSettled);
        });

        await bootstrap({ settle: false });

        expect(whenSettled).toHaveBeenCalledWith({ connected: true });
      });
    });

    describe('done', () => {
      it('prevents fragment re-rendering', async () => {

        let counter = 0;

        render.mockImplementation(({ content, done }) => {
          content.appendChild(doc.createTextNode(`test-${++counter}`));
          done();
        });

        const context = await bootstrap();

        expect(element.textContent).toBe('test-1');

        context.updateState(statePropertyPathTo('test'), 1, 2);
        expect(element.textContent).toBe('test-1');
      });
    });

    describe('renderBy', () => {
      it('delegates to another renderer', async () => {

        const delegate = jest.fn();
        let counter = 0;

        render.mockImplementation(({ content, renderBy }) => {
          content.appendChild(doc.createTextNode(`test-${++counter}`));
          renderBy(delegate);
        });

        const context = await bootstrap();

        expect(element.textContent).toBe('test-1');
        expect(delegate).toHaveBeenCalledTimes(2);

        context.updateState(statePropertyPathTo('test'), 1, 2);
        expect(element.textContent).toBe('test-1');
        expect(delegate).toHaveBeenCalledTimes(3);
      });
    });

    describe('retainContent', () => {
      it('retains document content', async () => {
        element.appendChild(doc.createTextNode('initial content'));

        let counter = 0;

        render.mockImplementation(({ content, retainContent }) => {
          retainContent(!counter);
          content.appendChild(doc.createTextNode(`test-${++counter}`));
        });

        const context = await bootstrap({ target: () => drekReplacer(element) });

        expect(element.textContent).toBe('initial content');

        context.updateState(statePropertyPathTo('test'), 1, 2);
        expect(element.textContent).toBe('test-2');
      });
      it('allows to delegate to another renderer', async () => {
        element.appendChild(doc.createTextNode('initial content'));

        const delegate = jest.fn();
        let counter = 0;

        render.mockImplementation(({ content, renderBy, retainContent }) => {
          content.appendChild(doc.createTextNode(`test-${++counter}`));
          retainContent();
          renderBy(delegate);
        });

        const context = await bootstrap();

        expect(element.textContent).toBe('initial content');
        expect(delegate).toHaveBeenCalledTimes(2);

        context.updateState(statePropertyPathTo('test'), 1, 2);
        expect(element.textContent).toBe('initial content');
        expect(delegate).toHaveBeenCalledTimes(3);
      });
    });

    describe('postpone', () => {
      it('postpones renderer', async () => {

        const postponed = jest.fn();
        let counter = 0;

        render.mockImplementation(({ content, postpone }) => {
          content.appendChild(doc.createTextNode(`test-${++counter}`));
          postpone(postponed);
        });

        const context = await bootstrap();

        expect(element.textContent).toBe('test-1');
        expect(postponed).toHaveBeenCalledTimes(1);

        context.updateState(statePropertyPathTo('test'), 1, 2);
        expect(element.textContent).toBe('test-2');
        expect(postponed).toHaveBeenCalledTimes(2);
      });
    });

    describe('supply', () => {
      it('prevents re-rendering when cut off', async () => {

        let counter = 0;
        let fragmentSupply!: Supply;

        render.mockImplementation(({ content, supply }) => {
          content.appendChild(doc.createTextNode(`test-${++counter}`));
          fragmentSupply = supply;
        });

        const context = await bootstrap();

        expect(element.textContent).toBe('test-1');
        fragmentSupply.off();

        context.updateState(statePropertyPathTo('test'), 1, 2);
        expect(element.textContent).toBe('test-1');
        expect(render).toHaveBeenCalledTimes(1);
      });
    });

    async function bootstrap(
        def?: RenderFragmentDef,
        key: 'renderFragment' | 'custom' = 'renderFragment',
    ): Promise<ComponentContext> {

      let testComponent: Class;

      if (key === 'renderFragment') {

        @Component({
          feature: {
            setup(setup) {
              setup.provide({ a: DefaultRenderScheduler, is: mockRenderScheduler });
              setup.provide({ a: DefaultPreRenderScheduler, is: mockPreRenderScheduler });
            },
          },
        })
        class TestComponent {

          @RenderFragment(def)
          readonly renderFragment = render;

        }

        testComponent = TestComponent;
      } else {

        @Component({
          feature: {
            setup(setup) {
              setup.provide({ a: DefaultRenderScheduler, is: mockRenderScheduler });
              setup.provide({ a: DefaultPreRenderScheduler, is: mockPreRenderScheduler });
            },
          },
        })
        class TestComponent {

          @RenderFragment(def)
          readonly custom = render;

        }

        testComponent = TestComponent;
      }

      const defContext = await testDefinition(testComponent);

      return defContext.mountTo(element);
    }
  });

});
