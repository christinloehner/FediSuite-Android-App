import { useQuery } from '@tanstack/react-query';

import { fetchAdminUsers } from '../api/admin';
import { useInstanceStore } from '../store/instanceStore';
import { useSessionStore } from '../store/sessionStore';

type Input = {
  page: number;
  pageSize: number;
  search: string;
};

export function useAdminUsers({ page, pageSize, search }: Input) {
  const instanceUrl = useInstanceStore((state) => state.activeInstanceUrl);
  const token = useSessionStore((state) => state.token);
  const language = useSessionStore((state) => state.language);

  return useQuery({
    queryKey: ['instance', instanceUrl, 'admin', 'users', page, pageSize, search],
    queryFn: () => fetchAdminUsers(instanceUrl!, token!, language, { page, pageSize, search }),
    enabled: Boolean(instanceUrl && token),
    placeholderData: (previousData) => previousData,
  });
}
