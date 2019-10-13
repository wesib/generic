/**
 * @module @wesib/generic
 */
import { BootstrapWindow } from '@wesib/wesib';
import { ContextUpKey, ContextUpRef, ContextValueOpts, ContextValues } from 'context-values';
import { AfterEvent, EventKeeper } from 'fun-events';
import { Navigation } from './navigation';
import { Page, TargetPage } from './page';
import Target = Navigation.Target;

/**
 * Navigation agent signature.
 *
 * The agent is called by navigation methods when leaving current page and may alter navigation processing.
 * E.g. change navigation target. For that it should be registered in appropriate context.
 *
 * All registered agents are organized into chain. The first agent in chain is called by navigation method.
 */
export type NavigationAgent =
/**
 * @param next  Either calls the next agent in chain, or applies the final navigation target if this agent is the last
 * one. Not calling this function effectively prevents navigation.
 * Accepts an optional [[Navigation.Target]] parameter. The original target will be used instead when omitted.
 * @param when  When navigation occurred. Either `pre-open`, or `pre-replace`.
 * @param from  The page to leave.
 * @param to  Navigation target page.
 */
    (
        this: void,
        next: (this: void, target?: Target) => void,
        when: 'pre-open' | 'pre-replace',
        from: Page,
        to: TargetPage,
    ) => void;

class NavigationAgentKey
    extends ContextUpKey<NavigationAgent.Combined, NavigationAgent>
    implements ContextUpRef<NavigationAgent.Combined, NavigationAgent, AfterEvent<NavigationAgent[]>> {

  constructor(name: string) {
    super(name);
  }

  grow<Ctx extends ContextValues>(
      opts: ContextValueOpts<
          Ctx,
          NavigationAgent.Combined,
          EventKeeper<NavigationAgent[]> | NavigationAgent,
          AfterEvent<NavigationAgent[]>>,
  ): NavigationAgent.Combined {

    const { document } = opts.context.get(BootstrapWindow);

    return (next, when, from, to) => {

      const result = opts.byDefault(() => combinedAgent);

      return result ? result(next, when, from, to) : next(to);
    };

    function combinedAgent(
        next: (this: void, target: Navigation.URLTarget) => void,
        when: 'pre-open' | 'pre-replace',
        from: Page,
        to: TargetPage,
    ): void {

      let agents!: NavigationAgent[];

      opts.seed.once((...sources) => agents = sources);

      return navigate(0, to);

      function navigate(agentIdx: number, agentTo: TargetPage): void {

        const agent = agents[agentIdx];

        if (!agent) {
          return next(agentTo);
        }

        agent(
            (
                {
                  url: nextURL = agentTo.url,
                  title: nextTitle = agentTo.title,
                  data: nextData = agentTo.data,
                }: Navigation.Target = agentTo,
            ) => navigate(
                agentIdx + 1,
                {
                  url: new URL(String(nextURL), document.baseURI),
                  title: nextTitle,
                  data: nextData,
                  get(request) {
                    return agentTo.get(request);
                  },
                  set(request, options) {
                    agentTo.set(request, options);
                  },
                },
            ),
            when,
            from,
            agentTo,
        );
      }
    }
  }

}

export namespace NavigationAgent {

  /**
   * Combined navigation agent signature.
   *
   * This is what is available under [[NavigationAgent]] key.
   */
  export type Combined =
  /**
   * @param next  Either calls the next agent in chain, or applies the final navigation target if this agent is the last
   * one. Not calling this function effectively prevents navigation.
   * Accepts an optional [[Navigation.Target]] parameter. The original target will be used instead when omitted.
   * @param when  When navigation occurred. Either `pre-open`, or `pre-replace`.
   * @param from  The page to leave.
   * @param to  Navigation target page.
   */
      (
          this: void,
          next: (this: void, target: Navigation.URLTarget) => void,
          when: 'pre-open' | 'pre-replace',
          from: Page,
          to: TargetPage,
      ) => void;

}

/**
 * A key of context value containing an [[NavigationAgent]] instance.
 *
 * The agent returned combines all registered agents into one. If no agent registered it just performs the navigation.
 */
export const NavigationAgent: ContextUpRef<NavigationAgent.Combined, NavigationAgent> =
    /*#__PURE__*/ new NavigationAgentKey('navigation-agent');
