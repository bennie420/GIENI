import { auth } from '@clerk/nextjs/server';
import { 
  AuthenticatedTenantContext, 
  ClerkRole, 
  resolveTenantScope, 
  defaultLicenseService 
} from '@gieni/authz';
import { TenantScope } from '@gieni/database';

export class UnauthorizedError extends Error {
  constructor(message = 'Security Violation: Unauthorized - No valid Clerk session active') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Derives an authenticated TenantScope strictly from the active Clerk session context (Gieni OS SH-001 & SH-002).
 * Dynamically resolves licensed counties via LicenseService without hardcoded arrays.
 * Guarantees zero synthetic tenant identities in production request lifecycles.
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
    throw new UnauthorizedError(
      'Security Violation: Clerk authentication unavailable: ' + (err as Error).message
    );
  }

  if (!session || !session.userId) {
    throw new UnauthorizedError('Security Violation: Unauthorized - No valid Clerk session active');
  }

  if (!session.orgId) {
    throw new UnauthorizedError(
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
    throw new UnauthorizedError(
      `Security Violation: Role '${role}' lacks permission for this tenant operation`
    );
  }

  // Dynamic county licensing resolution from authoritative LicenseService (SH-001)
  const dynamicCounties = await defaultLicenseService.getLicensedCountiesForOrg(session.orgId);
  if (role !== 'org:operator_admin' && dynamicCounties.length === 0) {
    throw new UnauthorizedError(
      `Security Violation: Organization '${session.orgId}' has zero active licensed counties`
    );
  }

  const authContext: AuthenticatedTenantContext = {
    clerkUserId: session.userId,
    clerkOrgId: session.orgId,
    role,
    licensedCountyIds: dynamicCounties,
    clientId: role === 'org:client_user' ? session.orgSlug || session.orgId : undefined,
  };

  return resolveTenantScope(authContext, options?.targetCountyId);
}
