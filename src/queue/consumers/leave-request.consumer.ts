import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { LeaveRequestRepository } from '../../modules/leave-request/leave-request.repository';
import { LeaveStatus } from '../../database/entities/leave-request.entity';
import moment from 'moment';
import { ExponentialBackoffRetryStrategy } from '../../common/strategies/retry/exponential-backoff.strategy';

@Controller()
export class LeaveRequestConsumer {
    private readonly logger = new Logger(LeaveRequestConsumer.name);

    constructor(private readonly leaveRequestRepository: LeaveRequestRepository) { }

    @EventPattern('leave.requested')
    async handleLeaveRequest(@Payload() data: any, @Ctx() context: RmqContext) {
        const channel = context.getChannelRef();
        const originalMsg = context.getMessage();

        try {
            this.logger.log(`Processing leave request: ${data.leaveRequestId}`);

            const request = await this.leaveRequestRepository.findOne({ where: { id: data.leaveRequestId } });

            if (!request) {
                this.logger.error(`Leave request not found: ${data.leaveRequestId}`);
                channel.ack(originalMsg); // Ack to remove invalid message
                return;
            }

            // Idempotency check: if already processed (not PENDING), skip
            if (request.status !== LeaveStatus.PENDING) {
                this.logger.log(`Leave request ${request.id} already processed. Status: ${request.status}`);
                channel.ack(originalMsg);
                return;
            }

            // Calculate duration
            const start = moment(request.startDate);
            const end = moment(request.endDate);
            const duration = end.diff(start, 'days') + 1; // Inclusive

            // Business Logic
            let newStatus = LeaveStatus.PENDING_APPROVAL;
            if (duration <= 2 && duration > 0) {
                newStatus = LeaveStatus.APPROVED;
            }

            // Update DB
            request.status = newStatus;
            request.processedAt = new Date();
            await this.leaveRequestRepository.save(request);

            this.logger.log(`Leave request ${request.id} processed. New Status: ${newStatus}`);
            channel.ack(originalMsg);
        } catch (error) {
            this.logger.error(`Error processing leave request: ${error.message}`);

            // Retry Strategy
            const retryStrategy = new ExponentialBackoffRetryStrategy(3, 1000); // 3 attempts, start with 1s
            const headers = originalMsg.properties.headers || {};
            const attempt = (headers['x-retry-count'] || 0) + 1;

            if (retryStrategy.shouldRetry(attempt, error)) {
                const delay = retryStrategy.getDelay(attempt);
                this.logger.log(`Retrying attempts ${attempt} in ${delay}ms`);

                // In RabbitMQ, delayed retry usually requires a separate Delayed Exchange or simple Timeout + Requeue.
                // For this demo, we will use a simple setTimeout to simulate delay before Nack(requeue).
                // CAUTION: This blocks the consumer! Better to publish to a 'wait' queue with TTL.
                // BUT, given requirements, we keep it simple or assume infrastructure support.

                // Let's use simple sleep for demo purposes to honor the design pattern request
                await new Promise(resolve => setTimeout(resolve, delay));

                // We restart the message by Nack with requeue=true. 
                // To track attempts, we'd need to republish with updated headers, 
                // but Nack just puts it back. 
                // *Better approach*: Publish to self with updated header, then Ack original.

                channel.publish(
                    originalMsg.fields.exchange,
                    originalMsg.fields.routingKey,
                    originalMsg.content,
                    { headers: { ...headers, 'x-retry-count': attempt } }
                );
                channel.ack(originalMsg);

            } else {
                this.logger.error('Max retries reached. Sending to DLQ (simulated by Nack false)');
                channel.nack(originalMsg, false, false); // No requeue -> DLQ
            }
        }
    }
}
