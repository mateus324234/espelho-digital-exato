
import { useState, useCallback } from 'react';

interface Metrics {
  isRegistered: boolean;
  visitCount: number;
  lastVisit: string | null;
}

export const useMetrics = () => {
  const [metrics, setMetrics] = useState<Metrics>({
    isRegistered: false,
    visitCount: 0,
    lastVisit: null
  });

  const registerVisit = useCallback(() => {
    const now = new Date().toISOString();
    const currentCount = parseInt(localStorage.getItem('visitCount') || '0', 10);
    const newCount = currentCount + 1;
    
    localStorage.setItem('visitCount', newCount.toString());
    localStorage.setItem('lastVisit', now);
    
    setMetrics({
      isRegistered: true,
      visitCount: newCount,
      lastVisit: now
    });
    
    console.log('Visita registrada:', { visitCount: newCount, lastVisit: now });
  }, []);

  const getMetrics = useCallback(() => {
    const visitCount = parseInt(localStorage.getItem('visitCount') || '0', 10);
    const lastVisit = localStorage.getItem('lastVisit');
    
    return {
      isRegistered: visitCount > 0,
      visitCount,
      lastVisit
    };
  }, []);

  return {
    ...metrics,
    registerVisit,
    getMetrics
  };
};
