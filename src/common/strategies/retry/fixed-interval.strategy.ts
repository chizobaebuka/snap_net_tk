
import { RetryStrategy } from './retry.strategy';

export class FixedIntervalRetryStrategy implements RetryStrategy {
    constructor(private maxAttempts: number, private delay: number) { }

    shouldRetry(attempt: number, error: any): boolean {
        return attempt < this.maxAttempts;
    }

    getDelay(attempt: number): number {
        return this.delay;
    }
}
