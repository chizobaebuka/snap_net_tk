import { Logger } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import type { ConfirmChannel } from 'amqplib';
import {
  LEAVE_REQUESTS_DLQ,
  LEAVE_REQUESTS_DLX,
  LEAVE_REQUESTS_QUEUE,
  leaveRequestsQueueArguments,
} from './queue.constants';

const logger = new Logger('QueueTopology');

/**
 * Declares the dead-letter exchange/queue and the main queue's dead-letter
 * binding once at boot. RabbitMQ only auto-creates the queue named in
 * `queueOptions` for us - the DLX and DLQ it points to must be asserted
 * explicitly or dead-lettered messages are silently discarded.
 */
export async function setupQueueTopology(rabbitmqUri: string): Promise<void> {
  const connection = amqp.connect([rabbitmqUri]);
  const channelWrapper = connection.createChannel({
    name: 'topology-setup',
    setup: async (channel: ConfirmChannel) => {
      await channel.assertExchange(LEAVE_REQUESTS_DLX, 'direct', {
        durable: true,
      });
      await channel.assertQueue(LEAVE_REQUESTS_DLQ, { durable: true });
      await channel.bindQueue(
        LEAVE_REQUESTS_DLQ,
        LEAVE_REQUESTS_DLX,
        LEAVE_REQUESTS_DLQ,
      );
      await channel.assertQueue(LEAVE_REQUESTS_QUEUE, {
        durable: true,
        arguments: leaveRequestsQueueArguments,
      });
    },
  });

  try {
    await channelWrapper.waitForConnect();
    logger.log(
      `Queue topology ready: ${LEAVE_REQUESTS_QUEUE} -> (on failure) ${LEAVE_REQUESTS_DLX} -> ${LEAVE_REQUESTS_DLQ}`,
    );
  } finally {
    await channelWrapper.close();
    await connection.close();
  }
}
