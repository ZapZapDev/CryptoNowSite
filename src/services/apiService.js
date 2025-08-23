const API_BASE = 'https://zapzap666.xyz/api';

class ApiService {
    constructor() {
        this.token = null;
    }

    setToken(token) {
        this.token = token;
        sessionStorage.setItem('auth_token', token);
    }

    getToken() {
        if (!this.token) {
            this.token = sessionStorage.getItem('auth_token');
        }
        return this.token;
    }

    async request(endpoint, options = {}) {
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.getToken() && { 'Authorization': `Bearer ${this.getToken()}` })
            },
            ...options
        };

        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }

        const response = await fetch(`${API_BASE}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'API Error');
        }

        return data;
    }

    // === AUTH ===
    async login(walletAddress) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: { wallet_address: walletAddress }
        });

        if (response.success && response.token) {
            this.setToken(response.token);
        }

        return response;
    }

    logout() {
        this.token = null;
        sessionStorage.removeItem('auth_token');
    }

    isAuthenticated() {
        return !!this.getToken();
    }

    // === MARKET NETWORKS ===
    async createMarketNetwork(name, description = '') {
        return await this.request('/market-networks', {
            method: 'POST',
            body: { name, description }
        });
    }

    async getMyMarketNetworks() {
        return await this.request('/market-networks/my');
    }

    async getActiveMarketNetworks() {
        return await this.request('/market-networks/active');
    }

    async deleteMarketNetwork(id) {
        return await this.request(`/market-networks/${id}`, {
            method: 'DELETE'
        });
    }
}

const apiService = new ApiService();
window.apiService = apiService;
export default apiService;