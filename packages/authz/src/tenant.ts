import { AuthenticatedTenantContext } from './types.js';

export interface ResolvedTenantScope {
  organizationId: string;
  clientId?: string;
  countyId: string;
}

/**
 * Resolves a concrete TenantScope from an authenticated Clerk session context.
 * Strictly verifies county licensing and prevents cross-tenant access.
 */
export function resolveTenantScope(
  ctx: AuthenticatedTenantContext,
  requestedCountyId?: string
): ResolvedTenantScope {
  if (!ctx.clerkOrgId) {
    throw new Error('Security Violation: Clerk organization ID is missing from session');
  }

  const targetCounty = requestedCountyId || ctx.licensedCountyIds[0];
  if (!targetCounty) {
    throw new Error(
      `Security Violation: No licensed county available for organization '${ctx.clerkOrgId}'`
    );
  }

  // Operator admins have platform-wide oversight; clients and researchers must be licensed
  if (ctx.role !== 'org:operator_admin' && !ctx.licensedCountyIds.includes(targetCounty)) {
    throw new Error(
      `Security Violation: Organization '${ctx.clerkOrgId}' is not licensed for county '${targetCounty}'`
    );
  }

  return {
    organizationId: ctx.clerkOrgId,
    clientId: ctx.clientId,
    countyId: targetCounty,
  };
}
