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

export async function getOperatorData(scopeOverride?: TenantScope) {
  try {
    let scope: TenantScope;
    try {
      scope = scopeOverride || (await getSessionTenantScope({ isOperator: true }));
    } catch (authErr) {
      if (process.env.NODE_ENV === 'development') {
        scope = { organizationId: 'org_gieni_internal', countyId: 'county_travis_tx' };
      } else {
        throw authErr;
      }
    }
    const db = await getMongoDb();

    const caseRepo = getTenantScopedRepository<ProbateCase>('probateCases', db);
    const docRepo = getTenantScopedRepository<SourceDocument & { countyId: string }>('sourceDocuments', db);
    const claimRepo = getTenantScopedRepository<Claim>('claims', db);
    const parcelRepo = getTenantScopedRepository<PropertyParcel>('properties', db);
    const authRepo = getTenantScopedRepository<AuthorityAssessment>('authorityAssessments', db);
    const ownRepo = getTenantScopedRepository<OwnershipAssessment>('ownershipAssessments', db);
    const scoreRepo = getTenantScopedRepository<OpportunityScore>('opportunityScores', db);
    const oppRepo = getTenantScopedRepository<Opportunity>('opportunities', db);
    const excRepo = getTenantScopedRepository<InvestigationException>('exceptions', db);
    const qcRepo = getTenantScopedRepository<QCReview>('qcReviews', db);
    const pofRepo = getTenantScopedRepository<ProbateOpportunityFile>('deliveries', db);

    const [
      cases,
      documents,
      claims,
      parcels,
      authorities,
      ownerships,
      scores,
      opportunities,
      exceptions,
      qcReviews,
      deliveries,
    ] = await Promise.all([
      caseRepo.findMany(scope),
      docRepo.findMany(scope),
      claimRepo.findMany(scope),
      parcelRepo.findMany(scope),
      authRepo.findMany(scope),
      ownRepo.findMany(scope),
      scoreRepo.findMany(scope),
      oppRepo.findMany(scope),
      excRepo.findMany(scope),
      qcRepo.findMany(scope),
      pofRepo.findMany(scope),
    ]);

    return {
      cases,
      documents,
      claims,
      parcels,
      authorities,
      ownerships,
      scores,
      opportunities,
      exceptions,
      qcReviews,
      deliveries,
      isConnectedToAtlas: true,
    };
  } catch (err) {
    if (process.env.NODE_ENV === 'production') {
      throw err;
    }
    console.warn('[Operator Data] Could not read from live MongoDB Atlas:', err);
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
}

export async function getClientFeedData(scopeOverride?: TenantScope) {
  try {
    let scope: TenantScope;
    try {
      scope =
        scopeOverride || (await getSessionTenantScope({ requiredRole: 'org:client_user' }));
    } catch (authErr) {
      if (process.env.NODE_ENV === 'development') {
        scope = {
          organizationId: 'org_gieni_internal',
          clientId: 'client_austin_capital_partners',
          countyId: 'county_travis_tx',
        };
      } else {
        throw authErr;
      }
    }
    const db = await getMongoDb();
    const pofRepo = getTenantScopedRepository<ProbateOpportunityFile>('deliveries', db);
    const feedbackRepo = getTenantScopedRepository<ClientFeedback>('clientFeedback', db);

    const [deliveries, feedback] = await Promise.all([
      pofRepo.findMany(scope),
      feedbackRepo.findMany(scope),
    ]);

    return {
      deliveries,
      feedback,
      isConnectedToAtlas: true,
    };
  } catch (err) {
    if (process.env.NODE_ENV === 'production') {
      throw err;
    }
    console.warn('[Client Data] Could not read from live MongoDB Atlas:', err);
    return {
      deliveries: [],
      feedback: [],
      isConnectedToAtlas: false,
    };
  }
}


export * from './actions';


