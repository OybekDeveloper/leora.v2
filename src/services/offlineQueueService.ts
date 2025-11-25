// services/offlineQueueService.ts
import NetInfo from '@react-native-community/netinfo';
import { storage } from '@/utils/storage';

export type OfflineOperation = {
  id: string;
  entityType: 'goal' | 'habit' | 'task' | 'focusSession' | 'account' | 'transaction' | 'budget' | 'debt' | 'counterparty';
  operationType: 'create' | 'update' | 'delete';
  entityId: string;
  payload: any;
  timestamp: string;
  retryCount: number;
  lastError?: string;
};

const OFFLINE_QUEUE_KEY = 'offline_queue';
const MAX_RETRY_COUNT = 3;

class OfflineQueueService {
  private queue: OfflineOperation[] = [];
  private isProcessing = false;
  private isOnline = true;
  private listeners: Set<(isOnline: boolean) => void> = new Set();

  constructor() {
    this.init();
  }

  private async init() {
    // Load queue from storage
    await this.loadQueue();

    // Listen to network changes
    NetInfo.addEventListener((state: any) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      // Notify listeners about connectivity change
      this.listeners.forEach((listener) => listener(this.isOnline));

      // If we just came online, process the queue
      if (wasOffline && this.isOnline) {
        this.processQueue();
      }
    });
  }

  /**
   * Add a listener for connectivity changes
   */
  public addConnectivityListener(listener: (isOnline: boolean) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Check if currently online
   */
  public getIsOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Load queue from AsyncStorage
   */
  private async loadQueue() {
    try {
      const queueJson = await storage.getString(OFFLINE_QUEUE_KEY);
      if (queueJson) {
        this.queue = JSON.parse(queueJson);
      }
    } catch (error) {
      console.error('[OfflineQueue] Failed to load queue:', error);
      this.queue = [];
    }
  }

  /**
   * Save queue to AsyncStorage
   */
  private async saveQueue() {
    try {
      await storage.setString(OFFLINE_QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('[OfflineQueue] Failed to save queue:', error);
    }
  }

  /**
   * Add an operation to the queue
   */
  public async enqueue(operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount'>) {
    const newOperation: OfflineOperation = {
      ...operation,
      id: `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };

    this.queue.push(newOperation);
    await this.saveQueue();

    // If online, process immediately
    if (this.isOnline && !this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Get all pending operations
   */
  public getPendingOperations(): OfflineOperation[] {
    return [...this.queue];
  }

  /**
   * Get pending operations count
   */
  public getPendingCount(): number {
    return this.queue.length;
  }

  /**
   * Process the queue
   */
  private async processQueue() {
    if (this.isProcessing || !this.isOnline || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      const operations = [...this.queue];

      for (const operation of operations) {
        try {
          // Here we would normally send to server
          // For now, we'll just simulate success after a delay
          await this.syncOperation(operation);

          // Remove from queue on success
          this.queue = this.queue.filter((op) => op.id !== operation.id);
          await this.saveQueue();
        } catch (error) {
          // Increment retry count
          const opIndex = this.queue.findIndex((op) => op.id === operation.id);
          if (opIndex !== -1) {
            this.queue[opIndex].retryCount += 1;
            this.queue[opIndex].lastError = error instanceof Error ? error.message : 'Unknown error';

            // Remove if exceeded max retries
            if (this.queue[opIndex].retryCount >= MAX_RETRY_COUNT) {
              console.error(
                `[OfflineQueue] Operation ${operation.id} exceeded max retries, removing from queue`,
              );
              this.queue.splice(opIndex, 1);
            }

            await this.saveQueue();
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Sync a single operation to the server
   * This is a placeholder - in production, this would make actual API calls
   */
  private async syncOperation(operation: OfflineOperation): Promise<void> {
    console.log(`[OfflineQueue] Syncing operation:`, {
      type: operation.operationType,
      entity: operation.entityType,
      id: operation.entityId,
    });

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // In production, this would be something like:
    // const endpoint = this.getEndpointForEntity(operation.entityType);
    // await api.request({
    //   method: operation.operationType === 'delete' ? 'DELETE' : operation.operationType === 'create' ? 'POST' : 'PATCH',
    //   url: `${endpoint}/${operation.entityId}`,
    //   data: operation.payload,
    // });

    // For now, we'll just log success
    console.log(`[OfflineQueue] Successfully synced operation ${operation.id}`);
  }

  /**
   * Clear all operations from the queue
   */
  public async clearQueue() {
    this.queue = [];
    await this.saveQueue();
  }

  /**
   * Remove a specific operation from the queue
   */
  public async removeOperation(operationId: string) {
    this.queue = this.queue.filter((op) => op.id !== operationId);
    await this.saveQueue();
  }

  /**
   * Manually trigger queue processing
   */
  public async manualSync() {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }
    await this.processQueue();
  }
}

// Singleton instance
export const offlineQueueService = new OfflineQueueService();
