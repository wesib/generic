import { nodeWindow } from '@frontmeans/dom-primitives';
import { drekContextOf } from '@frontmeans/drek';
import {
  PreRenderScheduler,
  queuedRenderScheduler,
  RenderSchedule,
  RenderScheduleOptions,
  RenderScheduler,
} from '@frontmeans/render-scheduler';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { cxConstAsset } from '@proc7ts/context-builder';
import { EventEmitter } from '@proc7ts/fun-events';
import { noop } from '@proc7ts/primitives';
import { Component, ComponentContext } from '@wesib/wesib';
import { testDefinition } from '@wesib/wesib/testing';
import { Mock } from 'jest-mock';
import { FragmentRenderCtl } from './fragment-render-ctl';

describe('fragment', () => {
  describe('FragmentRenderCtl', () => {

    let doc: Document;
    let element: Element;

    beforeEach(() => {
      doc = document.implementation.createHTMLDocument('test');
      element = doc.body.appendChild(doc.createElement('test-element'));
    });

    let mockRenderScheduler: Mock<RenderSchedule, [RenderScheduleOptions?]>;
    let mockPreRenderScheduler: Mock<RenderSchedule, [RenderScheduleOptions?]>;

    beforeEach(() => {
      mockRenderScheduler = jest.fn(queuedRenderScheduler);
      mockPreRenderScheduler = jest.fn(queuedRenderScheduler);
    });

    let renderCtl: FragmentRenderCtl;
    let context: ComponentContext;

    beforeEach(async () => {
      @Component({
        feature: {
          setup(setup) {
            setup.provide(cxConstAsset(RenderScheduler, mockRenderScheduler));
            setup.provide(cxConstAsset(PreRenderScheduler, mockPreRenderScheduler));
          },
        },
      })
      class TestComponent {
      }

      const defContext = await testDefinition(TestComponent);

      context = defContext.mountTo(element);
      renderCtl = context.get(FragmentRenderCtl);
    });

    describe('renderFragmentBy', () => {
      it('re-renders fragment on state update', () => {

        const update = new EventEmitter();
        let counter = 0;

        renderCtl.renderFragmentBy(
            ({ content }) => {
              content.appendChild(doc.createTextNode(`test-${++counter}`));
            },
            { on: update },
        );

        expect(element.textContent).toBe('test-1');

        update.send();
        expect(element.textContent).toBe('test-2');
      });
      it('upgrades custom elements', () => {

        const upgradeSpy = jest.spyOn(nodeWindow(doc).customElements, 'upgrade');

        renderCtl.renderFragmentBy(noop);

        expect(upgradeSpy).toHaveBeenCalled();
      });
      it('settles pre-rendered content', () => {

        const whenSettled = jest.fn();

        renderCtl.renderFragmentBy(({ content }) => {
          drekContextOf(content).whenSettled(whenSettled);
        });

        expect(whenSettled).toHaveBeenCalledWith({ connected: false, withinFragment: 'rendered' });
      });
    });

    describe('toString', () => {
      it('returns string representation', () => {
        expect(String(FragmentRenderCtl)).toBe('[FragmentRenderCtl]');
      });
    });
  });
});
