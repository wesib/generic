/**
 * @module @wesib/generic
 */
import { ContextUpKey, ContextUpRef, ContextValueOpts, ContextValues } from 'context-values';
import { AfterEvent, EventKeeper } from 'fun-events';
import { Navigation } from './navigation';

/**
 * Navigation agent signature.
 *
 * The agent is called by navigation method in pre-navigation phase and may alter navigation processing.
 * E.g. change navigation target. For that it should be registered in appropriate context.
 *
 * All registered agents are organized into chain. The first agent in chain is called by navigation method.
 */
export type NavigationAgent =
/**
 * @param next  Either calls the next agent in chain, or applies the final navigation target if this agent is the last
 * one. Not calling this function effectively prevents navigation.
 * Accepts an optional [[Navigation.Target]] parameter. The original target will be used instead when omitted.
 * @param action  Navigation action. Either `pre-navigate`, or `pre-replace`.
 * @param from  Source navigation location.
 * @param to  Navigation target.
 */
    (
        this: void,
        next: (this: void, target?: Partial<Navigation.URLTarget>) => void,
        action: 'pre-navigate' | 'pre-replace',
        from: Navigation.Location,
        to: Navigation.URLTarget,
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
    return (next, action, from, to) => {

      const result = opts.byDefault(() => combinedAgent);

      return result ? result(next, action, from, to) : next(to);
    };

    function combinedAgent(
        next: (this: void, target: Navigation.URLTarget) => void,
        action: 'pre-navigate' | 'pre-replace',
        from: Navigation.Location,
        to: Navigation.URLTarget,
    ): void {

      let agents!: NavigationAgent[];

      opts.seed.once((...sources) => agents = sources);

      return navigate(0, to);

      function navigate(agentIdx: number, agentTo: Navigation.URLTarget): void {

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
                }: Partial<Navigation.URLTarget> = agentTo,
            ) => navigate(agentIdx + 1, { url: nextURL, title: nextTitle, data: nextData }),
            action,
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
   * @param action  Navigation action. Either `pre-navigate`, or `pre-replace`.
   * @param from  Source navigation location.
   * @param to  Navigation target.
   */
      (
          this: void,
          next: (this: void, target: Navigation.URLTarget) => void,
          action: 'pre-navigate' | 'pre-replace',
          from: Navigation.Location,
          to: Navigation.URLTarget,
      ) => void;

}

/**
 * A key of context value containing an [[NavigationAgent]] instance.
 *
 * The agent returned combines all registered agents into one. If no agent registered it just performs the navigation.
 */
export const NavigationAgent: ContextUpRef<NavigationAgent.Combined, NavigationAgent> =
    /*#__PURE__*/ new NavigationAgentKey('navigation-agent');