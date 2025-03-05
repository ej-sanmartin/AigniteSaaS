import { useEffect, useLayoutEffect } from 'react';

// Use useLayoutEffect in browser and useEffect in SSR
export const useIsomorphicLayoutEffect = 
  typeof window !== 'undefined' ? useLayoutEffect : useEffect; 