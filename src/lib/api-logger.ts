// API Call Logger
// Tracks API calls for admin panel monitoring

export interface ApiLogEntry {
  id: string;
  timestamp: string;
  callerPage: string;
  endpoint: string;
  params: Record<string, string | number>;
  status: number;
  statusText: string;
  responseTime: number;
  response?: unknown;
  usedFields?: string[];
  error?: string;
}

const MAX_LOG_ENTRIES = 200;

class ApiLogger {
  private logs: ApiLogEntry[] = [];
  private subscribers: Set<() => void> = new Set();

  // Add a new log entry
  log(entry: Omit<ApiLogEntry, 'id' | 'timestamp'>): void {
    const newEntry: ApiLogEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    this.logs.unshift(newEntry);

    // Keep only the last MAX_LOG_ENTRIES
    if (this.logs.length > MAX_LOG_ENTRIES) {
      this.logs = this.logs.slice(0, MAX_LOG_ENTRIES);
    }

    // Notify subscribers
    this.notifySubscribers();
  }

  // Get all logs
  getLogs(): ApiLogEntry[] {
    return [...this.logs];
  }

  // Get logs count
  getCount(): number {
    return this.logs.length;
  }

  // Clear all logs
  clear(): void {
    this.logs = [];
    this.notifySubscribers();
  }

  // Subscribe to log updates
  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback());
  }

  // Get summary statistics
  getStats(): {
    total: number;
    success: number;
    errors: number;
    avgResponseTime: number;
    endpointCounts: Record<string, number>;
    callerCounts: Record<string, number>;
  } {
    const stats = {
      total: this.logs.length,
      success: 0,
      errors: 0,
      avgResponseTime: 0,
      endpointCounts: {} as Record<string, number>,
      callerCounts: {} as Record<string, number>,
    };

    let totalResponseTime = 0;

    this.logs.forEach(log => {
      if (log.status >= 200 && log.status < 300) {
        stats.success++;
      } else {
        stats.errors++;
      }

      totalResponseTime += log.responseTime;

      // Count by endpoint
      stats.endpointCounts[log.endpoint] = (stats.endpointCounts[log.endpoint] || 0) + 1;

      // Count by caller
      stats.callerCounts[log.callerPage] = (stats.callerCounts[log.callerPage] || 0) + 1;
    });

    stats.avgResponseTime = this.logs.length > 0 ? totalResponseTime / this.logs.length : 0;

    return stats;
  }
}

// Singleton instance
export const apiLogger = new ApiLogger();

// Helper function to create a logged fetch wrapper
export function createLoggedFetch(callerPage: string) {
  return async function loggedFetch<T>(
    endpoint: string,
    params: Record<string, string | number> = {},
    fetchFn: () => Promise<{ status: number; statusText: string; data: T }>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await fetchFn();
      const responseTime = Date.now() - startTime;

      apiLogger.log({
        callerPage,
        endpoint,
        params,
        status: result.status,
        statusText: result.statusText,
        responseTime,
        response: result.data,
      });

      return result.data;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      apiLogger.log({
        callerPage,
        endpoint,
        params,
        status: 500,
        statusText: 'Error',
        responseTime,
        response: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  };
}
