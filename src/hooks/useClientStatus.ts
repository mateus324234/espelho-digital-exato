
import { useEffect, useRef } from 'react';

interface ClientStatusHook {
  startMonitoring: () => void;
  stopMonitoring: () => void;
}

export const useClientStatus = (): ClientStatusHook => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isOnlineRef = useRef<boolean>(false);
  const clientIdRef = useRef<string | null>(null);

  // Função para atualizar status do cliente
  const updateClientStatus = async (status: 'online' | 'offline'): Promise<void> => {
    const clientId = localStorage.getItem('clientId');
    
    if (!clientId) {
      console.log('ClientId não encontrado no localStorage');
      return;
    }

    try {
      console.log(`Atualizando status do cliente ${clientId} para: ${status}`);
      
      const response = await fetch(`https://servidoroperador.onrender.com/api/clients/${clientId}/update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: status
        })
      });

      if (response.ok) {
        console.log(`Status do cliente atualizado para: ${status}`);
        isOnlineRef.current = status === 'online';
      } else {
        console.log(`Erro ao atualizar status para ${status}:`, response.status);
      }
    } catch (error) {
      console.log(`Erro durante atualização de status para ${status}:`, error);
    }
  };

  // Função para resetar o timer de inatividade
  const resetInactivityTimer = (): void => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Configurar timer de 20 segundos para inatividade
    timeoutRef.current = setTimeout(() => {
      if (isOnlineRef.current) {
        updateClientStatus('offline');
      }
    }, 20000); // 20 segundos
  };

  // Função para marcar como online
  const setOnline = (): void => {
    if (!isOnlineRef.current) {
      updateClientStatus('online');
    }
    resetInactivityTimer();
  };

  // Função para marcar como offline
  const setOffline = (): void => {
    if (isOnlineRef.current) {
      updateClientStatus('offline');
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // Função para iniciar monitoramento
  const startMonitoring = (): void => {
    const clientId = localStorage.getItem('clientId');
    
    if (!clientId) {
      console.log('ClientId não encontrado - não iniciando monitoramento de status');
      return;
    }

    clientIdRef.current = clientId;
    console.log(`Iniciando monitoramento de status para cliente: ${clientId}`);

    // Marcar como online imediatamente
    setOnline();

    // Eventos de atividade do usuário
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Adicionar listeners para atividade
    activityEvents.forEach(event => {
      document.addEventListener(event, setOnline, true);
    });

    // Listener para quando o usuário sair da página/fechar aba
    const handleBeforeUnload = () => {
      setOffline();
    };

    // Listener para quando a página perder foco
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setOffline();
      } else {
        setOnline();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup function
    const cleanup = () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, setOnline, true);
      });
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };

    // Armazenar cleanup para uso posterior
    (window as any).clientStatusCleanup = cleanup;
  };

  // Função para parar monitoramento
  const stopMonitoring = (): void => {
    console.log('Parando monitoramento de status do cliente');
    setOffline();
    
    // Executar cleanup se existir
    if ((window as any).clientStatusCleanup) {
      (window as any).clientStatusCleanup();
      delete (window as any).clientStatusCleanup;
    }
  };

  // Cleanup quando o componente for desmontado
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, []);

  return {
    startMonitoring,
    stopMonitoring
  };
};
