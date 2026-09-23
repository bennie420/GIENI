import { AuthContext, ClerkRole, Permission } from './types.js';

export const ROLE_PERMISSIONS: Record<ClerkRole, Permission[]> = {
  'org:operator_admin': [
    'cases:read',
    'cases:write',
    'evidence:read',
    'evidence:propose',
    'evidence:verify',
    'exceptions:resolve',
    'qc:review',
    'delivery:certify',
    'delivery:read',
    'admin:all',
  ],
  'org:researcher': [
    'cases:read',
    'cases:write',
    'evidence:read',
    'evidence:propose',
    'exceptions:resolve',
  ],
  'org:qc_reviewer': [
    'cases:read',
    'evidence:read',
    'evidence:verify',
    'qc:review',
    'delivery:certify',
  ],
  'org:client_user': [
    'delivery:read',
    'feedback:submit',
  ],
};

export function hasPermission(ctx: AuthContext, permission: Permission): boolean {
  const allowed = ROLE_PERMISSIONS[ctx.role] || [];
  const normalized = permission.startsWith('org:')
    ? (permission.slice(4) as Permission)
    : permission;
  return (
    allowed.includes('admin:all') ||
    allowed.includes('org:admin:all' as Permission) ||
    allowed.includes(normalized) ||
    allowed.includes(`org:${normalized}` as Permission)
  );
}

export function assertPermission(ctx: AuthContext, permission: Permission): void {
  if (!hasPermission(ctx, permission)) {
    throw new Error(
      `Forbidden: Role '${ctx.role}' does not possess required permission '${permission}'`
    );
  }
}
