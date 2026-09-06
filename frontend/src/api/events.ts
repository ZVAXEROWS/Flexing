import { apiClient } from './client';
import { EventType } from '../types';

export const postEvent = async (
  eventType: EventType,
  contentId: string,
  duration?: number,
  metadata?: Record<string, unknown>
): Promise<void> => {
  try {
    await apiClient.post('/events', {
      eventType,
      contentId,
      duration: duration || 0,
      timestamp: new Date().toISOString(),
      metadata: metadata || {}
    });
  } catch {
    // Log in console for testing observability
    console.debug(`[Telemetry Event] ${eventType.toUpperCase()} on ${contentId}`, { duration, metadata });
  }
};
