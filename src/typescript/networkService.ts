// Network service for server communication
class NetworkService {
    private static readonly SERVER_URL = 'http://localhost:3001';

    static async sendWalletToServer(address: string, source: string): Promise<boolean> {
        try {
            console.log(`Sending wallet to server: ${address} (${source})`);

            const response = await fetch(`${this.SERVER_URL}/api/wallet/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    address: address,
                    source: source
                })
            });

            const data = await response.json();

            if (data.success) {
                console.log('Wallet successfully sent to server:', data.message);
                return true;
            } else {
                console.error('Server error:', data.error);
                return false;
            }

        } catch (error) {
            console.error('Failed to send wallet to server:', error);
            return false;
        }
    }

    static async getServerStats(): Promise<any> {
        try {
            const response = await fetch(`${this.SERVER_URL}/api/wallet/stats`);
            const data = await response.json();

            if (data.success) {
                return data.data;
            }
            return null;

        } catch (error) {
            console.error('Failed to get server stats:', error);
            return null;
        }
    }

    static async checkServerConnection(): Promise<boolean> {
        try {
            const response = await fetch(`${this.SERVER_URL}/api/health`);
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

// Export for global usage
(window as any).NetworkService = NetworkService;