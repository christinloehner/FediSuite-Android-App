import { useQueryClient } from '@tanstack/react-query';

import { useInstanceStore } from '../store/instanceStore';
import { useSessionStore } from '../store/sessionStore';
import { deleteTokenForInstance } from '../utils/storage';

export function useAuthRecovery() {
  const queryClient = useQueryClient();
  const instanceUrl = useInstanceStore((state) => state.activeInstanceUrl);
  const clearSession = useSessionStore((state) => state.clearSession);

  return async function recoverFromAuthFailure() {
    if (instanceUrl) {
      await deleteTokenForInstance(instanceUrl);
      await queryClient.removeQueries({ queryKey: ['instance', instanceUrl] });
    }

    clearSession();
  };
}
