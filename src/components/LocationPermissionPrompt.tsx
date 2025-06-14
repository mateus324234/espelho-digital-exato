
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
    <div className="fixed top-5 left-1/2 z-50 -translate-x-1/2 shadow-xl bg-white rounded-xl border border-gray-200 px-6 py-4 min-w-[340px] max-w-[94vw]">
      <div className="font-bold mb-1 text-gray-800">internetbanking.confesol.com.br</div>
      <div className="mb-4 text-gray-900">quer</div>
      <div className="flex items-center mb-4 text-gray-800 text-sm">
        <MapPin className="mr-1" size={18} />
        <span>Saber sua localização</span>
      </div>
      <div className="space-y-2">
        <button
          className="w-full rounded-full py-2 bg-blue-100 hover:bg-blue-200 text-blue-900 font-medium transition"
          onClick={onAccept}
        >
          Permitir ao acessar o site
        </button>
        <button
          className="w-full rounded-full py-2 bg-blue-100 hover:bg-blue-200 text-blue-900 font-medium transition"
          onClick={onAllowOnce}
        >
          Permitir desta vez
        </button>
        <button
          className="w-full rounded-full py-2 bg-blue-100 hover:bg-blue-200 text-blue-900 font-medium transition"
          onClick={onNeverAllow}
        >
          Nunca permitir
        </button>
      </div>
    </div>
  );
};
