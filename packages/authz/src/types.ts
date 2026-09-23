export type ClerkRole =
  | 'org:operator_admin'
  | 'org:researcher'
  | 'org:qc_reviewer'
  | 'org:client_user';

export type Permission =
  | 'cases:read'
  | 'cases:write'
  | 'evidence:read'
  | 'evidence:propose'
  | 'evidence:verify'
  | 'exceptions:resolve'
  | 'qc:review'
  | 'delivery:certify'
  | 'delivery:read'
  | 'feedback:submit'
  | 'admin:all';

export interface AuthContext {
  userId: string;
  organizationId: string;
  role: ClerkRole;
  isOperator: boolean;
  licensedCountyIds?: string[];
}
