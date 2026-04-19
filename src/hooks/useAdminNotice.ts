import { useQuery } from '@tanstack/react-query';

import { fetchAdminNotice } from '../api/admin';
import { useInstanceStore } from '../store/instanceStore';
import { useSessionStore } from '../store/sessionStore';

export function useAdminNotice() {
  const instanceUrl = useInstanceStore((state) => state.activeInstanceUrl);
  const token = useSessionStore((state) => state.token);
  const language = useSessionStore((state) => state.language);

  return useQuery({
    queryKey: ['instance', instanceUrl, 'admin', 'notice'],
    queryFn: () => fetchAdminNotice(instanceUrl!, token!, language),
    enabled: Boolean(instanceUrl && token),
  });
}
