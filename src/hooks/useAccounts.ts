import { useQuery } from '@tanstack/react-query';

import { fetchAccounts } from '../api/accounts';
import { useInstanceStore } from '../store/instanceStore';
import { useSessionStore } from '../store/sessionStore';

export function useAccounts() {
  const instanceUrl = useInstanceStore((state) => state.activeInstanceUrl);
  const token = useSessionStore((state) => state.token);
  const language = useSessionStore((state) => state.language);

  return useQuery({
    queryKey: ['instance', instanceUrl, 'accounts'],
    queryFn: () => fetchAccounts(instanceUrl!, token!, language),
    enabled: Boolean(instanceUrl && token),
  });
}
