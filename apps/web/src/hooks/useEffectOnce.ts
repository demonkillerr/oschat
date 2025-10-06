import { useEffect, EffectCallback } from 'react';

export function useEffectOnce(effect: EffectCallback) {
  // Simple helper if needed later; currently unused
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(effect, []);
}

