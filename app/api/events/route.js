import { addClient, removeClient } from '@/lib/sse';

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      const client = { controller };
      addClient(client);

      // Send a heartbeat every 30s to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(`data: heartbeat\n\n`);
        } catch {
          clearInterval(heartbeat);
        }
      }, 30000);

      // Cleanup when client disconnects
      return () => {
        clearInterval(heartbeat);
        removeClient(client);
      };
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  });
}