import { useQuery } from '@tanstack/react-query';

import { fetchBootstrap } from '../api/mobile';
import { useInstanceStore } from '../store/instanceStore';
import { useSessionStore } from '../store/sessionStore';

export function useBootstrap() {
  const instanceUrl = useInstanceStore((state) => state.activeInstanceUrl);
  const token = useSessionStore((state) => state.token);
  const language = useSessionStore((state) => state.language);

  return useQuery({
    queryKey: ['instance', instanceUrl, 'bootstrap'],
    queryFn: () => fetchBootstrap(instanceUrl!, token!, language),
    enabled: Boolean(instanceUrl && token),
  });
}
