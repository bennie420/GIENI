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

export interface SessionTenantOptions {
  requiredRole?: ClerkRole;
  targetCountyId?: string;
  isOperator?: boolean;
}

interface ValidatedClerkSession {
  userId: string;
  orgId: string;
  orgRole?: string;
  orgSlug?: string;
}

/**
 * Retrieves and validates the active Clerk authentication session.
 */
async function getValidatedClerkSession(): Promise<ValidatedClerkSession> {
  let session;
  try {
    session = await auth();
  } catch (err) {
    throw new UnauthorizedError(
      'Security Violation: Clerk authentication unavailable: ' + (err as Error).message
    );
  }

  if (!session?.userId) {
    throw new UnauthorizedError('Security Violation: Unauthorized - No valid Clerk session active');
  }

  if (!session.orgId) {
    throw new UnauthorizedError(
      'Security Violation: Unauthorized - Active Clerk Organization context is required'
    );
  }

  return {
    userId: session.userId,
    orgId: session.orgId,
    orgRole: session.orgRole,
    orgSlug: session.orgSlug,
  };
}

/**
 * Resolves the user's role from session metadata or operator flag defaults.
 */
function resolveUserRole(sessionRole?: string, isOperator?: boolean): ClerkRole {
  if (sessionRole) {
    return sessionRole as ClerkRole;
  }
  return isOperator ? 'org:operator_admin' : 'org:client_user';
}

/**
 * Validates that the active role satisfies any required role constraints.
 */
function isRolePermitted(role: ClerkRole, requiredRole?: ClerkRole): boolean {
  if (!requiredRole) return true;
  if (role === 'org:operator_admin') return true;
  return role === requiredRole;
}

function assertAuthorizedRole(role: ClerkRole, requiredRole?: ClerkRole): void {
  if (isRolePermitted(role, requiredRole)) {
    return;
  }
  throw new UnauthorizedError(
    `Security Violation: Role '${role}' lacks permission for this tenant operation`
  );
}

export interface CountyLicenseValidationContext {
  role: ClerkRole;
  orgId: string;
  licensedCounties: string[];
}

/**
 * Validates that non-operator organizations possess at least one licensed county.
 */
function assertActiveCountyLicenses(ctx: CountyLicenseValidationContext): void {
  if (ctx.role === 'org:operator_admin') {
    return;
  }
  if (ctx.licensedCounties.length === 0) {
    throw new UnauthorizedError(
      `Security Violation: Organization '${ctx.orgId}' has zero active licensed counties`
    );
  }
}

export interface ClientScopeContext {
  role: ClerkRole;
  orgSlug?: string;
  orgId?: string;
}

/**
 * Derives the tenant client identifier for client-tier users.
 */
function resolveClientId(ctx: ClientScopeContext): string | undefined {
  if (ctx.role !== 'org:client_user') {
    return undefined;
  }
  return ctx.orgSlug || ctx.orgId;
}

/**
 * Derives an authenticated TenantScope strictly from the active Clerk session context (Gieni OS SH-001 & SH-002).
 * Dynamically resolves licensed counties via LicenseService without hardcoded arrays.
 * Guarantees zero synthetic tenant identities in production request lifecycles.
 */
export async function getSessionTenantScope(options?: SessionTenantOptions): Promise<TenantScope> {
  const session = await getValidatedClerkSession();
  const role = resolveUserRole(session.orgRole, options?.isOperator);

  assertAuthorizedRole(role, options?.requiredRole);

  const dynamicCounties = await defaultLicenseService.getLicensedCountiesForOrg(session.orgId);
  assertActiveCountyLicenses({ role, orgId: session.orgId, licensedCounties: dynamicCounties });

  const authContext: AuthenticatedTenantContext = {
    clerkUserId: session.userId,
    clerkOrgId: session.orgId,
    role,
    licensedCountyIds: dynamicCounties,
    clientId: resolveClientId({ role, orgSlug: session.orgSlug, orgId: session.orgId }),
  };

  return resolveTenantScope(authContext, options?.targetCountyId);
}

