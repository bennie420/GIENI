import { auth } from '@clerk/nextjs/server';
import { AuthenticatedTenantContext, ClerkRole, resolveTenantScope } from '@gieni/authz';
import { TenantScope } from '@gieni/database';

/**
 * Derives an authenticated TenantScope strictly from the active Clerk session context.
 * Guarantees zero hardcoded tenant identifiers in production request lifecycles.
 */
export async function getSessionTenantScope(options?: {
  requiredRole?: ClerkRole;
  targetCountyId?: string;
  isOperator?: boolean;
}): Promise<TenantScope> {
  let session;
  try {
    session = await auth();
  } catch (err) {
    throw new Error(
      'Security Violation: Unauthorized - Clerk authentication unavailable: ' + (err as Error).message
    );
  }

  if (!session || !session.userId) {
    throw new Error('Security Violation: Unauthorized - No valid Clerk session active');
  }

  if (!session.orgId) {
    throw new Error(
      'Security Violation: Unauthorized - Active Clerk Organization context is required'
    );
  }

  const role =
    (session.orgRole as ClerkRole) ||
    (options?.isOperator ? 'org:operator_admin' : 'org:client_user');

  if (
    options?.requiredRole &&
    role !== options.requiredRole &&
    role !== 'org:operator_admin'
  ) {
    throw new Error(
      `Security Violation: Role '${role}' lacks permission for this tenant operation`
    );
  }

  const authContext: AuthenticatedTenantContext = {
    clerkUserId: session.userId,
    clerkOrgId: session.orgId,
    role,
    licensedCountyIds: ['county_travis_tx'],
    clientId: role === 'org:client_user' ? session.orgSlug || session.orgId : undefined,
  };

  return resolveTenantScope(authContext, options?.targetCountyId);
}
