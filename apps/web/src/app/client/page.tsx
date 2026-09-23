import React from 'react';
import { getClientFeedData } from '../../lib/data';
import ClientPortal from './ClientPortal';

export default async function ClientPortalPage() {
  const data = await getClientFeedData();

  return <ClientPortal initialData={data} />;
}

