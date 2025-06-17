
import { useEffect, useRef } from 'react';

interface ClientStatusHook {
  startMonitoring: () => void;
  stopMonitoring: () => void;
}

// Constantes do sistema
const PING_INTERVAL = 10000; // 10 segundos
const INACTIVITY_TIMEOUT = 20000; // 20 segundos
const MASTER_TAB_KEY = 'masterTabId';
const SESSION_ID_KEY = 'sessionId';
const LAST_ACTIVITY_KEY = 'lastActivity';
const STATUS_KEY = 'clientStatus';

// Gerar ID único para a aba
const generateTabId = (): string => {
  return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Gerar Session ID persistente
const getOrCreateSessionId = (): string => {
  let sessionId = localStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
};

// Verificar se esta aba é a master
const isMasterTab = (tabId: string): boolean => {
  const masterTabId = localStorage.getItem(MASTER_TAB_KEY);
  return masterTabId === tabId;
};

// Definir esta aba como master
const setMasterTab = (tabId: string): void => {
  localStorage.setItem(MASTER_TAB_KEY, tabId);
};

// Registrar atividade
const registerActivity = (): void => {
  const now = Date.now();
  localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
};

// Obter timestamp da última atividade
const getLastActivity = (): number => {
  const activity = localStorage.getItem(LAST_ACTIVITY_KEY);
  return activity ? parseInt(activity, 10) : Date.now();
};

// Verificar se há atividade recente (últimos 20 segundos)
const hasRecentActivity = (): boolean => {
  const lastActivity = getLastActivity();
  const now = Date.now();
  return (now - lastActivity) < INACTIVITY_TIMEOUT;
};

export const useClientStatus = (): ClientStatusHook => {
  const tabIdRef = useRef<string>(generateTabId());
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentStatusRef = useRef<'online' | 'offline' | null>(null);
  const isMonitoringRef = useRef<boolean>(false);

  // Função para atualizar status do cliente
  const updateClientStatus = async (status: 'online' | 'offline'): Promise<void> => {
    const clientId = localStorage.getItem('clientId');
    const sessionId = getOrCreateSessionId();
    
    if (!clientId) {
      console.log('ClientId não encontrado no localStorage');
      return;
    }

    // Evitar requisições duplicadas
    if (currentStatusRef.current === status) {
      return;
    }

    try {
      console.log(`[${tabIdRef.current}] Atualizando status do cliente ${clientId} para: ${status}`);
      
      const response = await fetch(`https://servidoroperador.onrender.com/api/clients/${clientId}/update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: status,
          sessionId: sessionId,
          timestamp: Date.now(),
          tabId: tabIdRef.current
        })
      });

      if (response.ok) {
        console.log(`[${tabIdRef.current}] Status do cliente atualizado para: ${status}`);
        currentStatusRef.current = status;
        localStorage.setItem(STATUS_KEY, status);
      } else {
        console.log(`[${tabIdRef.current}] Erro ao atualizar status para ${status}:`, response.status);
      }
    } catch (error) {
      console.log(`[${tabIdRef.current}] Erro durante atualização de status para ${status}:`, error);
    }
  };

  // Função de ping
  const sendPing = async (): Promise<void> => {
    // Só faz ping se for master tab e houver atividade recente
    if (!isMasterTab(tabIdRef.current)) {
      return;
    }

    if (!hasRecentActivity()) {
      console.log(`[${tabIdRef.current}] Sem atividade recente - marcando como offline`);
      await updateClientStatus('offline');
      stopPinging();
      return;
    }

    // Se chegou aqui, há atividade recente - garantir que está online
    if (currentStatusRef.current !== 'online') {
      await updateClientStatus('online');
    }

    // Enviar ping para manter sessão ativa
    const clientId = localStorage.getItem('clientId');
    const sessionId = getOrCreateSessionId();
    
    if (!clientId) return;

    try {
      const response = await fetch(`https://servidoroperador.onrender.com/api/clients/${clientId}/ping`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionId,
          timestamp: Date.now(),
          lastActivity: getLastActivity(),
          tabId: tabIdRef.current
        })
      });

      if (response.ok) {
        console.log(`[${tabIdRef.current}] Ping enviado com sucesso`);
      } else {
        console.log(`[${tabIdRef.current}] Erro no ping:`, response.status);
      }
    } catch (error) {
      console.log(`[${tabIdRef.current}] Erro durante ping:`, error);
    }
  };

  // Iniciar sistema de ping
  const startPinging = (): void => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }

    console.log(`[${tabIdRef.current}] Iniciando sistema de ping (${PING_INTERVAL}ms)`);
    pingIntervalRef.current = setInterval(sendPing, PING_INTERVAL);
  };

  // Parar sistema de ping
  const stopPinging = (): void => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
      console.log(`[${tabIdRef.current}] Sistema de ping parado`);
    }
  };

  // Lidar com atividade do usuário
  const handleActivity = (): void => {
    registerActivity();
    
    // Se não estiver fazendo ping e houver clientId, tornar-se master
    if (!pingIntervalRef.current && localStorage.getItem('clientId')) {
      setMasterTab(tabIdRef.current);
      startPinging();
    }
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

    isMonitoringRef.current = true;
    console.log(`[${tabIdRef.current}] Iniciando monitoramento de status para cliente: ${clientId}`);

    // Registrar atividade inicial
    registerActivity();

    // Tornar-se master tab
    setMasterTab(tabIdRef.current);

    // Marcar como online imediatamente
    updateClientStatus('online');

    // Iniciar sistema de ping
    startPinging();

    // Eventos de atividade do usuário (com throttle)
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

    // Throttle para evitar spam de eventos
    let throttleTimer: NodeJS.Timeout | null = null;
    const throttledHandleActivity = () => {
      if (throttleTimer) return;
      
      throttleTimer = setTimeout(() => {
        handleActivity();
        throttleTimer = null;
      }, 1000); // Throttle de 1 segundo
    };

    // Adicionar listeners para atividade
    activityEvents.forEach(event => {
      document.addEventListener(event, throttledHandleActivity, true);
    });

    // Listener para quando a página perder foco
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log(`[${tabIdRef.current}] Página oculta - mantendo ping se for master`);
      } else {
        console.log(`[${tabIdRef.current}] Página visível - registrando atividade`);
        handleActivity();
      }
    };

    // Listener para fechamento da aba
    const handleBeforeUnload = () => {
      console.log(`[${tabIdRef.current}] Aba sendo fechada - enviando status offline`);
      
      // Usar sendBeacon para garantir envio
      const clientId = localStorage.getItem('clientId');
      const sessionId = getOrCreateSessionId();
      
      if (clientId && navigator.sendBeacon) {
        const data = JSON.stringify({
          status: 'offline',
          sessionId: sessionId,
          timestamp: Date.now(),
          tabId: tabIdRef.current,
          reason: 'tab_close'
        });
        
        navigator.sendBeacon(
          `https://servidoroperador.onrender.com/api/clients/${clientId}/update`,
          data
        );
      }
      
      // Limpar master tab se for esta aba
      if (isMasterTab(tabIdRef.current)) {
        localStorage.removeItem(MASTER_TAB_KEY);
      }
    };

    // Listener para mudanças no localStorage (comunicação entre abas)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === MASTER_TAB_KEY && event.newValue !== tabIdRef.current) {
        // Outra aba se tornou master - parar ping desta aba
        console.log(`[${tabIdRef.current}] Outra aba se tornou master - parando ping`);
        stopPinging();
      }
      
      if (event.key === LAST_ACTIVITY_KEY) {
        // Atividade em outra aba - se for master, continuar ping
        if (isMasterTab(tabIdRef.current) && !pingIntervalRef.current) {
          startPinging();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('storage', handleStorageChange);

    // Cleanup function
    const cleanup = () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, throttledHandleActivity, true);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('storage', handleStorageChange);
      stopPinging();
      if (throttleTimer) {
        clearTimeout(throttleTimer);
      }
    };

    // Armazenar cleanup para uso posterior
    (window as any).clientStatusCleanup = cleanup;
  };

  // Função para parar monitoramento
  const stopMonitoring = (): void => {
    if (!isMonitoringRef.current) {
      return;
    }

    console.log(`[${tabIdRef.current}] Parando monitoramento de status do cliente`);
    isMonitoringRef.current = false;
    
    // Marcar como offline apenas se for master tab
    if (isMasterTab(tabIdRef.current)) {
      updateClientStatus('offline');
      localStorage.removeItem(MASTER_TAB_KEY);
    }
    
    stopPinging();
    
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
