import { useEffect, useState } from 'react';
import {
  addNetworkStateListener,
  getNetworkStateAsync,
  type NetworkState,
} from 'expo-network';

export type NetworkStatus = 'online' | 'offline' | 'checking';

export const useNetworkStatus = () => {
  const [status, setStatus] = useState<NetworkStatus>('checking');

  useEffect(() => {
    let mounted = true;

    const updateFromState = (networkState: NetworkState | null) => {
      if (!mounted) {
        return;
      }
      setStatus(mapNetworkState(networkState));
    };

    getNetworkStateAsync()
      .then(updateFromState)
      .catch(() => {
        if (mounted) {
          setStatus('offline');
        }
      });

    const subscription = addNetworkStateListener(updateFromState);

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return {
    status,
    isOnline: status === 'online',
    isOffline: status === 'offline',
  };
};

const mapNetworkState = (state: NetworkState | null): NetworkStatus => {
  if (!state) {
    return 'offline';
  }
  if (!state.isConnected) {
    return 'offline';
  }
  if (state.isInternetReachable === false) {
    return 'offline';
  }
  if (state.isInternetReachable === null || state.isInternetReachable === undefined) {
    return 'checking';
  }
  return state.isInternetReachable ? 'online' : 'offline';
};
