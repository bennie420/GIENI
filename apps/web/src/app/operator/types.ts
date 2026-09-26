export type TabKey = 'dashboard' | 'intake' | 'review' | 'investigation' | 'exceptions' | 'qc';

export interface OperatorData {
  cases: any[];
  documents: any[];
  claims: any[];
  parcels: any[];
  authorities: any[];
  ownerships: any[];
  scores: any[];
  opportunities: any[];
  exceptions: any[];
  qcReviews: any[];
  deliveries: any[];
  isConnectedToAtlas: boolean;
}
