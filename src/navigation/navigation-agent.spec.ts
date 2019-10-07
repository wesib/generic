import { ContextRegistry } from 'context-values';
import { Navigation } from './navigation';
import { NavigationAgent } from './navigation-agent';
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
    let action: 'pre-navigate' | 'pre-replace';
    let from: Navigation.Location;
    let to: Navigation.URLTarget;

    beforeEach(() => {
      mockNavigate = jest.fn();
      action = 'pre-navigate';
      from = { url: new URL('http://localhost/index'), data: 'initial' };
      to = { url: new URL('http://localhost/other'), data: 'updated', title: 'New title' };
    });

    it('performs navigation without agents', () => {
      agent(mockNavigate, action, from, to);
      expect(mockNavigate).toHaveBeenCalledWith(to);
    });
    it('performs navigation without agents with `null` fallback value', () => {
      agent = registry.newValues().get(NavigationAgent, { or: null }) as NavigationAgent;
      agent(mockNavigate, action, from, to);
      expect(mockNavigate).toHaveBeenCalledWith(to);
    });
    it('calls the registered agent', async () => {

      const mockAgent = jest.fn((next: any) => next());

      registry.provide({ a: NavigationAgent, is: mockAgent });

      agent(mockNavigate, action, from, to);
      expect(mockAgent).toHaveBeenCalledWith(expect.any(Function), action, from, to);
    });
    it('performs navigation by calling `next`', async () => {
      registry.provide({ a: NavigationAgent, is: next => next() });

      agent(mockNavigate, action, from, to);
      expect(mockNavigate).toHaveBeenCalledWith(to);
    });
    it('updates URL', async () => {
      registry.provide({ a: NavigationAgent, is: next => next({ url: new URL('http://localhost/other') }) });

      agent(mockNavigate, action, from, to);
      expect(mockNavigate).toHaveBeenCalledWith({ ...to, url: new URL('http://localhost/other') });
    });
    it('updates title', async () => {
      registry.provide({ a: NavigationAgent, is: next => next({ title: 'other title' }) });

      agent(mockNavigate, action, from, to);
      expect(mockNavigate).toHaveBeenCalledWith({ ...to, title: 'other title' });
    });
    it('updates data', async () => {
      registry.provide({ a: NavigationAgent, is: next => next({ data: 'other data' }) });

      agent(mockNavigate, action, from, to);
      expect(mockNavigate).toHaveBeenCalledWith({ ...to, data: 'other data' });
    });
  });
});
