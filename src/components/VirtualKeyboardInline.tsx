
import React, { useState } from "react";
import { Check, X, ArrowLeft } from "lucide-react";

const keyboardLayout = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "backspace"],
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["shift", "z", "x", "c", "v", "b", "n", "m", "enter", "cancel"],
];

interface VirtualKeyboardInlineProps {
  open: boolean;
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

export const VirtualKeyboardInline: React.FC<VirtualKeyboardInlineProps> = ({
  open,
  value,
  onChange,
  onSubmit,
  onCancel
}) => {
  const [shift, setShift] = useState(false);

  React.useEffect(() => {
    if (open) setShift(false);
  }, [open]);

  if (!open) return null;

  function handleKey(key: string) {
    if (key === "backspace") {
      onChange(value.slice(0, -1));
    } else if (key === "enter") {
      onSubmit(value);
    } else if (key === "cancel") {
      onCancel();
    } else if (key === "shift") {
      setShift((v) => !v);
    } else {
      onChange(value + (shift ? key.toUpperCase() : key));
      if (shift) setShift(false);
    }
  }

  function renderButton(key: string) {
    // Classes responsivas para diferentes tamanhos de tela
    let className = `
      flex justify-center items-center rounded-lg text-sm md:text-base font-medium 
      mx-1 my-1 shadow-sm bg-white border border-gray-300 
      hover:bg-gray-50 active:bg-gray-200 transition-all duration-150
      h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10
    `.trim();
    
    // Conteúdo do botão
    let children: React.ReactNode = key;
    
    // Aplicar maiúscula visual quando shift estiver ativo
    if (shift && /^[a-z]$/.test(key)) {
      children = key.toUpperCase();
    }

    if (key === "backspace") {
      className = `
        flex justify-center items-center rounded-lg bg-gray-600 text-white
        h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 mx-1 my-1 shadow-sm
        hover:bg-gray-700 active:bg-gray-800 transition-all duration-150
      `.trim();
      children = <ArrowLeft size={16} className="sm:w-5 sm:h-5" />;
    }
    
    if (key === "shift") {
      className = `
        flex justify-center items-center rounded-lg mx-1 my-1 shadow-sm
        h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10
        transition-all duration-150 font-bold text-sm md:text-base
        ${shift 
          ? "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800" 
          : "bg-gray-600 text-white hover:bg-gray-700 active:bg-gray-800"
        }
      `.trim();
      children = "⇧";
    }
    
    if (key === "enter") {
      className = `
        flex justify-center items-center rounded-lg bg-green-600 text-white
        h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 mx-1 my-1 shadow-sm
        hover:bg-green-700 active:bg-green-800 transition-all duration-150
      `.trim();
      children = <Check size={16} className="sm:w-5 sm:h-5" />;
    }
    
    if (key === "cancel") {
      className = `
        flex justify-center items-center rounded-lg bg-red-600 text-white
        h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 mx-1 my-1 shadow-sm
        hover:bg-red-700 active:bg-red-800 transition-all duration-150
      `.trim();
      children = <X size={16} className="sm:w-5 sm:h-5" />;
    }

    return (
      <button
        key={key}
        type="button"
        tabIndex={-1}
        className={className}
        onClick={() => handleKey(key)}
        aria-label={key}
      >
        {children}
      </button>
    );
  }

  return (
    <div className="mt-2 p-2 sm:p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-orange-200 shadow-lg max-w-sm sm:max-w-lg mx-auto z-20">
      <div className="mb-2 sm:mb-3">
        <input
          disabled
          className="w-full h-10 sm:h-11 bg-white border-2 border-orange-200 rounded-lg text-center text-lg sm:text-xl font-bold shadow-inner"
          value={value.replace(/./g, "•")}
          style={{ letterSpacing: "6px" }}
          readOnly
        />
      </div>
      <div className="flex flex-col items-center select-none">
        {keyboardLayout.map((row, rowIdx) => (
          <div key={rowIdx} className="flex flex-row justify-center mb-1 last:mb-0">
            {row.map((key) => renderButton(key))}
          </div>
        ))}
      </div>
    </div>
  );
};
