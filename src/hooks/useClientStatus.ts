
import { useState, useCallback, useRef } from 'react';

interface ClientStatus {
  isMonitoring: boolean;
  clientId: string | null;
  status: string | null;
}

export const useClientStatus = () => {
  const [status, setStatus] = useState<ClientStatus>({
    isMonitoring: false,
    clientId: null,
    status: null
  });
  
  const monitoringRef = useRef<NodeJS.Timeout | null>(null);

  const startMonitoring = useCallback(() => {
    const clientId = localStorage.getItem('clientId');
    if (!clientId) return;

    setStatus(prev => ({ ...prev, isMonitoring: true, clientId }));
    console.log('Monitoramento de status iniciado para cliente:', clientId);

    // Simular monitoramento - adapte conforme necessário
    if (monitoringRef.current) {
      clearInterval(monitoringRef.current);
    }

    monitoringRef.current = setInterval(() => {
      console.log('Verificando status do cliente...');
    }, 5000);
  }, []);

  const stopMonitoring = useCallback(() => {
    setStatus(prev => ({ ...prev, isMonitoring: false }));
    
    if (monitoringRef.current) {
      clearInterval(monitoringRef.current);
      monitoringRef.current = null;
    }
    
    console.log('Monitoramento de status parado');
  }, []);

  return {
    ...status,
    startMonitoring,
    stopMonitoring
  };
};
