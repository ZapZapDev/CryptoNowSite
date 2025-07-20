interface Transaction {
    id: string;
    wallet: string;
    type: 'sent' | 'received';
    amount: number;
    token: string;
    address: string;
    timestamp: string;
}

interface GroupedTransactions {
    [date: string]: Transaction[];
}

class TransactionHistory {
    private apiUrl = 'http://localhost:3001/api';

    async loadTransactions(): Promise<void> {
        const wallet = localStorage.getItem('walletAddress');
        if (!wallet) {
            alert('No wallet found');
            return;
        }

        try {
            // First create mock transactions if none exist
            await this.createMockTransactions(wallet);

            const response = await fetch(`${this.apiUrl}/transaction/list?wallet=${wallet}`);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error);
            }

            this.renderTransactions(data.data.transactions);
        } catch (error) {
            console.error('Failed to load transactions:', error);
            alert('Failed to load transactions');
        }
    }

    async createMockTransactions(wallet: string): Promise<void> {
        try {
            await fetch(`${this.apiUrl}/transaction/mock`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ wallet })
            });
        } catch (error) {
            console.error('Failed to create mock transactions:', error);
        }
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
        if (address.length < 8) return address;
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    }

    private getTokenIcon(token: string): string {
        switch (token.toLowerCase()) {
            case 'sol':
                return 'bg-gradient-to-br from-sol-gradient-from to-sol-gradient-to';
            case 'usdc':
                return 'bg-gradient-to-br from-usdc-gradient-from to-usdc-gradient-to';
            case 'pol':
                return 'bg-gradient-to-br from-purple-500 to-purple-700';
            default:
                return 'bg-crypto-border';
        }
    }

    private renderTransactions(transactions: Transaction[]): void {
        const container = document.querySelector('.transaction-container');
        if (!container) return;

        const grouped = this.groupTransactionsByDate(transactions);

        let html = '';
        Object.entries(grouped).forEach(([date, txs]) => {
            html += `
                <div class="mb-6">
                    <h3 class="text-crypto-text-muted text-sm font-medium mb-3 px-1">${date}</h3>
                    <div class="space-y-1">
                        ${txs.map(tx => `
                            <div class="bg-crypto-card border border-crypto-border rounded-xl p-4 flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full ${this.getTokenIcon(tx.token)} flex-shrink-0"></div>
                                <div class="flex-1 min-w-0">
                                    <div class="text-white font-semibold text-sm">
                                        ${tx.type === 'received' ? 'Received' : 'Sent'}
                                    </div>
                                    <div class="text-crypto-text-muted text-xs">
                                        ${tx.type === 'received' ? 'From' : 'To'}: ${this.formatAddress(tx.address)}
                                    </div>
                                </div>
                                <div class="text-right">
                                    <div class="text-sm font-semibold ${tx.type === 'received' ? 'text-green-400' : 'text-red-400'}">
                                        ${tx.type === 'received' ? '+' : '-'}${tx.amount} ${tx.token}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }
}

// Initialize when DOM loads
window.addEventListener('DOMContentLoaded', () => {
    const transactionHistory = new TransactionHistory();
    transactionHistory.loadTransactions();
});