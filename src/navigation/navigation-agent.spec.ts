import { noop } from 'call-thru';
import { ContextRegistry } from 'context-values';
import { Navigation } from './navigation';
import { NavigationAgent } from './navigation-agent';
import { Page, TargetPage } from './page';
import Mock = jest.Mock;

describe('navigation', () => {
  describe('NavigationAgent', () => {

    let registry: ContextRegistry;
    let agent: NavigationAgent;

    beforeEach(() => {
      registry = new ContextRegistry();

      const values = registry.newValues();

      agent = values.get(NavigationAgent);
    });

    let mockNavigate: Mock<void, [Navigation.Target?]>;
    let when: 'pre-open' | 'pre-replace';
    let from: Page;
    let to: TargetPage;

    beforeEach(() => {
      mockNavigate = jest.fn();
      when = 'pre-open';
      from = { url: new URL('http://localhost/index'), data: 'initial', get: noop };
      to = { url: new URL('http://localhost/other'), data: 'updated', title: 'New title', get: noop };
    });

    it('performs navigation without agents', () => {
      agent(mockNavigate, when, from, to);
      expect(mockNavigate).toHaveBeenCalledWith(expect.objectContaining({ ...to, get: expect.any(Function) }));
    });
    it('performs navigation without agents with `null` fallback value', () => {
      agent = registry.newValues().get(NavigationAgent, { or: null }) as NavigationAgent;
      agent(mockNavigate, when, from, to);
      expect(mockNavigate).toHaveBeenCalledWith(to);
    });
    it('calls the registered agent', async () => {

      const mockAgent = jest.fn((next: any) => next());

      registry.provide({ a: NavigationAgent, is: mockAgent });

      agent(mockNavigate, when, from, to);
      expect(mockAgent).toHaveBeenCalledWith(expect.any(Function), when, from, to);
    });
    it('performs navigation by calling `next`', async () => {
      registry.provide({ a: NavigationAgent, is: next => next() });

      agent(mockNavigate, when, from, to);
      expect(mockNavigate).toHaveBeenCalledWith({ ...to, get: expect.any(Function) });
    });
    it('updates URL', async () => {
      registry.provide({ a: NavigationAgent, is: next => next({ url: new URL('http://localhost/other') }) });

      agent(mockNavigate, when, from, to);
      expect(mockNavigate).toHaveBeenCalledWith({
        ...to,
        url: new URL('http://localhost/other'),
        get: expect.any(Function),
      });
    });
    it('updates URL using path', async () => {
      registry.provide({ a: NavigationAgent, is: next => next({ url: 'other' }) });

      agent(mockNavigate, when, from, to);
      expect(mockNavigate).toHaveBeenCalledWith({
        ...to,
        url: new URL('http://localhost/other'),
        get: expect.any(Function),
      });
    });
    it('updates title', async () => {
      registry.provide({ a: NavigationAgent, is: next => next({ title: 'other title' }) });

      agent(mockNavigate, when, from, to);
      expect(mockNavigate).toHaveBeenCalledWith({
        ...to,
        title: 'other title',
        get: expect.any(Function),
      });
    });
    it('updates data', async () => {
      registry.provide({ a: NavigationAgent, is: next => next({ data: 'other data' }) });

      agent(mockNavigate, when, from, to);
      expect(mockNavigate).toHaveBeenCalledWith({
        ...to,
        data: 'other data',
        get: expect.any(Function),
      });
    });
  });
});
