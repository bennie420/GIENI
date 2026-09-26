import {
  getMongoDb,
  getTenantScopedRepository,
  TenantScope,
} from '@gieni/database';
import { ProbateCase, AuthorityAssessment } from '@gieni/authority';
import { PropertyParcel } from '@gieni/property';
import { OwnershipAssessment } from '@gieni/ownership';
import { SourceDocument, Claim } from '@gieni/evidence';
import { Opportunity, OpportunityScore } from '@gieni/scoring';
import { InvestigationException, QCReview } from '@gieni/qc';
import {
  ProbateOpportunityFile,
  ClientFeedback,
  ClientDisposition,
  LEGAL_DISCLAIMER,
} from '@gieni/delivery';

import { getSessionTenantScope } from './tenant-context';

async function resolveOperatorScope(scopeOverride?: TenantScope): Promise<TenantScope> {
  if (scopeOverride) return scopeOverride;
  try {
    return await getSessionTenantScope({ isOperator: true });
  } catch (authErr) {
    if (process.env.NODE_ENV === 'development') {
      return { organizationId: 'org_gieni_internal' };
    }
    throw authErr;
  }
}

async function queryAllOperatorEntities(db: any, scope: TenantScope) {
  const [
    cases, documents, claims, parcels, authorities,
    ownerships, scores, opportunities, exceptions, qcReviews, deliveries,
  ] = await Promise.all([
    getTenantScopedRepository<ProbateCase>('probateCases', db).findMany(scope),
    getTenantScopedRepository<SourceDocument & { countyId: string }>('sourceDocuments', db).findMany(scope),
    getTenantScopedRepository<Claim>('claims', db).findMany(scope),
    getTenantScopedRepository<PropertyParcel>('properties', db).findMany(scope),
    getTenantScopedRepository<AuthorityAssessment>('authorityAssessments', db).findMany(scope),
    getTenantScopedRepository<OwnershipAssessment>('ownershipAssessments', db).findMany(scope),
    getTenantScopedRepository<OpportunityScore>('opportunityScores', db).findMany(scope),
    getTenantScopedRepository<Opportunity>('opportunities', db).findMany(scope),
    getTenantScopedRepository<InvestigationException>('exceptions', db).findMany(scope),
    getTenantScopedRepository<QCReview>('qcReviews', db).findMany(scope),
    getTenantScopedRepository<ProbateOpportunityFile>('deliveries', db).findMany(scope),
  ]);

  return {
    cases, documents, claims, parcels, authorities,
    ownerships, scores, opportunities, exceptions, qcReviews, deliveries,
    isConnectedToAtlas: true,
  };
}

function emptyOperatorEntities() {
  return {
    cases: [],
    documents: [],
    claims: [],
    parcels: [],
    authorities: [],
    ownerships: [],
    scores: [],
    opportunities: [],
    exceptions: [],
    qcReviews: [],
    deliveries: [],
    isConnectedToAtlas: false,
  };
}

export async function getOperatorData(scopeOverride?: TenantScope) {
  const scope = await resolveOperatorScope(scopeOverride);
  try {
    const db = await getMongoDb();
    return await queryAllOperatorEntities(db, scope);
  } catch (err) {
    try {
      const localData = await queryAllOperatorEntities(undefined, scope);
      return {
        ...localData,
        isConnectedToAtlas: false,
      };
    } catch (localErr) {
      if (process.env.NODE_ENV === 'production') throw err;
      console.warn('[Operator Data] Could not read from database:', localErr);
      return emptyOperatorEntities();
    }
  }
}

async function resolveClientScope(scopeOverride?: TenantScope): Promise<TenantScope> {
  if (scopeOverride) return scopeOverride;
  try {
    return await getSessionTenantScope({ requiredRole: 'org:client_user' });
  } catch (authErr) {
    if (process.env.NODE_ENV === 'development') {
      return {
        organizationId: 'org_gieni_internal',
        clientId: 'client_austin_capital_partners',
        countyId: 'county_travis_tx',
      };
    }
    throw authErr;
  }
}

export async function getClientFeedData(scopeOverride?: TenantScope) {
  const scope = await resolveClientScope(scopeOverride);
  try {
    const db = await getMongoDb();
    const [deliveries, feedback] = await Promise.all([
      getTenantScopedRepository<ProbateOpportunityFile>('deliveries', db).findMany(scope),
      getTenantScopedRepository<ClientFeedback>('clientFeedback', db).findMany(scope),
    ]);

    return { deliveries, feedback, isConnectedToAtlas: true };
  } catch (err) {
    try {
      const [deliveries, feedback] = await Promise.all([
        getTenantScopedRepository<ProbateOpportunityFile>('deliveries', undefined).findMany(scope),
        getTenantScopedRepository<ClientFeedback>('clientFeedback', undefined).findMany(scope),
      ]);
      return { deliveries, feedback, isConnectedToAtlas: false };
    } catch (localErr) {
      if (process.env.NODE_ENV === 'production') throw err;
      console.warn('[Client Data] Could not read from live MongoDB Atlas or local store:', localErr);
      return { deliveries: [], feedback: [], isConnectedToAtlas: false };
    }
  }
}

export * from './actions';
