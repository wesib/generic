import { noop } from 'call-thru';
import { importNode } from './import-node';

describe('util', () => {

  let doc: Document;

  beforeEach(() => {
    doc = document.implementation.createHTMLDocument('Test document');
  });

  describe('importNode', () => {
    it('imports text element', () => {

      const node = document.createTextNode('test');
      const clone = importNode(node, doc.body);

      expect(clone.ownerDocument).toBe(doc);
      expect(doc.body.textContent).toBe('test');
      expect(doc.body.contains(clone)).toBe(true);
    });
    it('imports element content', () => {

      const el = document.createElement('div');

      el.innerHTML = '<span>test</span>';

      const clone = importNode(el, doc.body);

      expect(clone.ownerDocument).toBe(doc);
      expect(doc.body.contains(clone)).toBe(true);
      expect(clone.childNodes).toHaveLength(1);
      expect(clone.childNodes[0].nodeName).toBe('SPAN');
      expect(clone.textContent).toBe('test');
    });
    it('imports element contents with the given import function', () => {

      const el = document.createElement('div');

      el.innerHTML = '<span>test</span>';

      const clone = importNode(el, doc.body, noop);
      expect(clone.ownerDocument).toBe(doc);
      expect(doc.body.contains(clone)).toBe(true);
      expect(clone.childNodes).toHaveLength(0);
    });
    it('inserts imported element before another one', () => {

      const next = doc.body.appendChild(doc.createTextNode('.second'));
      const el = document.createElement('div');

      el.innerHTML = '<span>first</span>';

      const clone = importNode(el, doc.body, next);

      expect(clone.ownerDocument).toBe(doc);
      expect(doc.body.contains(clone)).toBe(true);
      expect(clone.childNodes).toHaveLength(1);
      expect(clone.childNodes[0].nodeName).toBe('SPAN');
      expect(doc.body.textContent).toBe('first.second');
    });
  });
});
