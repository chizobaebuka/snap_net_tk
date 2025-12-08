
export interface RetryStrategy {
    shouldRetry(attempt: number, error: any): boolean;
    getDelay(attempt: number): number;
}
