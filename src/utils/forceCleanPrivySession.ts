"use client";

// Aggressive Privy session cleanup to prevent recovery errors
export const forceCleanPrivySession = () => {
  if (typeof window === 'undefined') return;

  try {
    // Clear all Privy-related data from localStorage
    Object.keys(localStorage).forEach(key => {
      if (
        key.includes('privy') || 
        key.includes('Privy') || 
        key.includes('embedded') ||
        key.includes('recovery') ||
        key.includes('wallet-session') ||
        key.includes('auth-session')
      ) {
        localStorage.removeItem(key);
        console.log(`Removed localStorage key: ${key}`);
      }
    });

    // Clear all Privy-related data from sessionStorage
    Object.keys(sessionStorage).forEach(key => {
      if (
        key.includes('privy') || 
        key.includes('Privy') || 
        key.includes('embedded') ||
        key.includes('recovery') ||
        key.includes('wallet-session') ||
        key.includes('auth-session')
      ) {
        sessionStorage.removeItem(key);
        console.log(`Removed sessionStorage key: ${key}`);
      }
    });

    // Clear IndexedDB if it exists
    if (window.indexedDB) {
      // Common Privy IndexedDB names
      const dbNames = ['privy-wallet', 'privy-session', 'wallet-recovery'];
      dbNames.forEach(dbName => {
        try {
          const deleteRequest = window.indexedDB.deleteDatabase(dbName);
          deleteRequest.onsuccess = () => console.log(`Deleted IndexedDB: ${dbName}`);
        } catch (e) {
          console.warn(`Failed to delete IndexedDB ${dbName}:`, e);
        }
      });
    }

    // Clear any cookies that might contain Privy session data
    document.cookie.split(";").forEach(cookie => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      if (name.includes('privy') || name.includes('wallet') || name.includes('auth')) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
      }
    });

    console.log('Privy session cleanup completed');
  } catch (error) {
    console.warn('Error during Privy session cleanup:', error);
  }
};

// Force clean session on page load
if (typeof window !== 'undefined') {
  // Clean immediately
  forceCleanPrivySession();
  
  // Also clean on page visibility change (when user comes back to tab)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      forceCleanPrivySession();
    }
  });
}