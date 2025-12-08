
import { RetryStrategy } from './retry.strategy';

export class ExponentialBackoffRetryStrategy implements RetryStrategy {
    constructor(
        private maxAttempts: number,
        private initialDelay: number,
        private multiplier: number = 2
    ) { }

    shouldRetry(attempt: number, error: any): boolean {
        return attempt < this.maxAttempts;
    }

    getDelay(attempt: number): number {
        return this.initialDelay * Math.pow(this.multiplier, attempt - 1);
    }
}
