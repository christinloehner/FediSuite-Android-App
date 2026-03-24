import { useQuery } from '@tanstack/react-query';

import { fetchAccountDashboard } from '../api/mobile';
import { useInstanceStore } from '../store/instanceStore';
import { useSessionStore } from '../store/sessionStore';

export function useAccountDashboard(input: {
  accountId: number | null;
  days: number;
  topPostsSort?: string;
  topHashtagsSort?: string;
}) {
  const instanceUrl = useInstanceStore((state) => state.activeInstanceUrl);
  const token = useSessionStore((state) => state.token);
  const language = useSessionStore((state) => state.language);

  return useQuery({
    queryKey: [
      'instance',
      instanceUrl,
      'account-dashboard',
      input.accountId,
      input.days,
      input.topPostsSort ?? 'total_engagement',
      input.topHashtagsSort ?? 'total_engagement',
    ],
    queryFn: () =>
      fetchAccountDashboard(instanceUrl!, token!, language, {
        accountId: input.accountId!,
        days: input.days,
        topPostsSort: input.topPostsSort,
        topHashtagsSort: input.topHashtagsSort,
      }),
    enabled: Boolean(instanceUrl && token && input.accountId),
  });
}
