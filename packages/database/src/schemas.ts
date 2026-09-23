import { z } from 'zod';

export const TenantScopeSchema = z.object({
  organizationId: z.string().min(1),
  clientId: z.string().optional(),
  countyId: z.string().optional(),
});

export const BaseEntitySchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  clientId: z.string().nullable().optional(),
  countyId: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  schemaVersion: z.number().int().min(1),
});
