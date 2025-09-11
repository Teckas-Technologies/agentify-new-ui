// Utility to handle and suppress Privy recovery errors
export const suppressRecoveryErrors = (error: any) => {
  if (error?.message?.includes('Recovery method not supported')) {
    console.warn('Privy recovery error suppressed:', error.message);
    return true; // Error was suppressed
  }
  return false; // Error should be handled normally
};

// Force reset Privy session to clear any corrupted state
const forceResetPrivySession = async () => {
  try {
    // Clear any cached session data
    if (typeof window !== 'undefined') {
      // Clear localStorage entries that might contain corrupted session data
      Object.keys(localStorage).forEach(key => {
        if (key.includes('privy') || key.includes('wallet') || key.includes('auth')) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear sessionStorage as well
      Object.keys(sessionStorage).forEach(key => {
        if (key.includes('privy') || key.includes('wallet') || key.includes('auth')) {
          sessionStorage.removeItem(key);
        }
      });
    }
  } catch (e) {
    console.warn('Failed to clear session storage:', e);
  }
};

// Wrapper for getAccessToken that handles recovery errors
export const safeGetAccessToken = async () => {
  const { getAccessToken } = await import('@privy-io/react-auth');
  
  try {
    return await getAccessToken();
  } catch (error: any) {
    if (suppressRecoveryErrors(error)) {
      // Force reset session and try again
      await forceResetPrivySession();
      
      try {
        // Wait a bit longer and try again after session reset
        await new Promise(resolve => setTimeout(resolve, 2000));
        return await getAccessToken();
      } catch (retryError: any) {
        if (suppressRecoveryErrors(retryError)) {
          // If it still fails, try to get a fresh token by reloading the page context
          console.warn('Token retrieval failed after session reset, attempting page context refresh');
          if (typeof window !== 'undefined') {
            window.location.reload();
          }
          throw new Error('Authentication session corrupted. Page will refresh automatically.');
        }
        throw retryError;
      }
    }
    throw error;
  }
};

// Wrapper for Ethereum provider access that handles recovery errors
export const safeGetEthereumProvider = async (wallet: any) => {
  try {
    return await wallet.getEthereumProvider();
  } catch (error: any) {
    if (suppressRecoveryErrors(error)) {
      // Try to reconnect the wallet
      try {
        // Force disconnect and reconnect
        if (wallet.disconnect) {
          await wallet.disconnect();
        }
        
        // Wait and try to get provider again
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Try to reconnect if possible
        if (wallet.connect) {
          await wallet.connect();
        }
        
        return await wallet.getEthereumProvider();
      } catch (retryError: any) {
        if (suppressRecoveryErrors(retryError)) {
          // If reconnection fails, force session reset
          await forceResetPrivySession();
          throw new Error('Wallet connection corrupted. Please disconnect and reconnect your wallet.');
        }
        throw retryError;
      }
    }
    throw error;
  }
};