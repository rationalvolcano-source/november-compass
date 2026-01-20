// Type declarations for Puter.js SDK
// https://developer.puter.com/

interface PuterAI {
  chat: (
    prompt: string,
    options?: {
      model?: string;
      stream?: boolean;
    }
  ) => Promise<string | { text: string }>;
}

interface Puter {
  ai: PuterAI;
  print: (message: string) => void;
}

declare global {
  interface Window {
    puter?: Puter;
  }
}

export {};
