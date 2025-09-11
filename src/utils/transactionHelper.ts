// Helper to clear corrupted session data
export const clearCorruptedSession = () => {
  if (typeof window !== 'undefined') {
    // Clear only problematic keys
    const keysToRemove = Object.keys(localStorage).filter(key => 
      key.includes('privy-session') || 
      key.includes('privy-recovery') ||
      key.includes('privy-embedded-wallet')
    );
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn('Failed to remove storage key:', key);
      }
    });
  }
};

// Safe transaction wrapper that handles recovery errors
export const safeExecuteTransaction = async (
  transactionFn: () => Promise<any>,
  retries = 2
): Promise<any> => {
  for (let i = 0; i < retries; i++) {
    try {
      // Execute the transaction
      return await transactionFn();
    } catch (error: any) {
      const isRecoveryError = error?.message?.includes('Recovery method not supported');
      const isLastRetry = i === retries - 1;
      
      if (isRecoveryError && !isLastRetry) {
        console.warn(`Transaction attempt ${i + 1} failed due to recovery error, retrying...`);
        
        // Clear potential corrupted state
        clearCorruptedSession();
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      
      // If it's not a recovery error or it's the last retry, throw the error
      if (isRecoveryError) {
        throw new Error('Transaction failed due to wallet connection issues. Please refresh the page and try again.');
      }
      
      throw error;
    }
  }
};