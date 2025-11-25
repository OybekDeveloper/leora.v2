import { create } from 'zustand';

const DEFAULT_MESSAGE = 'Syncing performance data';

type LoaderToken = {
  id: number;
  type: 'manual' | 'network';
  message: string;
};

export type LoadingOverlayStore = {
  tokens: LoaderToken[];
  isVisible: boolean;
  message: string;
  show: (message?: string) => number;
  hide: (tokenId?: number) => void;
  startNetworkRequest: (message?: string) => number;
  finishNetworkRequest: (tokenId: number) => void;
  trackPromise: <T>(promise: Promise<T>, message?: string) => Promise<T>;
};

let tokenCounter = 0;

const normalizeMessage = (message?: string) => {
  if (message && message.trim().length > 0) return message;
  return DEFAULT_MESSAGE;
};

const buildStateFromTokens = (
  tokens: LoaderToken[],
): Pick<LoadingOverlayStore, 'tokens' | 'isVisible' | 'message'> => {
  const hasTokens = tokens.length > 0;
  return {
    tokens,
    isVisible: hasTokens,
    message: hasTokens ? tokens[tokens.length - 1].message : DEFAULT_MESSAGE,
  };
};

export const useLoadingOverlayStore = create<LoadingOverlayStore>((set, get) => ({
  tokens: [],
  isVisible: false,
  message: DEFAULT_MESSAGE,
  show: (message) => {
    const token: LoaderToken = {
      id: ++tokenCounter,
      type: 'manual',
      message: normalizeMessage(message),
    };

    set((state) => buildStateFromTokens([...state.tokens, token]));
    return token.id;
  },
  hide: (tokenId) => {
    set((state) => {
      const nextTokens = state.tokens.filter((entry) => {
        if (entry.type === 'network') return true;
        if (!tokenId) return false;
        return entry.id !== tokenId;
      });

      return buildStateFromTokens(nextTokens);
    });
  },
  startNetworkRequest: (message) => {
    const token: LoaderToken = {
      id: ++tokenCounter,
      type: 'network',
      message: normalizeMessage(message),
    };

    set((state) => buildStateFromTokens([...state.tokens, token]));
    return token.id;
  },
  finishNetworkRequest: (tokenId) => {
    set((state) => buildStateFromTokens(state.tokens.filter((entry) => entry.id !== tokenId)));
  },
  trackPromise: async <T,>(promise: Promise<T>, message?: string) => {
    const tokenId = get().show(message);
    try {
      return await promise;
    } finally {
      get().hide(tokenId);
    }
  },
}));

declare global {
  var __LEORA_LOADER_FETCH_PATCHED__: boolean | undefined;
}

const patchFetchWithLoader = () => {
  if (
    typeof globalThis === 'undefined' ||
    typeof globalThis.fetch !== 'function' ||
    globalThis.__LEORA_LOADER_FETCH_PATCHED__
  ) {
    return;
  }

  const originalFetch = globalThis.fetch.bind(globalThis);

  (globalThis as any).fetch = async (...args: Parameters<typeof fetch>) => {
    const tokenId = useLoadingOverlayStore.getState().startNetworkRequest();
    try {
      return await originalFetch(...args);
    } finally {
      useLoadingOverlayStore.getState().finishNetworkRequest(tokenId);
    }
  };

  globalThis.__LEORA_LOADER_FETCH_PATCHED__ = true;
};

patchFetchWithLoader();
