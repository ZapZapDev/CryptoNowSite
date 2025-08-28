//Merchant.ts - Updated with server integration
interface Market {
    id: number;
    name: string;
    location?: string;
    createdAt: string;
}

interface Network {
    id: number;
    name: string;
    description: string;
    createdAt: string;
    markets?: Market[];
}

interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

const SERVER_URL = 'https://zapzap666.xyz';

/** ---------------- Auth Helper ---------------- */
function getAuthData() {
    return {
        walletAddress: localStorage.getItem("connectedWalletAddress"),
        sessionKey: localStorage.getItem("sessionKey")
    };
}

function isAuthenticated(): boolean {
    const { walletAddress, sessionKey } = getAuthData();
    return !!(walletAddress && sessionKey);
}

/** ---------------- API Service ---------------- */
class MerchantAPI {
    private static async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
        try {
            const response = await fetch(`${SERVER_URL}/api/merchant${endpoint}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                ...options
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('❌ API Request failed:', error);
            return {
                success: false,
                error: 'Network error'
            };
        }
    }

    // MarketNetwork APIs
    static async createNetwork(name: string, description: string): Promise<ApiResponse<Network>> {
        const { walletAddress, sessionKey } = getAuthData();
        return this.makeRequest('/networks', {
            method: 'POST',
            body: JSON.stringify({ walletAddress, sessionKey, name, description })
        });
    }

    static async getNetworks(): Promise<ApiResponse<Network[]>> {
        const { walletAddress, sessionKey } = getAuthData();
        return this.makeRequest('/networks/list', {
            method: 'POST',
            body: JSON.stringify({ walletAddress, sessionKey })
        });
    }

    static async updateNetwork(id: number, name: string, description: string): Promise<ApiResponse<Network>> {
        const { walletAddress, sessionKey } = getAuthData();
        return this.makeRequest(`/networks/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ walletAddress, sessionKey, name, description })
        });
    }

    static async deleteNetwork(id: number): Promise<ApiResponse> {
        const { walletAddress, sessionKey } = getAuthData();
        return this.makeRequest(`/networks/${id}`, {
            method: 'DELETE',
            body: JSON.stringify({ walletAddress, sessionKey })
        });
    }

    // Market APIs
    static async createMarket(marketNetworkId: number, name: string, location: string): Promise<ApiResponse<Market>> {
        const { walletAddress, sessionKey } = getAuthData();
        return this.makeRequest('/markets', {
            method: 'POST',
            body: JSON.stringify({ walletAddress, sessionKey, marketNetworkId, name, location })
        });
    }

    static async getMarkets(networkId: number): Promise<ApiResponse<Market[]>> {
        const { walletAddress, sessionKey } = getAuthData();
        return this.makeRequest(`/markets/${networkId}/list`, {
            method: 'POST',
            body: JSON.stringify({ walletAddress, sessionKey })
        });
    }

    static async updateMarket(id: number, name: string, location: string): Promise<ApiResponse<Market>> {
        const { walletAddress, sessionKey } = getAuthData();
        return this.makeRequest(`/markets/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ walletAddress, sessionKey, name, location })
        });
    }

    static async deleteMarket(id: number): Promise<ApiResponse> {
        const { walletAddress, sessionKey } = getAuthData();
        return this.makeRequest(`/markets/${id}`, {
            method: 'DELETE',
            body: JSON.stringify({ walletAddress, sessionKey })
        });
    }
}

/** ---------------- Dropdown ---------------- */
class Dropdown {
    private button: HTMLElement;
    private dropdown: HTMLElement;
    private static openDropdown: HTMLElement | null = null;

    constructor(buttonId: string, dropdownId: string) {
        this.button = document.getElementById(buttonId)!;
        this.dropdown = document.getElementById(dropdownId)!;
        this.init();
    }

    private init(): void {
        this.button.addEventListener("click", (e) => {
            e.stopPropagation();

            if (Dropdown.openDropdown && Dropdown.openDropdown !== this.dropdown) {
                Dropdown.openDropdown.classList.add("hidden");
                this.resetArrow(Dropdown.openDropdown.previousElementSibling as HTMLElement);
            }

            this.dropdown.classList.toggle("hidden");
            Dropdown.openDropdown = this.dropdown.classList.contains("hidden") ? null : this.dropdown;
            this.toggleArrow(this.button);
        });

        document.addEventListener("click", () => {
            if (!this.dropdown.classList.contains("hidden")) {
                this.dropdown.classList.add("hidden");
                this.resetArrow(this.button);
                Dropdown.openDropdown = null;
            }
        });
    }

    private toggleArrow(btn: HTMLElement): void {
        const arrow = btn.querySelector("svg");
        if (arrow) arrow.classList.toggle("rotate-180");
    }

    private resetArrow(btn: HTMLElement): void {
        const arrow = btn.querySelector("svg");
        if (arrow) arrow.classList.remove("rotate-180");
    }
}

/** ---------------- MerchantNetworks ---------------- */
class MerchantNetworks {
    private networks: Network[] = [];
    private innerGrid: HTMLElement;

    // Network Create Modal
    private networkModal: HTMLElement;
    private networkModalBackdrop: HTMLElement;
    private networkModalClose: HTMLElement;
    private networkName: HTMLInputElement;
    private networkDescription: HTMLTextAreaElement;
    private saveNetwork: HTMLElement;

    // Network View Modal
    private networkViewModal: HTMLElement;
    private networkViewBackdrop: HTMLElement;
    private networkViewBack: HTMLElement;
    private networkViewTitle: HTMLElement;
    private marketsList: HTMLElement;
    private currentNetworkId: number | null = null;

    // Market Modal
    private marketModal: HTMLElement;
    private marketModalBackdrop: HTMLElement;
    private marketModalClose: HTMLElement;
    private marketName: HTMLInputElement;
    private saveMarket: HTMLElement;

    constructor() {
        this.innerGrid = document.getElementById("innerGrid")!;

        // Network modal elements
        this.networkModal = document.getElementById("networkModal")!;
        this.networkModalBackdrop = document.getElementById("networkModalBackdrop")!;
        this.networkModalClose = document.getElementById("networkModalClose")!;
        this.networkName = document.getElementById("networkName") as HTMLInputElement;
        this.networkDescription = document.getElementById("networkDescription") as HTMLTextAreaElement;
        this.saveNetwork = document.getElementById("saveNetwork")!;

        // Network view modal elements
        this.networkViewModal = document.getElementById("networkViewModal")!;
        this.networkViewBackdrop = document.getElementById("networkViewBackdrop")!;
        this.networkViewBack = document.getElementById("networkViewBack")!;
        this.networkViewTitle = document.getElementById("networkViewTitle")!;
        this.marketsList = document.getElementById("marketsList")!;

        // Market modal elements
        this.marketModal = document.getElementById("marketModal")!;
        this.marketModalBackdrop = document.getElementById("marketModalBackdrop")!;
        this.marketModalClose = document.getElementById("marketModalClose")!;
        this.marketName = document.getElementById("marketName") as HTMLInputElement;
        this.saveMarket = document.getElementById("saveMarket")!;

        this.initEventListeners();
        this.loadNetworks();

        // Initialize dropdowns
        new Dropdown("MenuButton", "MenuDropdown");
        new Dropdown("MarketsButton", "MarketsDropdown");

        document.getElementById("AddMarketButton")?.addEventListener("click", () => this.openMarketModal());
    }

    /** ---------------- Event Listeners ---------------- */
    private initEventListeners(): void {
        // Network create modal
        this.networkModalClose.addEventListener("click", () => this.closeCreateModal());
        this.networkModalBackdrop.addEventListener("click", () => this.closeCreateModal());
        this.saveNetwork.addEventListener("click", () => this.handleSaveNetwork());

        // Network view modal
        this.networkViewBack.addEventListener("click", () => this.closeViewModal());
        this.networkViewBackdrop.addEventListener("click", () => this.closeViewModal());

        // Market modal
        this.marketModalClose.addEventListener("click", () => this.closeMarketModal());
        this.marketModalBackdrop.addEventListener("click", () => this.closeMarketModal());
        this.saveMarket.addEventListener("click", () => this.handleSaveMarket());
    }

    /** ---------------- Network Logic ---------------- */
    private createAddBlock(): HTMLElement {
        const block = document.createElement("div");
        block.className = "network-add-block bg-crypto-dark border-2 border-crypto-border rounded-2xl h-48 flex items-center justify-center cursor-pointer hover:bg-crypto-border hover:scale-105 transition-all duration-200";
        block.innerHTML = `<svg class="w-12 h-12 text-crypto-text-muted" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 6v12M6 12h12"/></svg>`;
        block.addEventListener("click", () => {
            if (!isAuthenticated()) {
                alert('Please connect your wallet first');
                return;
            }
            this.openCreateModal();
        });
        return block;
    }

    private createNetworkBlock(network: Network): HTMLElement {
        const block = document.createElement("div");
        block.className = "network-block bg-crypto-dark border-2 border-crypto-border rounded-2xl h-48 p-4 cursor-pointer hover:bg-crypto-border hover:scale-105 transition-all duration-200 flex flex-col";
        block.innerHTML = `
            <div class="flex-1 flex flex-col justify-center">
                <h3 class="text-white text-lg font-semibold text-center truncate">${network.name || "Network"}</h3>
                ${network.description && network.description.trim() ? `<p class="text-crypto-text-muted text-sm text-center line-clamp-3 mt-2">${network.description}</p>` : ""}
            </div>`;
        block.addEventListener("click", () => this.openViewModal(network));
        return block;
    }

    private renderNetworks(): void {
        this.innerGrid.innerHTML = "";
        this.networks.forEach((n) => this.innerGrid.appendChild(this.createNetworkBlock(n)));
        this.innerGrid.appendChild(this.createAddBlock());
    }

    /** ---------------- Network Modals ---------------- */
    private openCreateModal(): void {
        this.currentNetworkId = null;
        this.networkName.value = "";
        this.networkDescription.value = "";
        this.showCreateModal();
        this.networkName.focus();
    }

    private async openViewModal(network: Network): Promise<void> {
        this.currentNetworkId = network.id;
        this.networkViewTitle.textContent = network.name;

        this.marketsList.innerHTML = "";

        // Загружаем актуальные маркеты с сервера
        const response = await MerchantAPI.getMarkets(network.id);
        if (response.success && response.data) {
            response.data.forEach(market => {
                const li = document.createElement("li");
                li.className = `
                flex items-center gap-2 px-2 py-1 text-white hover:bg-crypto-border hover:scale-105
                transition-all duration-200 rounded
            `;

                const dot = document.createElement("span");
                dot.className = "w-1.5 h-1.5 bg-white rounded-full flex-shrink-0";

                const text = document.createElement("span");
                text.textContent = market.name;

                li.appendChild(dot);
                li.appendChild(text);

                this.marketsList.appendChild(li);
            });
        }

        this.showViewModal();
    }

    private showCreateModal(): void {
        this.networkModal.classList.remove("hidden");
        this.networkModal.classList.add("flex");
        document.body.style.overflow = "hidden";
    }

    private closeCreateModal(): void {
        this.networkModal.classList.add("hidden");
        this.networkModal.classList.remove("flex");
        document.body.style.overflow = "auto";
    }

    private showViewModal(): void {
        this.networkViewModal.classList.remove("hidden");
        document.body.style.overflow = "hidden";
    }

    private closeViewModal(): void {
        this.networkViewModal.classList.add("hidden");
        document.body.style.overflow = "auto";
        this.currentNetworkId = null;
    }

    /** ---------------- Market Modals ---------------- */
    private openMarketModal(): void {
        if (!this.currentNetworkId) return;
        if (!isAuthenticated()) {
            alert('Please connect your wallet first');
            return;
        }
        this.marketName.value = "";
        this.marketModal.classList.remove("hidden");
        this.marketModal.classList.add("flex");
    }

    private closeMarketModal(): void {
        this.marketModal.classList.add("hidden");
        this.marketModal.classList.remove("flex");
    }

    /** ---------------- CRUD Operations ---------------- */
    private async handleSaveNetwork(): Promise<void> {
        const name = this.networkName.value.trim();
        const description = this.networkDescription.value.trim();

        if (!name) {
            this.networkName.focus();
            return;
        }

        if (!isAuthenticated()) {
            alert('Please connect your wallet first');
            return;
        }

        console.log('🔨 Creating network:', name);
        const response = await MerchantAPI.createNetwork(name, description);

        if (response.success && response.data) {
            console.log('✅ Network created successfully');
            await this.loadNetworks(); // Перезагружаем с сервера
            this.closeCreateModal();
        } else {
            console.error('❌ Failed to create network:', response.error);
            alert(response.error || 'Failed to create network');
        }
    }

    private async handleSaveMarket(): Promise<void> {
        const name = this.marketName.value.trim();
        if (!name || !this.currentNetworkId) return;

        if (!isAuthenticated()) {
            alert('Please connect your wallet first');
            return;
        }

        console.log('🔨 Creating market:', name);
        const response = await MerchantAPI.createMarket(this.currentNetworkId, name, name);

        if (response.success) {
            console.log('✅ Market created successfully');
            this.closeMarketModal();

            // Обновляем вид сети
            const network = this.networks.find(n => n.id === this.currentNetworkId);
            if (network) {
                await this.openViewModal(network);
            }
        } else {
            console.error('❌ Failed to create market:', response.error);
            alert(response.error || 'Failed to create market');
        }
    }

    private async loadNetworks(): Promise<void> {
        if (!isAuthenticated()) {
            console.log('⚠️ User not authenticated, showing empty state');
            this.networks = [];
            this.renderNetworks();
            return;
        }

        console.log('📥 Loading networks from server...');
        const response = await MerchantAPI.getNetworks();

        if (response.success && response.data) {
            this.networks = response.data;
            console.log('✅ Loaded', this.networks.length, 'networks');
        } else {
            console.error('❌ Failed to load networks:', response.error);
            this.networks = [];
        }

        this.renderNetworks();
    }
}

/** ---------------- Init ---------------- */
document.addEventListener("DOMContentLoaded", () => {
    new MerchantNetworks();
});