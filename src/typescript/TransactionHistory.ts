class TransactionHistory {
    private container: HTMLElement | null = null;

    constructor() {
        this.container = document.querySelector('.transaction-container');
    }

    async init(): Promise<void> {
        this.showDevelopmentMessage();
    }

    private showDevelopmentMessage(): void {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="flex items-center justify-center">
                <div class="text-center max-w-md">
                   
                   
                    <h1 class="text-4xl font-bold text-white mb-3">Wait!</h1>
                    <p class="text-crypto-text-muted text-sm mb-6">
                        This feature is currently under development. 
                        We're working hard to bring you comprehensive transaction tracking.
                    </p>
                    
                    <div class="bg-crypto-card border border-crypto-border rounded-xl p-4 mb-6">
                        <div class="flex items-center gap-3 mb-3">
                            <div class="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                            <span class="text-green-600 text-sm font-medium">Coming Soon</span>
                        </div>
                        <ul class="text-crypto-text-muted text-xs space-y-1 text-left">
                            <li>• View all your transactions</li>
                            <li>• Track SOL and SPL tokens</li>
                            <li>• Export transaction data</li>
                            <li>• Real-time updates</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TransactionHistory().init();
});