interface Network {
    id: string;
    name: string;
    description: string;
    createdAt: Date;
}

class MerchantNetworks {
    private networks: Network[] = [];
    private innerGrid: HTMLElement;
    private networkModal: HTMLElement;
    private networkModalBackdrop: HTMLElement;
    private networkModalClose: HTMLElement;
    private networkName: HTMLInputElement;
    private networkDescription: HTMLTextAreaElement;
    private saveNetwork: HTMLElement;
    private cancelNetwork: HTMLElement;
    private networkViewModal: HTMLElement;
    private networkViewBackdrop: HTMLElement;
    private networkViewBack: HTMLElement;
    private networkViewTitle: HTMLElement;
    private currentEditingId: string | null = null;

    constructor() {
        this.innerGrid = document.getElementById('innerGrid')!;
        this.networkModal = document.getElementById('networkModal')!;
        this.networkModalBackdrop = document.getElementById('networkModalBackdrop')!;
        this.networkModalClose = document.getElementById('networkModalClose')!;
        this.networkName = document.getElementById('networkName') as HTMLInputElement;
        this.networkDescription = document.getElementById('networkDescription') as HTMLTextAreaElement;
        this.saveNetwork = document.getElementById('saveNetwork')!;
        this.cancelNetwork = document.getElementById('cancelNetwork')!;
        this.networkViewModal = document.getElementById('networkViewModal')!;
        this.networkViewBackdrop = document.getElementById('networkViewBackdrop')!;
        this.networkViewBack = document.getElementById('networkViewBack')!;
        this.networkViewTitle = document.getElementById('networkViewTitle')!;

        this.initEventListeners();
        this.loadNetworks();
    }

    private initEventListeners(): void {
        this.networkModalClose.addEventListener('click', () => this.closeCreateModal());
        this.networkModalBackdrop.addEventListener('click', () => this.closeCreateModal());
        this.cancelNetwork.addEventListener('click', () => this.closeCreateModal());
        this.saveNetwork.addEventListener('click', () => this.handleSaveNetwork());

        this.networkViewBack.addEventListener('click', () => this.closeViewModal());
        this.networkViewBackdrop.addEventListener('click', () => this.closeViewModal());

        this.networkName.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSaveNetwork();
        });
    }

    private generateId(): string {
        return `network_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private createAddBlock(): HTMLElement {
        const addBlock = document.createElement('div');
        addBlock.className = 'network-add-block bg-crypto-dark border-2 border-crypto-border rounded-2xl h-48 flex items-center justify-center cursor-pointer hover:bg-crypto-border hover:scale-105 transition-all duration-200';

        addBlock.innerHTML = `
            <svg class="w-12 h-12 text-crypto-text-muted" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M12 6v12M6 12h12"/>
            </svg>
        `;

        addBlock.addEventListener('click', () => this.openCreateModal());
        return addBlock;
    }

    private createNetworkBlock(network: Network): HTMLElement {
        const networkBlock = document.createElement('div');
        networkBlock.className = 'network-block bg-crypto-dark border-2 border-crypto-border rounded-2xl h-48 p-4 cursor-pointer hover:bg-crypto-border hover:scale-105 transition-all duration-200 flex flex-col';

        const description = network.description.trim();

        networkBlock.innerHTML = `
            <div class="flex-1 flex flex-col justify-center">
                <h3 class="text-white text-lg font-semibold text-center truncate">${network.name || 'Network'}</h3>
                ${description ? `<p class="text-crypto-text-muted text-sm text-center line-clamp-3 mt-2">${description}</p>` : ''}
            </div>
        `;

        networkBlock.addEventListener('click', () => this.openViewModal(network));
        return networkBlock;
    }

    private renderNetworks(): void {
        this.innerGrid.innerHTML = '';

        this.networks.forEach(network => {
            this.innerGrid.appendChild(this.createNetworkBlock(network));
        });

        this.innerGrid.appendChild(this.createAddBlock());
    }

    private openCreateModal(): void {
        this.currentEditingId = null;
        this.networkName.value = '';
        this.networkDescription.value = '';
        this.showCreateModal();
        this.networkName.focus();
    }

    private openViewModal(network: Network): void {
        this.networkViewTitle.textContent = network.name;
        this.showViewModal();
    }

    private showCreateModal(): void {
        this.networkModal.classList.remove('hidden');
        this.networkModal.classList.add('flex');
        document.body.style.overflow = 'hidden';
    }

    private closeCreateModal(): void {
        this.networkModal.classList.add('hidden');
        this.networkModal.classList.remove('flex');
        document.body.style.overflow = 'auto';
        this.currentEditingId = null;
    }

    private showViewModal(): void {
        this.networkViewModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    private closeViewModal(): void {
        this.networkViewModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }

    private handleSaveNetwork(): void {
        const name = this.networkName.value.trim();
        const description = this.networkDescription.value.trim();

        if (!name) {
            this.networkName.focus();
            return;
        }

        if (this.currentEditingId) {
            const networkIndex = this.networks.findIndex(n => n.id === this.currentEditingId);
            if (networkIndex !== -1) {
                this.networks[networkIndex] = {
                    ...this.networks[networkIndex],
                    name,
                    description
                };
            }
        } else {
            const newNetwork: Network = {
                id: this.generateId(),
                name,
                description,
                createdAt: new Date()
            };
            this.networks.push(newNetwork);
        }

        this.saveNetworks();
        this.renderNetworks();
        this.closeCreateModal();
    }

    private saveNetworks(): void {
        try {
            localStorage.setItem('cryptonow_networks', JSON.stringify(this.networks));
        } catch (error) {
            console.error('Failed to save networks:', error);
        }
    }

    private loadNetworks(): void {
        try {
            const saved = localStorage.getItem('cryptonow_networks');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.networks = parsed.map((n: any) => ({
                    ...n,
                    createdAt: new Date(n.createdAt)
                }));
            }
        } catch (error) {
            console.error('Failed to load networks:', error);
            this.networks = [];
        }
        this.renderNetworks();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MerchantNetworks();
});