import { useContext } from 'react';

import { RealmContext } from '@/utils/RealmContext';

export const useOptionalRealm = () => {
  const context = useContext(RealmContext);
  return context?.realm ?? null;
};
