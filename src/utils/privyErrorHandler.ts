// Utility to handle and suppress Privy recovery errors
export const suppressRecoveryErrors = (error: any) => {
  if (error?.message?.includes('Recovery method not supported')) {
    console.warn('Privy recovery error suppressed:', error.message);
    return true; // Error was suppressed
  }
  return false; // Error should be handled normally
};

// Wrapper for getAccessToken that handles recovery errors
export const safeGetAccessToken = async () => {
  const { getAccessToken } = await import('@privy-io/react-auth');
  
  try {
    return await getAccessToken();
  } catch (error: any) {
    if (suppressRecoveryErrors(error)) {
      // Return null or retry the token request
      try {
        // Wait a bit and try again
        await new Promise(resolve => setTimeout(resolve, 1000));
        return await getAccessToken();
      } catch (retryError: any) {
        if (suppressRecoveryErrors(retryError)) {
          throw new Error('Unable to authenticate. Please refresh the page and try again.');
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
      // Wait a bit and try again
      await new Promise(resolve => setTimeout(resolve, 1000));
      try {
        return await wallet.getEthereumProvider();
      } catch (retryError: any) {
        if (suppressRecoveryErrors(retryError)) {
          throw new Error('Unable to connect to wallet. Please refresh the page and try again.');
        }
        throw retryError;
      }
    }
    throw error;
  }
};