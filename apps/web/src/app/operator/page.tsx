import React from 'react';
import { getOperatorData } from '../../lib/data';
import OperatorConsole from './OperatorConsole';

export default async function OperatorConsolePage() {
  const data = await getOperatorData();

  return <OperatorConsole initialData={data} />;
}

