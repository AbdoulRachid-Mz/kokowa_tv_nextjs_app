// lib/realtime/connectionManager.ts
interface Client {
  id: string;
  type: 'web' | 'flutter';
  send: (data: any) => void;
  subscriptions: Set<string>;
}

class ConnectionManager {
  private clients: Map<string, Client> = new Map();
  private matchSubscriptions: Map<number, Set<string>> = new Map();
  private editionSubscriptions: Map<number, Set<string>> = new Map();

  addClient(client: Client) {
    this.clients.set(client.id, client);
    console.log(`Client ${client.id} connected (${client.type})`);
  }

  removeClient(clientId: string) {
    const client = this.clients.get(clientId);
    if (client) {
      // Nettoyer les subscriptions
      client.subscriptions.forEach(topic => {
        this.unsubscribeFromTopic(clientId, topic);
      });
      this.clients.delete(clientId);
      console.log(`Client ${clientId} disconnected`);
    }
  }

  subscribeToMatch(clientId: string, matchId: number) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const topic = `match:${matchId}`;
    client.subscriptions.add(topic);

    if (!this.matchSubscriptions.has(matchId)) {
      this.matchSubscriptions.set(matchId, new Set());
    }
    this.matchSubscriptions.get(matchId)!.add(clientId);

    console.log(`Client ${clientId} subscribed to match ${matchId}`);
  }

  unsubscribeFromMatch(clientId: string, matchId: number) {
    const topic = `match:${matchId}`;
    this.unsubscribeFromTopic(clientId, topic);
  }

  subscribeToEdition(clientId: string, editionId: number) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const topic = `edition:${editionId}`;
    client.subscriptions.add(topic);

    if (!this.editionSubscriptions.has(editionId)) {
      this.editionSubscriptions.set(editionId, new Set());
    }
    this.editionSubscriptions.get(editionId)!.add(clientId);

    console.log(`Client ${clientId} subscribed to edition ${editionId}`);
  }

  private unsubscribeFromTopic(clientId: string, topic: string) {
    const client = this.clients.get(clientId);
    if (client) {
      client.subscriptions.delete(topic);
    }

    // Nettoyer les subscriptions spécifiques
    if (topic.startsWith('match:')) {
      const matchId = parseInt(topic.split(':')[1]);
      this.matchSubscriptions.get(matchId)?.delete(clientId);
    } else if (topic.startsWith('edition:')) {
      const editionId = parseInt(topic.split(':')[1]);
      this.editionSubscriptions.get(editionId)?.delete(clientId);
    }
  }

  broadcastToMatch(matchId: number, event: string, data: any) {
    const subscribers = this.matchSubscriptions.get(matchId);
    if (!subscribers) return;

    const message = {
      type: event,
      data,
      timestamp: new Date().toISOString()
    };

    subscribers.forEach(clientId => {
      const client = this.clients.get(clientId);
      if (client) {
        try {
          client.send(message);
        } catch (error) {
          console.error(`Error sending to client ${clientId}:`, error);
          this.removeClient(clientId);
        }
      }
    });
  }

  broadcastToEdition(editionId: number, event: string, data: any) {
    const subscribers = this.editionSubscriptions.get(editionId);
    if (!subscribers) return;

    const message = {
      type: event,
      data,
      timestamp: new Date().toISOString()
    };

    subscribers.forEach(clientId => {
      const client = this.clients.get(clientId);
      if (client) {
        try {
          client.send(message);
        } catch (error) {
          console.error(`Error sending to client ${clientId}:`, error);
          this.removeClient(clientId);
        }
      }
    });
  }

  getStats() {
    return {
      totalClients: this.clients.size,
      matchSubscriptions: this.matchSubscriptions.size,
      editionSubscriptions: this.editionSubscriptions.size
    };
  }
}

export const connectionManager = new ConnectionManager();