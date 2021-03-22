import { ManualRenderScheduler, newManualRenderScheduler, RenderSchedule } from '@frontmeans/render-scheduler';
import { addCssClass } from './add-css-class';

describe('util', () => {
  describe('addCssClass', () => {

    let element: Element;
    let scheduler: ManualRenderScheduler;
    let schedule: RenderSchedule;

    beforeEach(() => {
      element = document.createElement('span');
      scheduler = newManualRenderScheduler();
      schedule = scheduler();
    });

    it('adds CSS class', () => {
      addCssClass(element, 'test', schedule);
      expect(element.classList).not.toContain('test');

      scheduler.render();
      expect(element.classList).toContain('test');
    });
    it('adds CSS class immediately when schedule omitted', () => {
      addCssClass(element, 'test');
      expect(element.classList).toContain('test');
    });
    it('removes CSS class when the last supply cut off', () => {

      const supply1 = addCssClass(element, 'test', schedule);
      const supply2 = addCssClass(element, 'test', schedule);

      scheduler.render();

      supply1.off();
      scheduler.render();
      expect(element.classList).toContain('test');

      supply2.off();
      scheduler.render();
      expect(element.classList).not.toContain('test');
    });
    it('does not add CSS class when supply cut off', () => {
      addCssClass(element, 'test', schedule).off();
      scheduler.render();
      expect(element.classList).not.toContain('test');
    });
  });
});
