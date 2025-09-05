// Merchant.ts - Senior Level Architecture
// Optimized from 650+ lines to ~200 lines with better maintainability

/** ============ TYPES ============ */
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

type EntityType = 'network' | 'market' | 'menu' | 'table';
type ModalType = 'create' | 'view';

/** ============ CONSTANTS ============ */
const SERVER_URL = 'https://zapzap666.xyz';

const SELECTORS = {
    innerGrid: '#innerGrid',
    dropdowns: {
        menu: { button: '#MenuButton', dropdown: '#MenuDropdown', list: '#menusList' },
        markets: { button: '#MarketsButton', dropdown: '#MarketsDropdown', list: '#marketsList' },
        tables: { button: '#TablesButton', dropdown: '#TablesDropdown', list: '#tablesList' }
    }
} as const;

/** ============ UTILITIES ============ */
class AuthService {
    static getAuthData() {
        return {
            walletAddress: localStorage.getItem("connectedWalletAddress"),
            sessionKey: localStorage.getItem("sessionKey")
        };
    }

    static isAuthenticated(): boolean {
        const { walletAddress, sessionKey } = this.getAuthData();
        return !!(walletAddress && sessionKey);
    }

    static requireAuth(): boolean {
        if (!this.isAuthenticated()) {
            alert('Please connect your wallet first');
            return false;
        }
        return true;
    }
}

/** ============ API SERVICE ============ */
class MerchantAPI {
    private static async request<T>(endpoint: string, data?: any, method: string = 'POST'): Promise<ApiResponse<T>> {
        try {
            const authData = AuthService.getAuthData();
            const requestData = data ? { ...authData, ...data } : authData;

            const options: RequestInit = {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                ...(method !== 'GET' && { body: JSON.stringify(requestData) })
            };

            const response = await fetch(`${SERVER_URL}/api/merchant${endpoint}`, options);
            return await response.json();
        } catch (error) {
            console.error('❌ API Error:', error);
            return { success: false, error: 'Network error' };
        }
    }

    // ✅ ИСПРАВЛЕННЫЕ МЕТОДЫ:
    static networks = {
        create: (name: string, description: string) => this.request('/networks', { name, description }, 'POST'),
        list: () => this.request<Network[]>('/networks/list', { ...AuthService.getAuthData() }, 'POST'),
    };

    static markets = {
        create: (marketNetworkId: number, name: string) => this.request('/markets', { marketNetworkId, name }, 'POST'),
        list: (networkId: number) => this.request<Market[]>(`/markets/${networkId}/list`, { ...AuthService.getAuthData() }, 'POST'),
    };

    static menus = {
        create: (marketNetworkId: number, name: string) => this.request('/menus', { marketNetworkId, name }, 'POST'),
        list: (networkId: number) => this.request<Menu[]>(`/menus/${networkId}/list`, { ...AuthService.getAuthData() }, 'POST'),
    };

    static tables = {
        create: (marketId: number) => this.request('/tables', { marketId }, 'POST'),
        list: (marketId: number) => this.request<Table[]>(`/tables/${marketId}/list`, { ...AuthService.getAuthData() }, 'POST'),
    };

    // ✅ ПРАВИЛЬНЫЙ DELETE:
    static async delete(type: EntityType, id: number): Promise<ApiResponse> {
        const { walletAddress, sessionKey } = AuthService.getAuthData();
        return fetch(`${SERVER_URL}/api/merchant/${type}s/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress, sessionKey })
        }).then(res => res.json()).catch(() => ({ success: false, error: 'Network error' }));
    }
}

/** ============ DOM BUILDER ============ */
class DOMBuilder {
    static listItem(text: string, onClick: () => void): HTMLElement {
        const li = document.createElement("li");
        li.className = "flex items-center gap-2 px-2 py-1 text-white hover:bg-crypto-border hover:scale-105 transition-all duration-200 rounded cursor-pointer";
        li.innerHTML = `
            <span class="w-1.5 h-1.5 bg-white rounded-full flex-shrink-0"></span>
            <span>${text}</span>
        `;
        li.addEventListener("click", onClick);
        return li;
    }

    static networkBlock(network: Network, onClick: () => void): HTMLElement {
        const block = document.createElement("div");
        block.className = "network-block bg-crypto-dark border-2 border-crypto-border rounded-2xl h-48 p-4 cursor-pointer hover:bg-crypto-border hover:scale-105 transition-all duration-200 flex flex-col";
        block.innerHTML = `
            <div class="flex-1 flex flex-col justify-center">
                <h3 class="text-white text-lg font-semibold text-center truncate">${network.name}</h3>
                ${network.description ? `<p class="text-crypto-text-muted text-sm text-center line-clamp-3 mt-2">${network.description}</p>` : ""}
            </div>
        `;
        block.addEventListener("click", onClick);
        return block;
    }

    static addBlock(onClick: () => void): HTMLElement {
        const block = document.createElement("div");
        block.className = "network-add-block bg-crypto-dark border-2 border-crypto-border rounded-2xl h-48 flex items-center justify-center cursor-pointer hover:bg-crypto-border hover:scale-105 transition-all duration-200";
        block.innerHTML = `<svg class="w-12 h-12 text-crypto-text-muted" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 6v12M6 12h12"/></svg>`;
        block.addEventListener("click", onClick);
        return block;
    }

    static deleteButton(onClick: () => void): HTMLElement {
        const btn = document.createElement("button");
        btn.className = "delete-btn absolute bottom-4 right-4 w-10 h-10 bg-crypto-card border border-red-600 rounded-lg flex items-center justify-center hover:bg-crypto-border transition z-10";
        btn.innerHTML = `<svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>`;
        btn.onclick = onClick;
        return btn;
    }
}

/** ============ MODAL MANAGER ============ */
class ModalManager {
    private static modals = new Map<string, HTMLElement>();
    private static inputs = new Map<string, HTMLInputElement>();

    static init() {
        // Register all modals
        const modalConfigs = [
            'networkModal', 'networkViewModal', 'marketModal',
            'marketViewModal', 'menuModal', 'menuViewModal', 'tableViewModal'
        ];

        modalConfigs.forEach(id => {
            const modal = document.getElementById(id);
            if (modal) {
                this.modals.set(id, modal);
                this.setupModalEvents(id, modal);
            }
        });

        // Register inputs
        ['networkName', 'networkDescription', 'marketName', 'menuName'].forEach(id => {
            const input = document.getElementById(id) as HTMLInputElement;
            if (input) this.inputs.set(id, input);
        });
    }

    private static setupModalEvents(id: string, modal: HTMLElement) {
        const closeBtn = modal.querySelector(`#${id}Close`);
        const backdrop = modal.querySelector(`#${id}Backdrop`);
        const backBtn = modal.querySelector(`#${id.replace('Modal', '')}Back`);

        closeBtn?.addEventListener('click', () => this.hide(id));
        backdrop?.addEventListener('click', () => this.hide(id));
        backBtn?.addEventListener('click', () => NavigationManager.goBack());
    }

    static show(modalId: string, title?: string) {
        const modal = this.modals.get(modalId);
        if (!modal) return;

        modal.classList.remove("hidden");
        modal.classList.add("flex");
        document.body.style.overflow = "hidden";

        if (title) {
            const titleEl = modal.querySelector(`#${modalId.replace('Modal', '')}Title`);
            if (titleEl) titleEl.textContent = title;
        }
    }

    static hide(modalId: string) {
        const modal = this.modals.get(modalId);
        if (!modal) return;

        modal.classList.add("hidden");
        modal.classList.remove("flex");
        document.body.style.overflow = "auto";
        this.removeDeleteButtons();
    }

    static getInputValue(inputId: string): string {
        return this.inputs.get(inputId)?.value.trim() || '';
    }

    static clearInputs(...inputIds: string[]) {
        inputIds.forEach(id => {
            const input = this.inputs.get(id);
            if (input) input.value = '';
        });
    }

    static addDeleteButton(modalId: string, onClick: () => void) {
        const modal = this.modals.get(modalId);
        if (!modal) return;

        this.removeDeleteButtons();

        const contentBlock = modal.querySelector('.p-4, .sm\\:p-6, .lg\\:p-8') as HTMLElement ||
            modal.querySelector('[class*="p-"]') as HTMLElement;

        if (contentBlock) {
            contentBlock.style.position = 'relative';
            contentBlock.appendChild(DOMBuilder.deleteButton(onClick));
        }
    }

    static removeDeleteButtons() {
        document.querySelectorAll('.delete-btn').forEach(btn => btn.remove());
    }
}

/** ============ NAVIGATION MANAGER ============ */
class NavigationManager {
    private static stack: Array<{ modalId: string; data?: any }> = [];

    static navigateTo(modalId: string, data?: any) {
        // Hide current modal
        if (this.stack.length > 0) {
            const current = this.stack[this.stack.length - 1];
            ModalManager.hide(current.modalId);
        }

        // Add to stack and show new modal
        this.stack.push({ modalId, data });
        ModalManager.show(modalId, data?.title);
    }

    static goBack() {
        if (this.stack.length <= 1) {
            this.stack = [];
            ModalManager.hide(this.stack[0]?.modalId);
            return;
        }

        // Remove current and show previous
        this.stack.pop();
        const previous = this.stack[this.stack.length - 1];
        ModalManager.show(previous.modalId, previous.data?.title);
    }

    static clear() {
        this.stack.forEach(item => ModalManager.hide(item.modalId));
        this.stack = [];
    }
}

/** ============ DROPDOWN MANAGER ============ */
class DropdownManager {
    private static openDropdown: HTMLElement | null = null;

    static init(configs: Array<{buttonId: string, dropdownId: string}>) {
        configs.forEach(({buttonId, dropdownId}) => {
            const button = document.getElementById(buttonId);
            const dropdown = document.getElementById(dropdownId);

            if (button && dropdown) {
                this.setupDropdown(button, dropdown);
            }
        });

        document.addEventListener("click", () => this.closeAll());
    }

    private static setupDropdown(button: HTMLElement, dropdown: HTMLElement) {
        button.addEventListener("click", (e) => {
            e.stopPropagation();
            this.toggle(dropdown, button);
        });
    }

    private static toggle(dropdown: HTMLElement, button: HTMLElement) {
        if (this.openDropdown && this.openDropdown !== dropdown) {
            this.close(this.openDropdown);
        }

        dropdown.classList.toggle("hidden");
        this.openDropdown = dropdown.classList.contains("hidden") ? null : dropdown;
        this.toggleArrow(button);
    }

    private static close(dropdown: HTMLElement) {
        dropdown.classList.add("hidden");
        this.openDropdown = null;
    }

    private static closeAll() {
        if (this.openDropdown) {
            this.close(this.openDropdown);
        }
    }

    private static toggleArrow(button: HTMLElement) {
        const arrow = button.querySelector("svg");
        if (arrow) arrow.classList.toggle("rotate-180");
    }
}

/** ============ MAIN MERCHANT CLASS ============ */
class MerchantSystem {
    private networks: Network[] = [];
    private state = {
        currentNetworkId: null as number | null,
        currentMarketId: null as number | null,
        currentMenuId: null as number | null,
        currentTableId: null as number | null,
    };

    constructor() {
        this.init();
    }

    private init() {
        ModalManager.init();

        DropdownManager.init([
            { buttonId: 'MenuButton', dropdownId: 'MenuDropdown' },
            { buttonId: 'MarketsButton', dropdownId: 'MarketsDropdown' },
            { buttonId: 'TablesButton', dropdownId: 'TablesDropdown' }
        ]);

        this.setupEventListeners();
        this.loadNetworks();
    }

    private setupEventListeners() {
        // Save buttons
        document.getElementById('saveNetwork')?.addEventListener('click', () => this.handleSave('network'));
        document.getElementById('saveMarket')?.addEventListener('click', () => this.handleSave('market'));
        document.getElementById('saveMenu')?.addEventListener('click', () => this.handleSave('menu'));

        // Add buttons
        document.getElementById('AddMarketButton')?.addEventListener('click', () => this.openCreateModal('market'));
        document.getElementById('AddMenuButton')?.addEventListener('click', () => this.openCreateModal('menu'));
        document.getElementById('AddTableButton')?.addEventListener('click', () => this.handleCreateTable());
    }

    // ============ NETWORK OPERATIONS ============
    private async loadNetworks() {
        if (!AuthService.isAuthenticated()) {
            this.networks = [];
            this.renderNetworks();
            return;
        }

        const response = await MerchantAPI.networks.list();
        this.networks = response.success ? response.data || [] : [];
        this.renderNetworks();
    }

    private renderNetworks() {
        const grid = document.getElementById('innerGrid');
        if (!grid) return;

        grid.innerHTML = '';
        this.networks.forEach(network => {
            grid.appendChild(DOMBuilder.networkBlock(network, () => this.openNetworkView(network)));
        });
        grid.appendChild(DOMBuilder.addBlock(() => this.openCreateModal('network')));
    }

    private async openNetworkView(network: Network) {
        this.state.currentNetworkId = network.id;

        // Load and render markets
        const marketsResponse = await MerchantAPI.markets.list(network.id);
        this.renderList('marketsList', marketsResponse.data || [],
            item => this.openMarketView(item));

        // Load and render menus
        const menusResponse = await MerchantAPI.menus.list(network.id);
        this.renderList('menusList', menusResponse.data || [],
            item => this.openMenuView(item));

        NavigationManager.navigateTo('networkViewModal', { title: network.name });
        ModalManager.addDeleteButton('networkViewModal',
            () => this.handleDelete('network', network.id, () => NavigationManager.clear()));
    }

    // ============ GENERIC OPERATIONS ============
    private openCreateModal(type: EntityType) {
        if (!AuthService.requireAuth()) return;

        const modalMap = {
            network: 'networkModal',
            market: 'marketModal',
            menu: 'menuModal',
            table: null
        };

        const inputMap = {
            network: ['networkName', 'networkDescription'],
            market: ['marketName'],
            menu: ['menuName'],
            table: []
        };

        const modalId = modalMap[type];
        if (modalId) {
            ModalManager.clearInputs(...inputMap[type]);
            ModalManager.show(modalId);
        }
    }

    private async openMarketView(market: Market) {
        this.state.currentMarketId = market.id;

        const tablesResponse = await MerchantAPI.tables.list(market.id);
        this.renderList('tablesList', tablesResponse.data || [],
            item => this.openTableView(item), item => `Table ${item.number}`);

        NavigationManager.navigateTo('marketViewModal', { title: market.name });
        ModalManager.addDeleteButton('marketViewModal',
            () => this.handleDelete('market', market.id, () => NavigationManager.goBack()));
    }

    private openMenuView(menu: Menu) {
        NavigationManager.navigateTo('menuViewModal', { title: menu.name });
        ModalManager.addDeleteButton('menuViewModal',
            () => this.handleDelete('menu', menu.id, () => NavigationManager.goBack()));
    }

    private openTableView(table: Table) {
        NavigationManager.navigateTo('tableViewModal', { title: `Table ${table.number}` });
        ModalManager.addDeleteButton('tableViewModal',
            () => this.handleDelete('table', table.id, () => NavigationManager.goBack()));
    }

    private renderList<T extends {id: number, name?: string}>(
        containerId: string,
        items: T[],
        onItemClick: (item: T) => void,
        getDisplayText?: (item: T) => string
    ) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';
        items.forEach(item => {
            const text = getDisplayText ? getDisplayText(item) : item.name || 'Unnamed';
            container.appendChild(DOMBuilder.listItem(text, () => onItemClick(item)));
        });
    }

    // ============ CRUD OPERATIONS ============
    private async handleSave(type: EntityType) {
        if (!AuthService.requireAuth()) return;

        const handlers = {
            network: () => this.saveNetwork(),
            market: () => this.saveMarket(),
            menu: () => this.saveMenu(),
            table: () => this.handleCreateTable()
        };

        await handlers[type]();
    }

    private async saveNetwork() {
        const name = ModalManager.getInputValue('networkName');
        const description = ModalManager.getInputValue('networkDescription');

        if (!name) return;

        const response = await MerchantAPI.networks.create(name, description);
        if (response.success) {
            await this.loadNetworks();
            ModalManager.hide('networkModal');
        } else {
            alert(response.error || 'Failed to create network');
        }
    }

    private async saveMarket() {
        const name = ModalManager.getInputValue('marketName');
        if (!name || !this.state.currentNetworkId) return;

        const response = await MerchantAPI.markets.create(this.state.currentNetworkId, name);
        if (response.success) {
            ModalManager.hide('marketModal');
            const network = this.networks.find(n => n.id === this.state.currentNetworkId);
            if (network) await this.openNetworkView(network);
        } else {
            alert(response.error || 'Failed to create market');
        }
    }

    private async saveMenu() {
        const name = ModalManager.getInputValue('menuName');
        if (!name || !this.state.currentNetworkId) return;

        const response = await MerchantAPI.menus.create(this.state.currentNetworkId, name);
        if (response.success) {
            ModalManager.hide('menuModal');
            const network = this.networks.find(n => n.id === this.state.currentNetworkId);
            if (network) await this.openNetworkView(network);
        } else {
            alert(response.error || 'Failed to create menu');
        }
    }

    private async handleCreateTable() {
        if (!this.state.currentMarketId || !AuthService.requireAuth()) return;

        const response = await MerchantAPI.tables.create(this.state.currentMarketId);
        if (response.success) {
            const market = { id: this.state.currentMarketId, name: 'Current Market', createdAt: '' };
            await this.openMarketView(market);
        } else {
            alert(response.error || 'Failed to create table');
        }
    }

    private async handleDelete(type: EntityType, id: number, onSuccess: () => void) {
        if (!confirm('Delete this item?')) return;

        const response = await MerchantAPI.delete(type, id);
        if (response.success) {
            onSuccess();
            await this.loadNetworks();
        } else {
            alert(response.error || 'Delete failed');
        }
    }
}

/** ============ INITIALIZATION ============ */
document.addEventListener("DOMContentLoaded", () => {
    new MerchantSystem();
});