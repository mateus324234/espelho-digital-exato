
declare global {
  interface Window {
    handleInvalidSms?: () => void;
    handleInvalidToken?: () => void;
  }
}

export {};
