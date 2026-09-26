import { z } from 'zod';

export const ClerkRoleSchema = z.enum([
  'org:operator_admin',
  'org:researcher',
  'org:qc_reviewer',
  'org:client_user',
]);

export const PermissionSchema = z.enum([
  'cases:read',
  'cases:write',
  'evidence:read',
  'evidence:propose',
  'evidence:verify',
  'exceptions:resolve',
  'qc:review',
  'delivery:certify',
  'delivery:read',
  'feedback:submit',
  'admin:all',
]);

export const AuthContextSchema = z.object({
  userId: z.string().min(1),
  organizationId: z.string().min(1),
  role: ClerkRoleSchema,
  isOperator: z.boolean(),
  licensedCountyIds: z.array(z.string()).optional(),
});

export const AuthenticatedTenantContextSchema = z.object({
  clerkUserId: z.string().min(1),
  clerkOrgId: z.string().min(1),
  role: ClerkRoleSchema,
  licensedCountyIds: z.array(z.string()),
  clientId: z.string().optional(),
});

