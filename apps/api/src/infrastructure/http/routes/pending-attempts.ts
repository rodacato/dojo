/**
 * In-memory bridge between POST /sessions/:id/attempts (HTTP) and the WebSocket handler.
 *
 * The HTTP route generates an attemptId and stores the userResponse here.
 * The WebSocket handler reads and deletes the entry when it receives {type:"submit", attemptId}.
 *
 * TTL: 5 minutes — entries are auto-deleted if the WebSocket never connects.
 *
 * See ADR-008 for the rationale behind this approach.
 */
export const pendingAttempts = new Map<string, { sessionId: string; userResponse: string }>()
