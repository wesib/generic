import { ContextRequest, ContextTarget, SingleContextKey } from 'context-values';
import { NamespaceAliaser } from 'style-producer';

/**
 * Namespace aliaser used by default.
 *
 * Maps namespaces to their unique aliases.
 *
 * @param ns A definition of namespace to find alias for.
 *
 * @returns Namespace alias.
 */
export type DefaultNamespaceAliaser = NamespaceAliaser;

/**
 * A key of bootstrap context value containing the default namespace aliaser.
 */
export const DefaultNamespaceAliaser:
    ContextTarget<DefaultNamespaceAliaser> & ContextRequest<DefaultNamespaceAliaser> =
    /*#__PURE__*/ new SingleContextKey<DefaultNamespaceAliaser>('bootstrap-namespace-aliaser');
