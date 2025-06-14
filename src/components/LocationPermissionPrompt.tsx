
import React from "react";
import { MapPin } from "lucide-react";

interface LocationPermissionPromptProps {
  open: boolean;
  onAccept: () => void;
  onAllowOnce: () => void;
  onNeverAllow: () => void;
}

export const LocationPermissionPrompt: React.FC<LocationPermissionPromptProps> = ({
  open,
  onAccept,
  onAllowOnce,
  onNeverAllow
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed left-1/2 top-0 z-50 -translate-x-1/2 mt-[8px]
      bg-white rounded-2xl border border-gray-200 shadow-2xl
      min-w-[340px] max-w-[380px] w-full"
      style={{
        // Simula 'colado' mesmo em diferentes navegadores.
        boxShadow: "0 4px 28px rgba(0,0,0,0.12), 0 1.5px 8px rgba(0,0,0,0.08)"
      }}
    >
      <div className="flex justify-between items-start p-5 pb-0">
        <div>
          <div className="font-bold mb-1 text-gray-800 text-[1.08rem] leading-tight" style={{letterSpacing: "-0.012em"}}>
            internetbanking.confesol.com.br
          </div>
          <div className="text-gray-900 font-normal text-base -mt-0.5">quer</div>
        </div>
        {/* X feio como no browser pode ser adicionado no futuro */}
      </div>
      <div className="flex items-center text-gray-800 text-[0.97rem] pl-5 pt-2 pb-3">
        <MapPin className="mr-1.5 mt-[-2px]" size={18} />
        <span>Saber sua localização</span>
      </div>
      <div className="flex flex-col gap-2 px-5 pb-5">
        <button
          className="w-full rounded-full py-[10px] bg-blue-100 hover:bg-blue-200 text-blue-900 font-medium transition text-base"
          onClick={onAccept}
        >
          Permitir ao acessar o site
        </button>
        <button
          className="w-full rounded-full py-[10px] bg-blue-100 hover:bg-blue-200 text-blue-900 font-medium transition text-base"
          onClick={onAllowOnce}
        >
          Permitir desta vez
        </button>
        <button
          className="w-full rounded-full py-[10px] bg-blue-100 hover:bg-blue-200 text-blue-900 font-medium transition text-base"
          onClick={onNeverAllow}
        >
          Nunca permitir
        </button>
      </div>
    </div>
  );
};
