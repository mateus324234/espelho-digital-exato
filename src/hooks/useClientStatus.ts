
import { useEffect, useRef } from 'react';

interface ClientStatusHook {
  startMonitoring: () => void;
  stopMonitoring: () => void;
}

export const useClientStatus = (): ClientStatusHook => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const throttleRef = useRef<NodeJS.Timeout | null>(null);
  const isOnlineRef = useRef<boolean>(false);
  const clientIdRef = useRef<string | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const pendingStatusRef = useRef<'online' | 'offline' | null>(null);

  // Função para atualizar status do cliente
  const updateClientStatus = async (status: 'online' | 'offline'): Promise<void> => {
    const clientId = localStorage.getItem('clientId');
    
    if (!clientId) {
      console.log('ClientId não encontrado no localStorage');
      return;
    }

    // Verificar se realmente precisa atualizar (evitar updates desnecessários)
    if (isOnlineRef.current === (status === 'online')) {
      console.log(`Status já é ${status}, não enviando update desnecessário`);
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
        lastUpdateRef.current = Date.now();
      } else {
        console.log(`Erro ao atualizar status para ${status}:`, response.status);
      }
    } catch (error) {
      console.log(`Erro durante atualização de status para ${status}:`, error);
    }
  };

  // Função throttled para enviar updates (máximo 1 por 10 segundos)
  const throttledUpdate = (status: 'online' | 'offline'): void => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;
    
    // Se já enviou um update há menos de 10 segundos, armazenar para enviar depois
    if (timeSinceLastUpdate < 10000) {
      pendingStatusRef.current = status;
      
      // Limpar throttle anterior se existir
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }
      
      // Configurar novo throttle para enviar o update pendente
      const remainingTime = 10000 - timeSinceLastUpdate;
      throttleRef.current = setTimeout(() => {
        if (pendingStatusRef.current) {
          updateClientStatus(pendingStatusRef.current);
          pendingStatusRef.current = null;
        }
      }, remainingTime);
      
      console.log(`Update throttled - aguardando ${Math.ceil(remainingTime/1000)}s para próximo update`);
      return;
    }
    
    // Pode enviar imediatamente
    updateClientStatus(status);
  };

  // Função para resetar o timer de inatividade
  const resetInactivityTimer = (): void => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Configurar timer de 20 segundos para inatividade
    timeoutRef.current = setTimeout(() => {
      if (isOnlineRef.current) {
        throttledUpdate('offline');
      }
    }, 20000); // 20 segundos
  };

  // Função para marcar como online (com throttling)
  const setOnline = (): void => {
    // Só enviar update se realmente mudou o status
    if (!isOnlineRef.current) {
      throttledUpdate('online');
    }
    resetInactivityTimer();
  };

  // Função para marcar como offline (imediato, sem throttling)
  const setOffline = (): void => {
    if (isOnlineRef.current) {
      // Offline é crítico, enviar imediatamente
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

    // Marcar como online imediatamente (primeira vez, sem throttle)
    updateClientStatus('online');

    // Eventos de atividade do usuário (debounced)
    let activityTimeout: NodeJS.Timeout | null = null;
    
    const debouncedActivity = () => {
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }
      
      // Debounce de 2 segundos para atividade
      activityTimeout = setTimeout(() => {
        setOnline();
      }, 2000);
    };

    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Adicionar listeners para atividade (debounced)
    activityEvents.forEach(event => {
      document.addEventListener(event, debouncedActivity, true);
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
        document.removeEventListener(event, debouncedActivity, true);
      });
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (throttleRef.current) {
        clearTimeout(throttleRef.current);
      }
      if (activityTimeout) {
        clearTimeout(activityTimeout);
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
