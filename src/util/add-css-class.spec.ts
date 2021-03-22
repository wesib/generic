import {
  immediateRenderScheduler,
  ManualRenderScheduler,
  newManualRenderScheduler,
  setRenderScheduler,
} from '@frontmeans/render-scheduler';
import { addCssClass } from './add-css-class';

describe('util', () => {
  describe('addCssClass', () => {

    let element: Element;
    let scheduler: ManualRenderScheduler;

    beforeEach(() => {
      element = document.createElement('span');
      scheduler = newManualRenderScheduler();
    });

    it('adds CSS class', () => {
      addCssClass(element, 'test', { scheduler });
      expect(element.classList).not.toContain('test');

      scheduler.render();
      expect(element.classList).toContain('test');
    });
    it('utilizes default render scheduler when omitted', () => {
      setRenderScheduler(immediateRenderScheduler);
      try {
        addCssClass(element, 'test');
        expect(element.classList).toContain('test');
      } finally {
        setRenderScheduler();
      }
    });
    it('removes CSS class when the last supply cut off', () => {

      const supply1 = addCssClass(element, 'test', { scheduler });
      const supply2 = addCssClass(element, 'test', { scheduler });

      scheduler.render();

      supply1.off();
      scheduler.render();
      expect(element.classList).toContain('test');

      supply2.off();
      scheduler.render();
      expect(element.classList).not.toContain('test');
    });
    it('does not add CSS class when supply cut off', () => {
      addCssClass(element, 'test', { scheduler }).off();
      scheduler.render();
      expect(element.classList).not.toContain('test');
    });
  });
});
