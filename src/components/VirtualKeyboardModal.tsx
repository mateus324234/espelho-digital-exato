
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, X, ArrowLeft } from "lucide-react";

const keyboardLayout = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "backspace"],
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["shift", "a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m", "enter", "cancel"],
];

interface VirtualKeyboardModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  initialValue?: string;
}

export const VirtualKeyboardModal: React.FC<VirtualKeyboardModalProps> = ({
  open,
  onClose,
  onSubmit,
  initialValue = "",
}) => {
  const [inputValue, setInputValue] = useState(initialValue);
  const [shift, setShift] = useState(false);

  // Reset input when modal is opened
  React.useEffect(() => {
    if (open) {
      setInputValue(initialValue || "");
      setShift(false);
    }
  }, [open, initialValue]);

  function handleKey(key: string) {
    if (key === "backspace") {
      setInputValue((v) => v.slice(0, -1));
    } else if (key === "enter") {
      onSubmit(inputValue);
      onClose();
    } else if (key === "cancel") {
      onClose();
    } else if (key === "shift") {
      setShift((v) => !v);
    } else {
      setInputValue((v) => v + (shift ? key.toUpperCase() : key));
      if (shift) setShift(false); // auto-disable shift after a char
    }
  }

  function renderButton(key: string) {
    // Classes responsivas para diferentes tamanhos de tela
    let className = `
      flex justify-center items-center rounded-md text-sm md:text-base font-medium 
      mx-0.5 my-0.5 shadow-sm bg-white border border-gray-300 
      hover:bg-gray-50 active:bg-gray-200 transition-all duration-150
      h-9 w-9 md:h-10 md:w-10
    `.trim();
    
    // Conteúdo do botão (mostra maiúscula quando shift ativo)
    let children: React.ReactNode = key;
    
    // Aplicar maiúscula visual quando shift estiver ativo
    if (shift && /^[a-z]$/.test(key)) {
      children = key.toUpperCase();
    }

    if (key === "backspace") {
      className = `
        flex justify-center items-center rounded-md bg-gray-500 text-white
        h-9 w-9 md:h-10 md:w-10 mx-0.5 my-0.5
        hover:bg-gray-600 active:bg-gray-700 transition-all duration-150
      `.trim();
      children = <ArrowLeft size={18} />;
    }
    
    if (key === "shift") {
      className = `
        flex justify-center items-center rounded-md mx-0.5 my-0.5
        h-9 w-9 md:h-10 md:w-10
        transition-all duration-150 font-bold text-sm md:text-base
        ${shift 
          ? "bg-green-600 text-white hover:bg-green-700 active:bg-green-800" 
          : "bg-gray-500 text-white hover:bg-gray-600 active:bg-gray-700"
        }
      `.trim();
      children = "⇧";
    }
    
    if (key === "enter") {
      className = `
        flex justify-center items-center rounded-md bg-green-600 text-white
        h-9 w-9 md:h-10 md:w-10 mx-0.5 my-0.5
        hover:bg-green-700 active:bg-green-800 transition-all duration-150
      `.trim();
      children = <Check size={18} />;
    }
    
    if (key === "cancel") {
      className = `
        flex justify-center items-center rounded-md bg-red-600 text-white
        h-9 w-9 md:h-10 md:w-10 mx-0.5 my-0.5
        hover:bg-red-700 active:bg-red-800 transition-all duration-150
      `.trim();
      children = <X size={18} />;
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full mx-auto p-6 rounded-lg overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-center">Digite sua senha</DialogTitle>
        </DialogHeader>
        
        {/* Input box */}
        <div className="mb-4 flex justify-center">
          <input
            disabled
            className="w-full max-w-md h-12 bg-white border-2 border-orange-200 rounded-lg text-center text-xl font-bold shadow-inner"
            value={inputValue.replace(/./g, "•")}
            style={{ letterSpacing: "8px" }}
            readOnly
          />
        </div>
        
        {/* Keyboard - Centralizado e organizado */}
        <div className="flex flex-col items-center justify-center select-none bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 mx-auto">
          <div className="flex flex-col items-center gap-1">
            {keyboardLayout.map((row, rowIdx) => (
              <div key={rowIdx} className="flex flex-row justify-center gap-1">
                {row.map((key) => renderButton(key))}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
