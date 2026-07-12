export const LEAVE_REQUESTS_QUEUE = 'leave_requests_queue';
export const LEAVE_REQUESTS_DLX = 'leave_requests_dlx';
export const LEAVE_REQUESTS_DLQ = 'leave_requests_dlq';

export const leaveRequestsQueueArguments = {
  'x-dead-letter-exchange': LEAVE_REQUESTS_DLX,
  'x-dead-letter-routing-key': LEAVE_REQUESTS_DLQ,
};
