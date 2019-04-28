import { ContextRequest, ContextTarget, SingleContextKey } from 'context-values';
import { NamespaceAliaser } from 'style-producer';

/**
 * Namespace aliaser used across the application.
 *
 * Maps namespaces to their unique aliases.
 *
 * @param ns A definition of namespace to find alias for.
 *
 * @returns Namespace alias.
 */
export type BootstrapNamespaceAliaser = NamespaceAliaser;

export const BootstrapNamespaceAliaser:
    ContextTarget<BootstrapNamespaceAliaser> & ContextRequest<BootstrapNamespaceAliaser> =
    /*#__PURE__*/ new SingleContextKey<BootstrapNamespaceAliaser>('bootstrap-namespace-aliaser');
