// src/typescript/ConnectWallet.ts
interface SolanaWallet {
    connect(): Promise<{ publicKey: { toString(): string } }>;
    disconnect(): Promise<void>;
    isConnected: boolean;
}

declare global {
    interface Window {
        solana?: SolanaWallet;
    }
}

function formatAddress(address: string): string {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function setupWallet(buttonId: string, dropdownId: string, logoutId: string) {
    const button = document.getElementById(buttonId) as HTMLButtonElement;
    const dropdown = document.getElementById(dropdownId) as HTMLDivElement;
    const logoutBtn = document.getElementById(logoutId) as HTMLButtonElement;

    if (!button) return;

    let connected = false;

    button.addEventListener('click', async () => {
        if (!connected) {
            try {
                if (window.solana) {
                    const resp = await window.solana.connect();
                    const address = resp.publicKey.toString();

                    localStorage.setItem('walletAddress', address);
                    button.textContent = formatAddress(address);
                    connected = true;
                } else {
                    alert('Install Phantom wallet');
                }
            } catch (err) {
                console.error('Connection failed:', err);
            }
        } else {
            if (dropdown) dropdown.classList.toggle('hidden');
        }
    });

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                if (window.solana) await window.solana.disconnect();
            } catch {}

            localStorage.removeItem('walletAddress');
            button.textContent = 'Connect Wallet';
            connected = false;
            if (dropdown) dropdown.classList.add('hidden');
        });
    }

    // Проверяем сохраненный адрес
    const saved = localStorage.getItem('walletAddress');
    if (saved && window.solana?.isConnected) {
        button.textContent = formatAddress(saved);
        connected = true;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        setupWallet('walletButtonMobile', 'walletDropdownMobile', 'logoutButtonMobile');
        setupWallet('walletButtonDesktop', 'walletDropdownDesktop', 'logoutButtonDesktop');
    }, 1000);
});