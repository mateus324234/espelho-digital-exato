
import { useEffect, useRef } from 'react';

interface ClientStatusHook {
  startMonitoring: () => void;
  stopMonitoring: () => void;
}

export const useClientStatus = (): ClientStatusHook => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isOnlineRef = useRef<boolean>(false);
  const clientIdRef = useRef<string | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

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

  // Função para enviar status offline usando sendBeacon (mais confiável ao fechar aba)
  const sendOfflineBeacon = (): void => {
    const clientId = localStorage.getItem('clientId');
    
    if (!clientId) return;

    const data = JSON.stringify({ status: 'offline' });
    const url = `https://servidoroperador.onrender.com/api/clients/${clientId}/update`;

    if (navigator.sendBeacon) {
      const blob = new Blob([data], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
      console.log('Status offline enviado via sendBeacon');
    } else {
      // Fallback para navegadores que não suportam sendBeacon
      updateClientStatus('offline');
    }
  };

  // Função para verificar inatividade e enviar ping
  const checkActivityAndPing = (): void => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;
    
    // Se passou mais de 20 segundos sem atividade, marcar como offline
    if (timeSinceLastActivity > 20000) {
      if (isOnlineRef.current) {
        console.log('20 segundos de inatividade detectados - marcando como offline');
        updateClientStatus('offline');
      }
    } else {
      // Se há atividade recente e não está online, marcar como online
      if (!isOnlineRef.current) {
        console.log('Atividade detectada - marcando como online');
        updateClientStatus('online');
      } else {
        // Se já está online e há atividade, enviar ping para manter conexão
        console.log('Enviando ping para manter status online');
        updateClientStatus('online');
      }
    }
  };

  // Função para registrar atividade do usuário
  const registerActivity = (): void => {
    lastActivityRef.current = Date.now();
    console.log('Atividade do usuário registrada');
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

    // Marcar como online imediatamente e registrar atividade
    lastActivityRef.current = Date.now();
    updateClientStatus('online');

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
      document.addEventListener(event, registerActivity, true);
    });

    // Iniciar ping a cada 3 segundos
    pingIntervalRef.current = setInterval(checkActivityAndPing, 3000);
    console.log('Ping de verificação iniciado (3 segundos)');

    // Listener para quando o usuário sair da página/fechar aba
    const handleBeforeUnload = () => {
      console.log('Detectado fechamento de aba - enviando status offline');
      sendOfflineBeacon();
    };

    // Listener para quando a página perder foco (aba oculta)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('Página oculta - parando ping');
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
      } else {
        console.log('Página visível - reiniciando ping');
        lastActivityRef.current = Date.now();
        updateClientStatus('online');
        if (!pingIntervalRef.current) {
          pingIntervalRef.current = setInterval(checkActivityAndPing, 3000);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup function
    const cleanup = () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, registerActivity, true);
      });
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
    };

    // Armazenar cleanup para uso posterior
    (window as any).clientStatusCleanup = cleanup;
  };

  // Função para parar monitoramento
  const stopMonitoring = (): void => {
    console.log('Parando monitoramento de status do cliente');
    
    // Enviar status offline antes de parar
    if (isOnlineRef.current) {
      sendOfflineBeacon();
    }
    
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
