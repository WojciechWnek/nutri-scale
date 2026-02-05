import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';

interface SseEvent {
  data: any;
  type?: string;
  id?: string;
  retry?: number;
}

@Injectable()
export class SseService {
  private readonly logger = new Logger(SseService.name);
  private readonly clients = new Map<string, Subject<SseEvent>>();

  // Create a new stream for a given jobId
  createSseStream(jobId: string): Observable<SseEvent> {
    this.logger.log(`Client connected to SSE for jobId: ${jobId}`);

    if (!this.clients.has(jobId)) {
      const subject = new Subject<SseEvent>();
      this.clients.set(jobId, subject);
      this.logger.log(`SSE stream created for jobId: ${jobId}`);
      // Remove client when stream is completed or errors
      subject.subscribe({
        complete: () => {
          this.logger.log(`SSE stream completed for jobId: ${jobId}`);
          this.clients.delete(jobId);
        },
        error: (err) => {
          this.logger.error(
            `SSE stream error for jobId: ${jobId}: ${err.message}`,
          );
          this.clients.delete(jobId);
        },
      });
    }

    const client = this.clients.get(jobId);

    if (!client) {
      throw new Error(`Client for jobId ${jobId} not found`);
    }

    return client.asObservable();
  }

  // Send an event to a specific jobId's stream
  sendEvent(jobId: string, eventName: string, data: any) {
    const client = this.clients.get(jobId);
    if (client) {
      this.logger.log(`Sending event '${eventName}' to jobId: ${jobId}`);
      client.next({ type: eventName, data: data });
    } else {
      this.logger.warn(
        `No active SSE client for jobId: ${jobId} to send event '${eventName}'.`,
      );
    }
  }

  // Complete a stream (e.g., when job is finished)
  completeStream(jobId: string) {
    const client = this.clients.get(jobId);
    if (client) {
      this.logger.log(`Completing SSE stream for jobId: ${jobId}`);
      client.complete();
    }
  }
}
