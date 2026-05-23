const clients = new Set();

export function addClient(client) {
  clients.add(client);
}

export function removeClient(client) {
  clients.delete(client);
}

export function notifyClients(data) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  clients.forEach(client => {
    try {
      client.controller.enqueue(message);
    } catch {
      clients.delete(client);
    }
  });
}