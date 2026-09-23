# County Adapter Specification: Maricopa County, AZ (FIPS: 04013)

## 1. Jurisdiction Overview
- **Court**: Maricopa County Superior Court (Probate & Mental Health Division).
- **Assessor**: Maricopa County Assessor (Parcel Viewer & Tax Roll).
- **Recorder**: Maricopa County Recorder (Recorded Documents & Deeds).

## 2. Source Documents & Retrieval
- **Petition for Letters**: Primary source for decedent date of death, petitioner identity, requested fiduciary role, and initial asset estimates.
- **Order Appointing Personal Representative & Letters**: Canonical legal instrument conferring actual legal authority.
- **Warranty / Beneficiary Deeds**: Recorded title instruments identifying ownership vesting and joint tenancy survivorship.

## 3. Adapter Boundaries
- Scraper/Adapter code must run in isolated worker tasks.
- If county records are unindexed or parcel queries yield no match, the adapter must return `NO_RECORDS_LOCATED` rather than generating mock records.
