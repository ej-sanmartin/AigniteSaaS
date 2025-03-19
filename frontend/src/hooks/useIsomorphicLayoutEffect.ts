import { useEffect, useLayoutEffect } from 'react';

// Use useLayoutEffect on client, useEffect on server
export const useIsomorphicLayoutEffect = 
  typeof window !== 'undefined' ? useLayoutEffect : useEffect; 