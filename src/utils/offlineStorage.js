// Offline storage utilities using IndexedDB

const DB_NAME = 'SmileShotDB';
const DB_VERSION = 1;
const PRACTICE_STORE = 'practice-sessions';
const PENDING_STORE = 'pending-practice';

class OfflineStorage {
  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create practice sessions store
        if (!db.objectStoreNames.contains(PRACTICE_STORE)) {
          const practiceStore = db.createObjectStore(PRACTICE_STORE, { 
            keyPath: 'id',
            autoIncrement: true 
          });
          practiceStore.createIndex('userId', 'userId', { unique: false });
          practiceStore.createIndex('date', 'date', { unique: false });
        }

        // Create pending practice store for offline sync
        if (!db.objectStoreNames.contains(PENDING_STORE)) {
          const pendingStore = db.createObjectStore(PENDING_STORE, { 
            keyPath: 'id',
            autoIncrement: true 
          });
          pendingStore.createIndex('userId', 'userId', { unique: false });
        }
      };
    });
  }

  async savePracticeSession(sessionData) {
    if (!this.db) await this.init();

    const transaction = this.db.transaction([PRACTICE_STORE], 'readwrite');
    const store = transaction.objectStore(PRACTICE_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.add({
        ...sessionData,
        date: new Date().toISOString(),
        synced: navigator.onLine
      });
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async savePendingPractice(practiceData) {
    if (!this.db) await this.init();

    const transaction = this.db.transaction([PENDING_STORE], 'readwrite');
    const store = transaction.objectStore(PENDING_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.add({
        ...practiceData,
        timestamp: new Date().toISOString()
      });
      
      request.onsuccess = () => {
        // Request background sync
        if ('sync' in self.registration) {
          self.registration.sync.register('sync-practice-data');
        }
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getPracticeSessions(userId, limit = 50) {
    if (!this.db) await this.init();

    const transaction = this.db.transaction([PRACTICE_STORE], 'readonly');
    const store = transaction.objectStore(PRACTICE_STORE);
    const index = store.index('userId');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(userId);
      
      request.onsuccess = () => {
        const sessions = request.result
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, limit);
        resolve(sessions);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingPractices() {
    if (!this.db) await this.init();

    const transaction = this.db.transaction([PENDING_STORE], 'readonly');
    const store = transaction.objectStore(PENDING_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deletePendingPractice(id) {
    if (!this.db) await this.init();

    const transaction = this.db.transaction([PENDING_STORE], 'readwrite');
    const store = transaction.objectStore(PENDING_STORE);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearOldSessions(daysToKeep = 30) {
    if (!this.db) await this.init();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const transaction = this.db.transaction([PRACTICE_STORE], 'readwrite');
    const store = transaction.objectStore(PRACTICE_STORE);
    const index = store.index('date');
    
    return new Promise((resolve, reject) => {
      const range = IDBKeyRange.upperBound(cutoffDate.toISOString());
      const request = index.openCursor(range);
      let deletedCount = 0;

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          store.delete(cursor.primaryKey);
          deletedCount++;
          cursor.continue();
        } else {
          resolve(deletedCount);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }
}

// Create singleton instance
const offlineStorage = new OfflineStorage();

// Network status handler
window.addEventListener('online', async () => {
  console.log('Back online - syncing pending practices');
  
  try {
    const pendingPractices = await offlineStorage.getPendingPractices();
    
    for (const practice of pendingPractices) {
      try {
        // Attempt to sync with server
        const response = await fetch('/api/practice', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(practice)
        });

        if (response.ok) {
          await offlineStorage.deletePendingPractice(practice.id);
        }
      } catch (error) {
        console.error('Failed to sync practice:', error);
      }
    }
  } catch (error) {
    console.error('Failed to sync pending practices:', error);
  }
});

export default offlineStorage;