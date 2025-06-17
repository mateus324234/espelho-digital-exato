
import { useEffect, useRef } from 'react';

interface ClientStatusHook {
  startMonitoring: () => void;
  stopMonitoring: () => void;
}

// Gerar session ID único e persistente
const getOrCreateSessionId = (): string => {
  let sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('sessionId', sessionId);
    console.log('Novo sessionId criado:', sessionId);
  }
  return sessionId;
};

// Gerenciar timestamp da última atividade globalmente
const setLastActivity = (): void => {
  const now = Date.now();
  localStorage.setItem('lastActivity', now.toString());
  localStorage.setItem('lastActivityTab', window.location.href);
};

const getLastActivity = (): number => {
  const lastActivity = localStorage.getItem('lastActivity');
  return lastActivity ? parseInt(lastActivity, 10) : Date.now();
};

// Sistema de coordenação entre abas (aba master)
const setMasterTab = (): void => {
  const tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  localStorage.setItem('masterTab', tabId);
  localStorage.setItem('masterTabTime', Date.now().toString());
  (window as any).currentTabId = tabId;
};

const isMasterTab = (): boolean => {
  const currentTabId = (window as any).currentTabId;
  const masterTab = localStorage.getItem('masterTab');
  const masterTabTime = localStorage.getItem('masterTabTime');
  
  // Se não há master tab ou é muito antigo (30 segundos), torna-se master
  if (!masterTab || !masterTabTime || Date.now() - parseInt(masterTabTime, 10) > 30000) {
    setMasterTab();
    return true;
  }
  
  return currentTabId === masterTab;
};

export const useClientStatus = (): ClientStatusHook => {
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityCheckRef = useRef<NodeJS.Timeout | null>(null);
  const isOnlineRef = useRef<boolean>(false);
  const clientIdRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const isMonitoringRef = useRef<boolean>(false);

  // Função para enviar status atualizado
  const updateClientStatus = async (status: 'online' | 'offline', useBeacon = false): Promise<void> => {
    const clientId = clientIdRef.current;
    const sessionId = sessionIdRef.current;
    
    if (!clientId || !sessionId) {
      console.log('ClientId ou SessionId não encontrado para atualização de status');
      return;
    }

    const statusData = {
      status: status,
      sessionId: sessionId,
      timestamp: Date.now(),
      lastActivity: getLastActivity()
    };

    console.log(`${useBeacon ? '[BEACON]' : '[FETCH]'} Atualizando status ${clientId} para: ${status}`);

    try {
      if (useBeacon && navigator.sendBeacon) {
        // Usar sendBeacon para fechamento de aba
        const blob = new Blob([JSON.stringify(statusData)], { type: 'application/json' });
        const success = navigator.sendBeacon(
          `https://servidoroperador.onrender.com/api/clients/${clientId}/update`,
          blob
        );
        console.log(`Beacon enviado: ${success ? 'sucesso' : 'falha'}`);
        return;
      }

      // Usar fetch normal
      const response = await fetch(`https://servidoroperador.onrender.com/api/clients/${clientId}/update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(statusData)
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

  // Sistema de ping a cada 10 segundos
  const startPingSystem = (): void => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }

    pingIntervalRef.current = setInterval(() => {
      // Só pinga se for a aba master
      if (!isMasterTab()) {
        console.log('Não é aba master - pulando ping');
        return;
      }

      const lastActivity = getLastActivity();
      const now = Date.now();
      const timeSinceActivity = now - lastActivity;

      console.log(`Verificando atividade: ${timeSinceActivity}ms desde última atividade`);

      // Se passou mais de 20 segundos sem atividade, marcar offline
      if (timeSinceActivity > 20000) {
        if (isOnlineRef.current) {
          console.log('20 segundos de inatividade detectados - marcando offline');
          updateClientStatus('offline');
          stopPingSystem();
        }
        return;
      }

      // Se há atividade recente e não está online, marcar online
      if (timeSinceActivity <= 20000) {
        if (!isOnlineRef.current) {
          console.log('Atividade detectada - marcando online');
          updateClientStatus('online');
        } else {
          console.log('Ping de manutenção - mantendo online');
          updateClientStatus('online');
        }
      }
    }, 10000); // 10 segundos

    console.log('Sistema de ping iniciado (10 segundos)');
  };

  const stopPingSystem = (): void => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
      console.log('Sistema de ping parado');
    }
  };

  // Detectar atividade do usuário
  const handleActivity = (): void => {
    if (!isMonitoringRef.current) return;

    console.log('Atividade detectada');
    setLastActivity();
    setMasterTab(); // Torna-se aba master na atividade

    // Se não estava online, marcar como online e reiniciar ping
    if (!isOnlineRef.current) {
      console.log('Reativando status online devido à atividade');
      updateClientStatus('online');
      startPingSystem();
    }
  };

  // Configurar listeners de atividade
  const setupActivityListeners = (): (() => void) => {
    const activityEvents = [
      'mousedown',
      'mousemove', 
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'keydown',
      'input'
    ];

    // Throttle para evitar excesso de calls
    let throttleTimeout: NodeJS.Timeout | null = null;
    const throttledActivity = () => {
      if (throttleTimeout) return;
      throttleTimeout = setTimeout(() => {
        handleActivity();
        throttleTimeout = null;
      }, 1000); // Max 1 call por segundo
    };

    // Adicionar listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, throttledActivity, true);
    });

    // Listener para fechamento de aba
    const handleBeforeUnload = () => {
      console.log('Detectado fechamento de aba - enviando offline via beacon');
      updateClientStatus('offline', true);
    };

    // Listener para mudança de visibilidade
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('Aba oculta - reduzindo atividade');
        // Não marcar offline imediatamente, apenas reduzir atividade
      } else {
        console.log('Aba visível - retomando atividade');
        handleActivity();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Função de cleanup
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, throttledActivity, true);
      });
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
    };
  };

  // Função para iniciar monitoramento
  const startMonitoring = (): void => {
    const clientId = localStorage.getItem('clientId');
    
    if (!clientId) {
      console.log('ClientId não encontrado - não iniciando monitoramento de status');
      return;
    }

    if (isMonitoringRef.current) {
      console.log('Monitoramento já ativo');
      return;
    }

    clientIdRef.current = clientId;
    sessionIdRef.current = getOrCreateSessionId();
    isMonitoringRef.current = true;

    console.log(`Iniciando monitoramento avançado para cliente: ${clientId}`);
    console.log(`SessionId: ${sessionIdRef.current}`);

    // Marcar atividade inicial e definir como aba master
    setLastActivity();
    setMasterTab();

    // Marcar como online imediatamente
    updateClientStatus('online');

    // Configurar listeners de atividade
    const cleanup = setupActivityListeners();

    // Iniciar sistema de ping
    startPingSystem();

    // Armazenar cleanup
    (window as any).clientStatusCleanup = cleanup;
  };

  // Função para parar monitoramento
  const stopMonitoring = (): void => {
    if (!isMonitoringRef.current) {
      return;
    }

    console.log('Parando monitoramento de status do cliente');
    isMonitoringRef.current = false;
    
    // Marcar como offline
    if (isOnlineRef.current) {
      updateClientStatus('offline', true);
    }

    // Parar sistemas
    stopPingSystem();
    
    // Executar cleanup se existir
    if ((window as any).clientStatusCleanup) {
      (window as any).clientStatusCleanup();
      delete (window as any).clientStatusCleanup;
    }

    // Limpar refs
    clientIdRef.current = null;
    sessionIdRef.current = null;
    isOnlineRef.current = false;
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
