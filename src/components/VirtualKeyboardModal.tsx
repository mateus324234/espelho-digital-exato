
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
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
    let className =
      "flex justify-center items-center h-9 w-9 rounded-md text-base font-medium mx-0.5 my-0.5 shadow-sm bg-white border border-gray-300 hover:bg-gray-50 active:bg-gray-200 transition";
    let children: React.ReactNode = key;

    if (key === "backspace") {
      className = "flex justify-center items-center h-9 w-9 rounded-md bg-gray-400 text-white";
      children = <ArrowLeft size={20} />;
    }
    if (key === "shift") {
      className = `flex justify-center items-center h-9 w-9 rounded-md ${
        shift ? "bg-green-600 text-white" : "bg-gray-400 text-white"
      }`;
      children = "↑";
    }
    if (key === "enter") {
      className = "flex justify-center items-center h-9 w-9 rounded-md bg-green-600 text-white";
      children = <Check size={20} />;
    }
    if (key === "cancel") {
      className = "flex justify-center items-center h-9 w-9 rounded-md bg-red-600 text-white";
      children = <X size={20} />;
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
      <DialogContent className="max-w-md p-6 rounded-lg" hideClose>
        <DialogHeader>
          <DialogTitle>Digite sua senha</DialogTitle>
        </DialogHeader>
        {/* Input box */}
        <div className="mb-4">
          <input
            disabled
            className="w-full h-12 bg-white border-2 border-orange-200 rounded text-center text-xl font-bold"
            value={inputValue.replace(/./g, "•")}
            style={{ letterSpacing: "8px" }}
            readOnly
          />
        </div>
        {/* Keyboard */}
        <div className="flex flex-col items-center select-none">
          {keyboardLayout.map((row, rowIdx) => (
            <div key={rowIdx} className="flex flex-row justify-center mb-1">
              {row.map((key) => renderButton(key))}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
