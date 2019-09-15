import { ContextRegistry } from 'context-values';
import { afterEventOf } from 'fun-events';
import { DomFetchMutator } from './dom-fetch-mutator';

describe('fetch', () => {
  describe('DomFetchMutator', () => {

    let registry: ContextRegistry;
    let mutator: DomFetchMutator;

    beforeEach(() => {
      registry = new ContextRegistry();

      const values = registry.newValues();

      mutator = values.get(DomFetchMutator);
    });

    let nodes: Node[];
    let response: Response;
    let request: Request;
    let init: RequestInit;

    beforeEach(() => {
      nodes = [document];
      response = new Response('response');
      request = new Request('http://localhost/test');
      init = { headers: { 'X-Test': 'true' } };
    });

    it('does not modify nodes without mutators', async () => {
      expect(await mutate()).toEqual(nodes);
    });
    it('does not modify nodes without mutators and `null` fallback value', async () => {
      expect(await mutate(registry.newValues().get(DomFetchMutator, { or: null })!)).toEqual(nodes);
    });
    it('applies registered mutator', async () => {

      const newNodes = [document, document.createElement('div')];
      const mockMutator = jest.fn(() => afterEventOf<Node[]>(...newNodes));

      registry.provide({ a: DomFetchMutator, is: mockMutator });

      expect(await mutate()).toEqual(newNodes);
    });

    function mutate(mut = mutator): Promise<Node[]> {
      return new Promise(resolve => {
        mut(nodes, response, request, init).once((...received) => resolve(received));
      });
    }
  });
});
