//Merchant.ts - МИНИМАЛЬНЫЕ ИЗМЕНЕНИЯ для удаления
interface Menu {
    id: number;
    name: string;
    createdAt: string;
}

interface Table {
    id: number;
    number: number;
    createdAt: string;
}

interface Market {
    id: number;
    name: string;
    createdAt: string;
    tables?: Table[];
}

interface Network {
    id: number;
    name: string;
    description: string;
    createdAt: string;
    markets?: Market[];
    menus?: Menu[];
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

    // Market APIs
    static async createMarket(marketNetworkId: number, name: string): Promise<ApiResponse<Market>> {
        const { walletAddress, sessionKey } = getAuthData();
        return this.makeRequest('/markets', {
            method: 'POST',
            body: JSON.stringify({ walletAddress, sessionKey, marketNetworkId, name })
        });
    }

    static async getMarkets(networkId: number): Promise<ApiResponse<Market[]>> {
        const { walletAddress, sessionKey } = getAuthData();
        return this.makeRequest(`/markets/${networkId}/list`, {
            method: 'POST',
            body: JSON.stringify({ walletAddress, sessionKey })
        });
    }

    // Table APIs
    static async createTable(marketId: number): Promise<ApiResponse<Table>> {
        const { walletAddress, sessionKey } = getAuthData();
        return this.makeRequest('/tables', {
            method: 'POST',
            body: JSON.stringify({ walletAddress, sessionKey, marketId })
        });
    }

    static async getTables(marketId: number): Promise<ApiResponse<Table[]>> {
        const { walletAddress, sessionKey } = getAuthData();
        return this.makeRequest(`/tables/${marketId}/list`, {
            method: 'POST',
            body: JSON.stringify({ walletAddress, sessionKey })
        });
    }

    // Menu APIs
    static async createMenu(marketNetworkId: number, name: string): Promise<ApiResponse<Menu>> {
        const { walletAddress, sessionKey } = getAuthData();
        return this.makeRequest('/menus', {
            method: 'POST',
            body: JSON.stringify({ walletAddress, sessionKey, marketNetworkId, name })
        });
    }

    static async getMenus(networkId: number): Promise<ApiResponse<Menu[]>> {
        const { walletAddress, sessionKey } = getAuthData();
        return this.makeRequest(`/menus/${networkId}/list`, {
            method: 'POST',
            body: JSON.stringify({ walletAddress, sessionKey })
        });
    }

    // НОВОЕ: Delete APIs (4 строки)
    static async delete(type: string, id: number): Promise<ApiResponse> {
        const { walletAddress, sessionKey } = getAuthData();
        return this.makeRequest(`/${type}s/${id}`, { method: 'DELETE', body: JSON.stringify({ walletAddress, sessionKey }) });
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
    private menusList: HTMLElement;
    private currentNetworkId: number | null = null;

    // Market Modal
    private marketModal: HTMLElement;
    private marketModalBackdrop: HTMLElement;
    private marketModalClose: HTMLElement;
    private marketName: HTMLInputElement;
    private saveMarket: HTMLElement;

    // Menu Modal
    private menuModal: HTMLElement;
    private menuModalBackdrop: HTMLElement;
    private menuModalClose: HTMLElement;
    private menuName: HTMLInputElement;
    private saveMenu: HTMLElement;

    // Menu View Modal
    private menuViewModal: HTMLElement;
    private menuViewBackdrop: HTMLElement;
    private menuViewBack: HTMLElement;
    private menuViewTitle: HTMLElement;
    private currentMenuId: number | null = null;

    // Market View Modal
    private marketViewModal: HTMLElement;
    private marketViewBackdrop: HTMLElement;
    private marketViewBack: HTMLElement;
    private marketViewTitle: HTMLElement;
    private tablesList: HTMLElement;
    private currentMarketId: number | null = null;

    // Table View Modal
    private tableViewModal: HTMLElement;
    private tableViewBackdrop: HTMLElement;
    private tableViewBack: HTMLElement;
    private tableViewTitle: HTMLElement;
    private currentTableId: number | null = null;

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
        this.menusList = document.getElementById("menusList")!;

        // Market modal elements
        this.marketModal = document.getElementById("marketModal")!;
        this.marketModalBackdrop = document.getElementById("marketModalBackdrop")!;
        this.marketModalClose = document.getElementById("marketModalClose")!;
        this.marketName = document.getElementById("marketName") as HTMLInputElement;
        this.saveMarket = document.getElementById("saveMarket")!;

        // Menu modal elements
        this.menuModal = document.getElementById("menuModal")!;
        this.menuModalBackdrop = document.getElementById("menuModalBackdrop")!;
        this.menuModalClose = document.getElementById("menuModalClose")!;
        this.menuName = document.getElementById("menuName") as HTMLInputElement;
        this.saveMenu = document.getElementById("saveMenu")!;

        // Menu view modal elements
        this.menuViewModal = document.getElementById("menuViewModal")!;
        this.menuViewBackdrop = document.getElementById("menuViewBackdrop")!;
        this.menuViewBack = document.getElementById("menuViewBack")!;
        this.menuViewTitle = document.getElementById("menuViewTitle")!;

        // Market view modal elements
        this.marketViewModal = document.getElementById("marketViewModal")!;
        this.marketViewBackdrop = document.getElementById("marketViewBackdrop")!;
        this.marketViewBack = document.getElementById("marketViewBack")!;
        this.marketViewTitle = document.getElementById("marketViewTitle")!;
        this.tablesList = document.getElementById("tablesList")!;

        // Table view modal elements
        this.tableViewModal = document.getElementById("tableViewModal")!;
        this.tableViewBackdrop = document.getElementById("tableViewBackdrop")!;
        this.tableViewBack = document.getElementById("tableViewBack")!;
        this.tableViewTitle = document.getElementById("tableViewTitle")!;

        this.initEventListeners();
        this.loadNetworks();

        // Initialize dropdowns
        new Dropdown("MenuButton", "MenuDropdown");
        new Dropdown("MarketsButton", "MarketsDropdown");
        new Dropdown("TablesButton", "TablesDropdown");

        document.getElementById("AddMarketButton")?.addEventListener("click", () => this.openMarketModal());
        document.getElementById("AddMenuButton")?.addEventListener("click", () => this.openMenuModal());
        document.getElementById("AddTableButton")?.addEventListener("click", () => this.handleAddTable());
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

        // Menu modal
        this.menuModalClose.addEventListener("click", () => this.closeMenuModal());
        this.menuModalBackdrop.addEventListener("click", () => this.closeMenuModal());
        this.saveMenu.addEventListener("click", () => this.handleSaveMenu());

        // Menu view modal
        this.menuViewBack.addEventListener("click", () => this.backToNetworkViewFromMenu());
        this.menuViewBackdrop.addEventListener("click", () => this.closeMenuViewModal());

        // Market view modal
        this.marketViewBack.addEventListener("click", () => this.backToNetworkView());
        this.marketViewBackdrop.addEventListener("click", () => this.closeMarketViewModal());

        // Table view modal
        this.tableViewBack.addEventListener("click", () => this.backToMarketView());
        this.tableViewBackdrop.addEventListener("click", () => this.closeTableViewModal());
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
        this.menusList.innerHTML = "";

        // Загружаем актуальные маркеты с сервера
        const marketsResponse = await MerchantAPI.getMarkets(network.id);
        if (marketsResponse.success && marketsResponse.data) {
            marketsResponse.data.forEach(market => {
                const li = document.createElement("li");
                li.className = "flex items-center gap-2 px-2 py-1 text-white hover:bg-crypto-border hover:scale-105 transition-all duration-200 rounded cursor-pointer";

                const dot = document.createElement("span");
                dot.className = "w-1.5 h-1.5 bg-white rounded-full flex-shrink-0";

                const text = document.createElement("span");
                text.textContent = market.name;

                li.appendChild(dot);
                li.appendChild(text);
                li.addEventListener("click", () => this.openMarketViewModal(market));
                this.marketsList.appendChild(li);
            });
        }

        // Загружаем актуальные меню с сервера
        const menusResponse = await MerchantAPI.getMenus(network.id);
        if (menusResponse.success && menusResponse.data) {
            menusResponse.data.forEach(menu => {
                const li = document.createElement("li");
                li.className = "flex items-center gap-2 px-2 py-1 text-white hover:bg-crypto-border hover:scale-105 transition-all duration-200 rounded cursor-pointer";

                const dot = document.createElement("span");
                dot.className = "w-1.5 h-1.5 bg-white rounded-full flex-shrink-0";

                const text = document.createElement("span");
                text.textContent = menu.name;

                li.appendChild(dot);
                li.appendChild(text);
                li.addEventListener("click", () => this.openMenuViewModal(menu));
                this.menusList.appendChild(li);
            });
        }

        this.showViewModal();

        // ДОБАВЬ ЭТУ СТРОКУ: Добавляем кнопку удаления после показа модала
        this.addDeleteButton(this.networkViewModal, () => this.handleDelete('network', network.id, () => this.closeViewModal()));
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
        this.removeDeleteButtons();
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

    /** ---------------- Menu Modal ---------------- */
    private openMenuModal(): void {
        if (!this.currentNetworkId) return;
        if (!isAuthenticated()) {
            alert('Please connect your wallet first');
            return;
        }
        this.menuName.value = "";
        this.menuModal.classList.remove("hidden");
        this.menuModal.classList.add("flex");
    }

    private closeMenuModal(): void {
        this.menuModal.classList.add("hidden");
        this.menuModal.classList.remove("flex");
    }

    /** ---------------- Menu View Modal ---------------- */
    private openMenuViewModal(menu: Menu): void {
        this.currentMenuId = menu.id;
        this.menuViewTitle.textContent = menu.name;
        this.networkViewModal.classList.add("hidden");
        this.menuViewModal.classList.remove("hidden");

        document.body.style.overflow = "hidden";

        // ДОБАВЬ ЭТУ СТРОКУ: Добавляем кнопку удаления после показа модала
        this.addDeleteButton(this.menuViewModal, () => this.handleDelete('menu', menu.id, () => this.backToNetworkViewFromMenu()));
    }

    private closeMenuViewModal(): void {
        this.menuViewModal.classList.add("hidden");
        document.body.style.overflow = "auto";
        this.currentMenuId = null;
        this.removeDeleteButtons();
    }

    private backToNetworkViewFromMenu(): void {
        this.menuViewModal.classList.add("hidden");
        this.networkViewModal.classList.remove("hidden");
        this.currentMenuId = null;
        this.removeDeleteButtons();

        // ДОБАВЬ ЭТИ СТРОКИ: Восстанавливаем кнопку удаления для network
        if (this.currentNetworkId) {
            const network = this.networks.find(n => n.id === this.currentNetworkId);
            if (network) {
                this.addDeleteButton(this.networkViewModal, () => this.handleDelete('network', network.id, () => this.closeViewModal()));
            }
        }
    }

    /** ---------------- Market View Modal ---------------- */
    private openMarketViewModal(market: Market): void {
        this.currentMarketId = market.id;
        this.marketViewTitle.textContent = market.name;
        this.loadTablesForMarket(market);
        this.networkViewModal.classList.add("hidden");
        this.marketViewModal.classList.remove("hidden");

        document.body.style.overflow = "hidden";

        this.addDeleteButton(this.marketViewModal, () => this.handleDelete('market', market.id, () => this.backToNetworkView()));
    }

    private async loadTablesForMarket(market: Market): Promise<void> {
        this.tablesList.innerHTML = "";
        const response = await MerchantAPI.getTables(market.id);
        if (response.success && response.data) {
            response.data.forEach(table => {
                const li = document.createElement("li");
                li.className = "flex items-center gap-2 px-2 py-1 text-white hover:bg-crypto-border hover:scale-105 transition-all duration-200 rounded cursor-pointer";

                const dot = document.createElement("span");
                dot.className = "w-1.5 h-1.5 bg-white rounded-full flex-shrink-0";

                const text = document.createElement("span");
                text.textContent = `Table ${table.number}`;

                li.appendChild(dot);
                li.appendChild(text);
                li.addEventListener("click", () => this.openTableViewModal(table));
                this.tablesList.appendChild(li);
            });
        }
    }

    private closeMarketViewModal(): void {
        this.marketViewModal.classList.add("hidden");
        document.body.style.overflow = "auto";
        this.currentMarketId = null;
        this.removeDeleteButtons();
    }

    private backToNetworkView(): void {
        this.marketViewModal.classList.add("hidden");
        this.networkViewModal.classList.remove("hidden");
        this.currentMarketId = null;
        this.removeDeleteButtons();

        if (this.currentNetworkId) {
            const network = this.networks.find(n => n.id === this.currentNetworkId);
            if (network) {
                this.addDeleteButton(this.networkViewModal, () => this.handleDelete('network', network.id, () => this.closeViewModal()));
            }
        }
    }

    /** ---------------- Table View Modal ---------------- */
    private openTableViewModal(table: Table): void {
        this.currentTableId = table.id;
        this.tableViewTitle.textContent = `Table ${table.number}`;
        this.marketViewModal.classList.add("hidden");
        this.tableViewModal.classList.remove("hidden");

        document.body.style.overflow = "hidden";

        // ДОБАВЬ ЭТУ СТРОКУ: Добавляем кнопку удаления после показа модала
        this.addDeleteButton(this.tableViewModal, () => this.handleDelete('table', table.id, () => this.backToMarketView()));
    }

    private closeTableViewModal(): void {
        this.tableViewModal.classList.add("hidden");
        document.body.style.overflow = "auto";
        this.currentTableId = null;
        this.removeDeleteButtons();
    }

    private backToMarketView(): void {
        this.tableViewModal.classList.add("hidden");
        this.marketViewModal.classList.remove("hidden");
        this.currentTableId = null;
        this.removeDeleteButtons();

        // ДОБАВЬ ЭТИ СТРОКИ: Восстанавливаем кнопку удаления для market
        if (this.currentMarketId) {
            const market = { id: this.currentMarketId, name: this.marketViewTitle.textContent || '', createdAt: '' };
            this.addDeleteButton(this.marketViewModal, () => this.handleDelete('market', market.id, () => this.backToNetworkView()));
        }
    }

    /** ---------------- НОВОЕ: МИНИМАЛЬНАЯ DELETE ЛОГИКА (10 строк) ---------------- */

    private addDeleteButton(modal: HTMLElement, onClick: () => void): void {
        this.removeDeleteButtons();

        // Находим внутренний блок с контентом (где p-4 sm:p-6 lg:p-8)
        const contentBlock = modal.querySelector('.p-4, .sm\\:p-6, .lg\\:p-8') as HTMLElement ||
            modal.querySelector('[class*="p-"]') as HTMLElement;

        if (!contentBlock) {
            console.warn('Content block not found for delete button');
            return;
        }

        // Делаем контентный блок относительным для позиционирования
        contentBlock.style.position = 'relative';

        const btn = document.createElement("button");
        btn.className = "delete-btn absolute bottom-4 right-4 w-10 h-10 bg-crypto-card border border-red-600 rounded-lg flex items-center justify-center hover:bg-crypto-border transition z-10";
        btn.innerHTML = `<svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>`;
        btn.onclick = onClick;

        // Добавляем кнопку в контентный блок, а не в сам модал
        contentBlock.appendChild(btn);
    }

    private removeDeleteButtons(): void { document.querySelectorAll('.delete-btn').forEach(b => b.remove()); }

    private async handleDelete(type: string, id: number, onSuccess: () => void): Promise<void> {
        if (!confirm('Delete this item?')) return;
        const res = await MerchantAPI.delete(type, id);
        if (res.success) { onSuccess(); await this.loadNetworks(); } else alert(res.error || 'Delete failed');
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

        const response = await MerchantAPI.createNetwork(name, description);
        if (response.success && response.data) {
            await this.loadNetworks();
            this.closeCreateModal();
        } else {
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

        const response = await MerchantAPI.createMarket(this.currentNetworkId, name);
        if (response.success) {
            this.closeMarketModal();
            const network = this.networks.find(n => n.id === this.currentNetworkId);
            if (network) {
                await this.openViewModal(network);
            }
        } else {
            alert(response.error || 'Failed to create market');
        }
    }

    private async handleSaveMenu(): Promise<void> {
        const name = this.menuName.value.trim();
        if (!name || !this.currentNetworkId) return;

        if (!isAuthenticated()) {
            alert('Please connect your wallet first');
            return;
        }

        const response = await MerchantAPI.createMenu(this.currentNetworkId, name);
        if (response.success) {
            this.closeMenuModal();
            const network = this.networks.find(n => n.id === this.currentNetworkId);
            if (network) {
                await this.openViewModal(network);
            }
        } else {
            alert(response.error || 'Failed to create menu');
        }
    }

    private async handleAddTable(): Promise<void> {
        if (!this.currentMarketId) return;

        if (!isAuthenticated()) {
            alert('Please connect your wallet first');
            return;
        }

        const response = await MerchantAPI.createTable(this.currentMarketId);
        if (response.success) {
            const market = { id: this.currentMarketId, name: this.marketViewTitle.textContent || '', createdAt: '' };
            await this.loadTablesForMarket(market);
        } else {
            alert(response.error || 'Failed to create table');
        }
    }

    private async loadNetworks(): Promise<void> {
        if (!isAuthenticated()) {
            this.networks = [];
            this.renderNetworks();
            return;
        }

        const response = await MerchantAPI.getNetworks();
        if (response.success && response.data) {
            this.networks = response.data;
        } else {
            this.networks = [];
        }
        this.renderNetworks();
    }
}

/** ---------------- Init ---------------- */
document.addEventListener("DOMContentLoaded", () => {
    new MerchantNetworks();
});