import { elementBehaviors } from './element-behaviors';

describe('util', () => {
  describe('elementBehaviors', () => {

    let element: Element;
    let behaviors: string | null;
    let dataBehaviors: string | null;

    beforeEach(() => {
      behaviors = null;
      dataBehaviors = null;
      element = {
        getAttribute(name: string): string | null {
          return name === 'b-a' ? behaviors : name === 'data-b-a' ? dataBehaviors : null;
        },
      } as Element;
    });

    it('returns empty map when no behaviors present', () => {
      expect(behaviorEntries()).toHaveLength(0);
    });
    it('returns behavior from `b-a` attribute', () => {
      behaviors = 'test';
      expect(behaviorEntries()).toEqual([['test', true]]);
    });
    it('returns behavior from `b-a` attribute', () => {
      behaviors = 'test';
      expect(behaviorEntries()).toEqual([['test', true]]);
    });
    it('returns behavior from `data-b-a` attribute', () => {
      dataBehaviors = 'test';
      expect(behaviorEntries()).toEqual([['test', true]]);
    });
    it('combines behaviors from `b-a` and `data-b-a` attribute', () => {
      behaviors = 'test1';
      dataBehaviors = 'test2';
      expect(behaviorEntries()).toEqual([['test1', true], ['test2', true]]);
    });
    it('returns `null` when `-` behavior present', () => {
      behaviors = 'second -';
      expect(behaviorEntries());
    });
    it('returns empty map when only `*` behavior present', () => {
      behaviors = '*';
      expect(behaviorEntries()).toHaveLength(0);
    });
    it('ignores `*` behavior', () => {
      behaviors = '* other';
      expect(behaviorEntries()).toEqual([['other', true]]);
    });
    it('recognizes qualified behaviors', () => {
      behaviors = 'a:b:c:d';
      expect(behaviorEntries()).toEqual([['a', 'b'], ['a:b', 'c'], ['a:b:c', 'd'], ['a:b:c:d', true]]);
    });
    it('recognizes behavior negation', () => {
      behaviors = '-a:b:c:d';
      expect(behaviorEntries()).toEqual([['a:b:c:d', false]]);
    });
    it('combines behaviors', () => {
      behaviors = 'a:b:c -a:b';
      expect(behaviorEntries()).toEqual([['a', 'b'], ['a:b', false], ['a:b:c', true]]);
    });

    function behaviorEntries() {
      return [...elementBehaviors(element)!.entries()];
    }
  });
});
