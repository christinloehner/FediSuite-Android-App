import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useInstanceStore } from '../store/instanceStore';
import { useSessionStore } from '../store/sessionStore';

export function useForegroundRefresh() {
  const queryClient = useQueryClient();
  const instanceUrl = useInstanceStore((state) => state.activeInstanceUrl);
  const token = useSessionStore((state) => state.token);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active' || !instanceUrl || !token) {
        return;
      }

      void queryClient.invalidateQueries({
        queryKey: ['instance', instanceUrl],
        refetchType: 'active',
      });
    });

    return () => {
      subscription.remove();
    };
  }, [instanceUrl, queryClient, token]);
}
