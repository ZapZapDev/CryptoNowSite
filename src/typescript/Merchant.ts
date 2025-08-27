//Merchant.ts
interface Market {
    id: string;
    name: string;
    createdAt: Date;
}

interface Network {
    id: string;
    name: string;
    description: string;
    createdAt: Date;
    markets?: Market[];
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
    private cancelNetwork: HTMLElement;

    // Network View Modal
    private networkViewModal: HTMLElement;
    private networkViewBackdrop: HTMLElement;
    private networkViewBack: HTMLElement;
    private networkViewTitle: HTMLElement;
    private marketsList: HTMLElement;
    private currentNetworkId: string | null = null;

    // Market Modal
    private marketModal: HTMLElement;
    private marketModalBackdrop: HTMLElement;
    private marketModalClose: HTMLElement;
    private marketName: HTMLInputElement;
    private saveMarket: HTMLElement;
    private cancelMarket: HTMLElement;

    constructor() {
        this.innerGrid = document.getElementById("innerGrid")!;

        // Network modal
        this.networkModal = document.getElementById("networkModal")!;
        this.networkModalBackdrop = document.getElementById("networkModalBackdrop")!;
        this.networkModalClose = document.getElementById("networkModalClose")!;
        this.networkName = document.getElementById("networkName") as HTMLInputElement;
        this.networkDescription = document.getElementById("networkDescription") as HTMLTextAreaElement;
        this.saveNetwork = document.getElementById("saveNetwork")!;
        this.cancelNetwork = document.getElementById("cancelNetwork")!;

        // Network view modal
        this.networkViewModal = document.getElementById("networkViewModal")!;
        this.networkViewBackdrop = document.getElementById("networkViewBackdrop")!;
        this.networkViewBack = document.getElementById("networkViewBack")!;
        this.networkViewTitle = document.getElementById("networkViewTitle")!;
        this.marketsList = document.getElementById("marketsList")!;

        // Market modal
        this.marketModal = document.getElementById("marketModal")!;
        this.marketModalBackdrop = document.getElementById("marketModalBackdrop")!;
        this.marketModalClose = document.getElementById("marketModalClose")!;
        this.marketName = document.getElementById("marketName") as HTMLInputElement;
        this.saveMarket = document.getElementById("saveMarket")!;
        this.cancelMarket = document.getElementById("cancelMarket")!;

        this.initEventListeners();
        this.loadNetworks();

        // Дропдауны
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

    /** ---------------- Utils ---------------- */
    private generateId(prefix: string): string {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /** ---------------- Network Logic ---------------- */
    private createAddBlock(): HTMLElement {
        const block = document.createElement("div");
        block.className = "network-add-block bg-crypto-dark border-2 border-crypto-border rounded-2xl h-48 flex items-center justify-center cursor-pointer hover:bg-crypto-border hover:scale-105 transition-all duration-200";
        block.innerHTML = `<svg class="w-12 h-12 text-crypto-text-muted" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 6v12M6 12h12"/></svg>`;
        block.addEventListener("click", () => this.openCreateModal());
        return block;
    }

    private createNetworkBlock(network: Network): HTMLElement {
        const block = document.createElement("div");
        block.className = "network-block bg-crypto-dark border-2 border-crypto-border rounded-2xl h-48 p-4 cursor-pointer hover:bg-crypto-border hover:scale-105 transition-all duration-200 flex flex-col";
        block.innerHTML = `
            <div class="flex-1 flex flex-col justify-center">
                <h3 class="text-white text-lg font-semibold text-center truncate">${network.name || "Network"}</h3>
                ${network.description.trim() ? `<p class="text-crypto-text-muted text-sm text-center line-clamp-3 mt-2">${network.description}</p>` : ""}
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

    private openViewModal(network: Network): void {
        this.currentNetworkId = network.id;
        this.networkViewTitle.textContent = network.name;

        this.marketsList.innerHTML = "";

        (network.markets || []).forEach(market => {
            const li = document.createElement("li");
            li.className = `
            flex items-center gap-2 px-2 py-1 text-white hover:bg-crypto-border hover:scale-105
            transition-all duration-200 rounded
        `;

            // точка слева
            const dot = document.createElement("span");
            dot.className = "w-1.5 h-1.5 bg-white rounded-full flex-shrink-0";

            const text = document.createElement("span");
            text.textContent = market.name;

            li.appendChild(dot);
            li.appendChild(text);

            this.marketsList.appendChild(li);
        });

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
        this.marketName.value = "";
        this.marketModal.classList.remove("hidden");
        this.marketModal.classList.add("flex");
    }

    private closeMarketModal(): void {
        this.marketModal.classList.add("hidden");
        this.marketModal.classList.remove("flex");
    }

    /** ---------------- CRUD ---------------- */
    private handleSaveNetwork(): void {
        const name = this.networkName.value.trim();
        const description = this.networkDescription.value.trim();

        if (!name) {
            this.networkName.focus();
            return;
        }

        this.networks.push({ id: this.generateId("network"), name, description, createdAt: new Date(), markets: [] });
        this.saveNetworks();
        this.renderNetworks();
        this.closeCreateModal();
    }

    private handleSaveMarket(): void {
        const name = this.marketName.value.trim();
        if (!name || !this.currentNetworkId) return;

        const network = this.networks.find(n => n.id === this.currentNetworkId);
        if (network) {
            if (!network.markets) network.markets = [];
            network.markets.push({ id: this.generateId("market"), name, createdAt: new Date() });
        }

        this.saveNetworks();
        this.closeMarketModal();
        if (network) this.openViewModal(network); // обновим список маркетов
    }

    private saveNetworks(): void {
        try { localStorage.setItem("cryptonow_networks", JSON.stringify(this.networks)); }
        catch (err) { console.error("Failed to save networks:", err); }
    }

    private loadNetworks(): void {
        try {
            const saved = localStorage.getItem("cryptonow_networks");
            if (saved) {
                this.networks = JSON.parse(saved).map((n: any) => ({
                    ...n,
                    createdAt: new Date(n.createdAt),
                    markets: (n.markets || []).map((m: any) => ({ ...m, createdAt: new Date(m.createdAt) }))
                }));
            }
        } catch (err) {
            console.error("Failed to load networks:", err);
            this.networks = [];
        }
        this.renderNetworks();
    }
}

/** ---------------- Init ---------------- */
document.addEventListener("DOMContentLoaded", () => {
    new MerchantNetworks();
});
