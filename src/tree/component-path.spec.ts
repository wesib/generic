import { ComponentPath } from './component-path';

describe('tree/component-path', () => {
  describe('ComponentPath', () => {
    describe('fragment', () => {
      it('returns normalized fragment', () => {

        const fragment = { name: 'some-name' };

        expect(ComponentPath.fragment(fragment)).toBe(fragment);
      });
      it('interprets empty condition', () => {
        expect(ComponentPath.fragment('')).toEqual({});
      });
      it('interprets wildcard condition', () => {
        expect(ComponentPath.fragment('*')).toEqual({});
      });
      it('interprets element name', () => {
        expect(ComponentPath.fragment('some-name')).toEqual({ name: 'some-name' });
        expect(ComponentPath.fragment('name-2')).toEqual({ name: 'name-2' });
      });
      it('interprets component identifier', () => {
        expect(ComponentPath.fragment('!foo')).toEqual({ uid: 'foo'});
        expect(ComponentPath.fragment('!12')).toEqual({ uid: '12'});
      });
      it('interprets node index', () => {
        expect(ComponentPath.fragment('0')).toEqual({ index: 0 });
        expect(ComponentPath.fragment('545')).toEqual({ index: 545 });
        expect(ComponentPath.fragment('999')).toEqual({ index: 999 });
      });
      it('interprets multiple conditions', () => {
        expect(ComponentPath.fragment('some-name;!uid;*;13;')).toEqual({
          name: 'some-name',
          uid: 'uid',
          index: 13,
        });
      });
    });
    describe('of', () => {
      it('returns normalized path', () => {

        const path = [{ name: 'parent' }, { name: 'child' }];

        expect(ComponentPath.of(path)).toBe(path);
      });
      it('returns unique path', () => {

        const path: ComponentPath.Unique = [{ uid: 'parent-uid' }, { uid: 'child-uid' }];
        const unique: ComponentPath.Unique = ComponentPath.of(path);

        expect(unique).toBe(path);
      });
      it('interprets string fragments', () => {

        const path = [{ name: 'parent' }, 'child' ];

        expect(ComponentPath.of(path)).toEqual([{ name: 'parent' }, { name: 'child' }]);
      });
      it('interprets string', () => {

        const path = 'parent/child';

        expect(ComponentPath.of(path)).toEqual([{ name: 'parent' }, { name: 'child' }]);
      });
    });
  });
});
