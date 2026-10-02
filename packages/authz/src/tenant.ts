import { AuthenticatedTenantContext } from './types.js';

export interface ResolvedTenantScope {
  organizationId: string;
  clientId?: string;
  countyId: string;
}

function resolveTargetCounty(ctx: AuthenticatedTenantContext, requestedCountyId?: string): string {
  const target = requestedCountyId ?? ctx.licensedCountyIds[0];
  if (!target) {
    throw new Error(
      `Security Violation: No licensed county available for organization '${ctx.clerkOrgId}'`
    );
  }
  return target;
}

function assertCountyAccessAuthorized(ctx: AuthenticatedTenantContext, countyId: string): void {
  if (ctx.role === 'org:operator_admin') {
    return;
  }
  if (!ctx.licensedCountyIds.includes(countyId)) {
    throw new Error(
      `Security Violation: Organization '${ctx.clerkOrgId}' is not licensed for county '${countyId}'`
    );
  }
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

  const targetCounty = resolveTargetCounty(ctx, requestedCountyId);
  assertCountyAccessAuthorized(ctx, targetCounty);

  return {
    organizationId: ctx.clerkOrgId,
    clientId: ctx.clientId,
    countyId: targetCounty,
  };
}
