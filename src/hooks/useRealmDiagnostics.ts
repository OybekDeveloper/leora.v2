import { useEffect } from 'react';
import { useFinanceDaos } from './useFinanceDaos';

export const useRealmDiagnostics = () => {
  const { accounts } = useFinanceDaos();

  useEffect(() => {
    try {
      const count = accounts.list().length;
      console.debug(`[Realm] Finance bootstrap complete. Accounts in store: ${count}`);
    } catch (error) {
      console.warn('[Realm] Unable to query accounts during diagnostics', error);
    }
  }, [accounts]);
};
