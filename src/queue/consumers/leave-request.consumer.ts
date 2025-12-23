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
            const retryStrategy = new ExponentialBackoffRetryStrategy(3, 1000);
            const headers = originalMsg.properties.headers || {};
            const attempt = (headers['x-retry-count'] || 0) + 1;

            if (retryStrategy.shouldRetry(attempt, error)) {
                const delay = retryStrategy.getDelay(attempt);
                this.logger.log(`Retrying attempt ${attempt} in ${delay}ms`);

                // Simple delay (blocks this specific message processing)
                await new Promise(resolve => setTimeout(resolve, delay));

                // Re-publish with incremented retry count
                channel.publish(
                    originalMsg.fields.exchange,
                    originalMsg.fields.routingKey,
                    originalMsg.content,
                    { headers: { ...headers, 'x-retry-count': attempt } }
                );
                channel.ack(originalMsg);
            } else {
                // MAX RETRIES REACHED
                // Since we don't have a DLQ configured, we must log this CRITICALLY so it's not lost.
                this.logger.error(`CRITICAL: Max retries reached for message. Payload: ${JSON.stringify(JSON.parse(originalMsg.content.toString()))}`);

                // Ack the message to remove it from the queue (prevent infinite loops)
                channel.ack(originalMsg);
            }
        }
    }
}
