// Filet de sécurité si lib.dom ne fournit pas encore l'API Wake Lock.
interface WakeLockSentinel {
  released: boolean;
  type: "screen";
  release(): Promise<void>;
  addEventListener(type: "release", listener: () => void): void;
}

interface Navigator {
  wakeLock?: {
    request(type: "screen"): Promise<WakeLockSentinel>;
  };
}
