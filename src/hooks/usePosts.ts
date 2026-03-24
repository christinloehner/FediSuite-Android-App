import { useQuery } from '@tanstack/react-query';

import { fetchPosts } from '../api/posts';
import { useInstanceStore } from '../store/instanceStore';
import { useSessionStore } from '../store/sessionStore';

export function usePosts() {
  const instanceUrl = useInstanceStore((state) => state.activeInstanceUrl);
  const token = useSessionStore((state) => state.token);
  const language = useSessionStore((state) => state.language);

  return useQuery({
    queryKey: ['instance', instanceUrl, 'posts'],
    queryFn: () => fetchPosts(instanceUrl!, token!, language),
    enabled: Boolean(instanceUrl && token),
  });
}
