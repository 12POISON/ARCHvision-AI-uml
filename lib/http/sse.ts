/**
 * Server-Sent Events framing helper (used by the streaming AI chat route).
 * Transport concern only — the business logic lives in AiAssistService.
 */

export interface SseWriter {
  write(event: string, data: string): void;
  end(): void;
}

const encoder = new TextEncoder();

export function streamSse(producer: (writer: SseWriter) => Promise<void>): Response {
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const writer: SseWriter = {
        write: (event, data) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${data}\n\n`));
        },
        end: () => {
          try {
            controller.close();
          } catch {
            // already closed
          }
        },
      };
      try {
        await producer(writer);
      } catch (error) {
        writer.write("error", error instanceof Error ? error.message : "Unexpected error");
      } finally {
        writer.end();
      }
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}