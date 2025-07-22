interface Transaction {
    id: string;
    wallet: string;
    type: 'sent' | 'received';
    amount: string;
    token: string;
    address: string;
    timestamp: string;
    signature?: string;
}

interface GroupedTransactions {
    [date: string]: Transaction[];
}

interface PaginationInfo {
    page: number;
    limit: number;
    hasMore: boolean;
    totalFetched: number;
}

class TransactionHistory {
    private apiUrl = 'http://localhost:3001/api';
    private transactions: Transaction[] = [];
    private currentPage = 1;
    private isLoading = false;
    private hasMore = true;
    private limit = 10;

    async loadTransactions(): Promise<void> {
        const wallet = localStorage.getItem('walletAddress');
        console.log(`=== FRONTEND DEBUG ===`);
        console.log(`Wallet from localStorage: ${wallet}`);

        if (!wallet) {
            this.showError('No wallet found in localStorage');
            return;
        }

        // Первоначальная загрузка
        this.showInitialLoading();
        await this.fetchTransactions(wallet, 1);
        this.setupInfiniteScroll(wallet);
    }

    private async fetchTransactions(wallet: string, page: number): Promise<void> {
        if (this.isLoading || !this.hasMore) return;

        this.isLoading = true;

        try {
            console.log(`Fetching page ${page}...`);

            if (page > 1) {
                this.showPageLoading();
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            const response = await fetch(
                `${this.apiUrl}/transaction/list?wallet=${wallet}&page=${page}&limit=${this.limit}`,
                {
                    signal: controller.signal,
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                }
            );

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`Page ${page} response:`, data);

            if (!data.success) {
                throw new Error(data.error || 'Unknown server error');
            }

            // Добавляем новые транзакции к существующим
            const newTransactions = data.data.transactions;

            if (page === 1) {
                this.transactions = newTransactions;
            } else {
                // Фильтруем дубликаты
                const existingIds = new Set(this.transactions.map(tx => tx.id));
                const uniqueNewTransactions = newTransactions.filter(tx => !existingIds.has(tx.id));
                this.transactions.push(...uniqueNewTransactions);
            }

            this.hasMore = data.data.pagination.hasMore;
            this.currentPage = page;

            console.log(`Total transactions loaded: ${this.transactions.length}, hasMore: ${this.hasMore}`);

            this.renderAllTransactions();
            this.hideLoading();

        } catch (error) {
            console.error('Failed to load transactions:', error);
            this.isLoading = false;

            if (page === 1) {
                if (error.name === 'AbortError') {
                    this.showError('Request timeout - please try again');
                } else if (error.message.includes('Failed to fetch')) {
                    this.showError('Cannot connect to server. Make sure the server is running on http://localhost:3001');
                } else {
                    this.showError(`Failed to load transactions: ${error.message}`);
                }
            } else {
                // Для ошибок при загрузке следующих страниц показываем уведомление
                this.showLoadMoreError();
            }
        }

        this.isLoading = false;
    }

    private setupInfiniteScroll(wallet: string): void {
        let ticking = false;

        const checkScroll = () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;

            // Загружаем следующую страницу когда остается 200px до конца
            const threshold = documentHeight - windowHeight - 200;

            if (scrollTop > threshold && this.hasMore && !this.isLoading) {
                console.log('Loading next page...');
                this.fetchTransactions(wallet, this.currentPage + 1);
            }

            ticking = false;
        };

        const onScroll = () => {
            if (!ticking) {
                requestAnimationFrame(checkScroll);
                ticking = true;
            }
        };

        window.addEventListener('scroll', onScroll, { passive: true });
    }

    private showInitialLoading(): void {
        const container = document.querySelector('.transaction-container');
        if (!container) return;

        container.innerHTML = `
            <div class="flex items-center justify-center py-20">
                <div class="text-crypto-text-muted text-center">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-crypto-text-muted mx-auto mb-4"></div>
                    <p class="text-sm">Loading transactions...</p>
                </div>
            </div>
        `;
    }

    private showPageLoading(): void {
        const container = document.querySelector('.transaction-container');
        if (!container) return;

        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'page-loading';
        loadingDiv.className = 'flex items-center justify-center py-6';
        loadingDiv.innerHTML = `
            <div class="text-crypto-text-muted text-center flex items-center gap-3">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-crypto-text-muted"></div>
                <p class="text-sm">Loading more...</p>
            </div>
        `;

        container.appendChild(loadingDiv);
    }

    private hideLoading(): void {
        const loadingElement = document.getElementById('page-loading');
        if (loadingElement) {
            loadingElement.remove();
        }
    }

    private showLoadMoreError(): void {
        const container = document.querySelector('.transaction-container');
        if (!container) return;

        const errorDiv = document.createElement('div');
        errorDiv.id = 'load-more-error';
        errorDiv.className = 'flex items-center justify-center py-6';
        errorDiv.innerHTML = `
            <div class="text-center">
                <p class="text-red-400 text-sm mb-3">Failed to load more transactions</p>
                <button 
                    onclick="this.parentElement.parentElement.remove(); window.transactionHistory.retryLoadMore()" 
                    class="bg-crypto-card border-2 border-crypto-border rounded-lg px-4 py-2 text-white text-sm hover:bg-crypto-border transition-colors"
                >
                    Retry
                </button>
            </div>
        `;

        container.appendChild(errorDiv);
    }

    public retryLoadMore(): void {
        const wallet = localStorage.getItem('walletAddress');
        if (wallet) {
            this.fetchTransactions(wallet, this.currentPage + 1);
        }
    }

    private showError(message: string): void {
        const container = document.querySelector('.transaction-container');
        if (!container) return;

        container.innerHTML = `
            <div class="flex items-center justify-center py-20">
                <div class="text-center">
                    <div class="text-red-400 mb-4">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-auto">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="15" y1="9" x2="9" y2="15"></line>
                            <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                    </div>
                    <p class="text-red-400 text-sm mb-4">${message}</p>
                    <button 
                        onclick="window.location.reload()" 
                        class="bg-crypto-card border-2 border-crypto-border rounded-lg px-4 py-2 text-white text-sm hover:bg-crypto-border transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        `;
    }

    private showEmpty(): void {
        const container = document.querySelector('.transaction-container');
        if (!container) return;

        container.innerHTML = `
            <div class="flex items-center justify-center py-20">
                <div class="text-crypto-text-muted text-center">
                    <div class="mb-4">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-auto">
                            <path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6"></path>
                            <path d="M2 7h20l-2-4H4l-2 4z"></path>
                            <path d="M10 12v6"></path>
                            <path d="M14 12v6"></path>
                        </svg>
                    </div>
                    <p class="text-sm">No transactions found</p>
                    <p class="text-xs mt-2">Make some transactions to see them here</p>
                </div>
            </div>
        `;
    }

    private groupTransactionsByDate(transactions: Transaction[]): GroupedTransactions {
        const grouped: GroupedTransactions = {};
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        transactions.forEach(tx => {
            const txDate = new Date(tx.timestamp);
            let dateKey: string;

            if (this.isSameDay(txDate, today)) {
                dateKey = 'Today';
            } else if (this.isSameDay(txDate, yesterday)) {
                dateKey = 'Yesterday';
            } else {
                dateKey = txDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                });
            }

            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(tx);
        });

        return grouped;
    }

    private isSameDay(date1: Date, date2: Date): boolean {
        return date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear();
    }

    private formatAddress(address: string): string {
        if (!address || address.length < 8) return address;
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    }

    private getTokenIcon(token: string): string {
        switch (token.toUpperCase()) {
            case 'SOL':
                return 'bg-gradient-to-br from-sol-gradient-from to-sol-gradient-to';
            case 'USDC':
                return 'bg-gradient-to-br from-usdc-gradient-from to-usdc-gradient-to';
            case 'USDT':
                return 'bg-gradient-to-br from-green-500 to-green-700';
            case 'BONK':
                return 'bg-gradient-to-br from-orange-500 to-orange-700';
            case 'MSOL':
                return 'bg-gradient-to-br from-blue-500 to-blue-700';
            case 'TOKEN':
                return 'bg-gradient-to-br from-gray-500 to-gray-700';
            default:
                return 'bg-crypto-border';
        }
    }

    private formatAmount(amount: string): string {
        const num = parseFloat(amount);
        if (num === 0) return '0';
        if (num < 0.001) {
            return num.toExponential(2);
        }
        if (num < 1) {
            return num.toFixed(6).replace(/\.?0+$/, '');
        }
        if (num < 1000) {
            return num.toFixed(3).replace(/\.?0+$/, '');
        }
        return num.toFixed(2);
    }

    private formatTime(timestamp: string): string {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }

    private renderAllTransactions(): void {
        const container = document.querySelector('.transaction-container');
        if (!container) return;

        if (this.transactions.length === 0) {
            this.showEmpty();
            return;
        }

        const grouped = this.groupTransactionsByDate(this.transactions);

        let html = '';
        Object.entries(grouped).forEach(([date, txs]) => {
            html += `
                <div class="mb-6">
                    <h3 class="text-crypto-text-muted text-sm font-medium mb-3 px-1">${date}</h3>
                    <div class="space-y-2">
                        ${txs.map(tx => `
                            <div class="bg-crypto-card border border-crypto-border rounded-xl p-4 hover:bg-crypto-border transition-colors cursor-pointer"
                                 ${tx.signature ? `onclick="window.open('https://solscan.io/tx/${tx.signature}', '_blank')"` : ''}>
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-full ${this.getTokenIcon(tx.token)} flex-shrink-0 flex items-center justify-center">
                                        <span class="text-white text-xs font-bold">${tx.token.charAt(0)}</span>
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <div class="flex items-center justify-between">
                                            <div class="text-white font-semibold text-sm">
                                                ${tx.type === 'received' ? 'Received' : 'Sent'} ${tx.token}
                                            </div>
                                            <div class="text-xs text-crypto-text-muted">
                                                ${this.formatTime(tx.timestamp)}
                                            </div>
                                        </div>
                                        <div class="text-crypto-text-muted text-xs mt-1">
                                            ${tx.type === 'received' ? 'From' : 'To'}: ${this.formatAddress(tx.address)}
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-sm font-semibold ${tx.type === 'received' ? 'text-green-400' : 'text-red-400'}">
                                            ${tx.type === 'received' ? '+' : '-'}${this.formatAmount(tx.amount)}
                                        </div>
                                    </div>
                                </div>
                                ${tx.signature ? `
                                    <div class="mt-2 pt-2 border-t border-crypto-border">
                                        <div class="text-xs text-crypto-text-muted">
                                            Click to view on Solscan
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });

        // Добавляем индикатор окончания если больше нет данных
        if (!this.hasMore) {
            html += `
                <div class="flex items-center justify-center py-8">
                    <div class="text-crypto-text-muted text-center">
                        <div class="w-12 h-px bg-crypto-border mx-auto mb-3"></div>
                        <p class="text-xs">All transactions loaded</p>
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
    }
}

// Глобальная переменная для доступа к методам
let transactionHistory: TransactionHistory;

// Initialize when DOM loads
window.addEventListener('DOMContentLoaded', () => {
    transactionHistory = new TransactionHistory();
    (window as any).transactionHistory = transactionHistory; // Для доступа из onclick
    transactionHistory.loadTransactions();
});