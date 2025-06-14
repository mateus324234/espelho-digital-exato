
import React, { useState } from "react";
import { Check, X, ArrowLeft } from "lucide-react";

const keyboardLayout = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "backspace"],
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["shift", "a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m", "enter", "cancel"],
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
    <div className="mt-2 p-4 bg-[#f7f7f7] rounded-xl border border-orange-100 shadow max-w-lg mx-auto z-20">
      <div className="mb-3">
        <input
          disabled
          className="w-full h-11 bg-white border-2 border-orange-200 rounded text-center text-xl font-bold"
          value={value.replace(/./g, "•")}
          style={{ letterSpacing: "8px" }}
          readOnly
        />
      </div>
      <div className="flex flex-col items-center select-none">
        {keyboardLayout.map((row, rowIdx) => (
          <div key={rowIdx} className="flex flex-row justify-center mb-1">
            {row.map((key) => renderButton(key))}
          </div>
        ))}
      </div>
    </div>
  );
};

