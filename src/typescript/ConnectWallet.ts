// src/typescript/ConnectWallet.ts

function formatAddress(address: string): string {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

async function connectWallet(): Promise<string | null> {
    try {
        // @ts-ignore
        if (window.solana && window.solana.isPhantom) {
            // @ts-ignore
            const response = await window.solana.connect();
            return response.publicKey.toString();
        }

        // @ts-ignore
        if (window.solflare) {
            // @ts-ignore
            const response = await window.solflare.connect();
            return response.publicKey.toString();
        }

        alert('Install Phantom or Solflare wallet');
        return null;
    } catch (err: any) {
        console.error('Wallet error:', err);
        return null;
    }
}

async function disconnectWallet(): Promise<void> {
    try {
        // @ts-ignore
        if (window.solana) await window.solana.disconnect();
        // @ts-ignore
        if (window.solflare) await window.solflare.disconnect();
        localStorage.removeItem('walletAddress');
    } catch (err) {
        console.error('Disconnect error:', err);
    }
}

function setupButton(buttonId: string, dropdownId: string, logoutId: string): void {
    const button = document.getElementById(buttonId);
    const dropdown = document.getElementById(dropdownId);
    const logoutBtn = document.getElementById(logoutId);

    if (!button) return;

    let connected = localStorage.getItem('walletAddress');

    if (connected) {
        button.innerHTML = `${formatAddress(connected)} ▼`;
    }

    button.addEventListener('click', async () => {
        if (!connected) {
            const address = await connectWallet();
            if (address) {
                connected = address;
                localStorage.setItem('walletAddress', address);
                button.innerHTML = `${formatAddress(address)} ▼`;
            }
        } else {
            if (dropdown) dropdown.classList.toggle('hidden');
        }
    });

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await disconnectWallet();
            connected = null;
            button.textContent = "Connect Wallet";
            if (dropdown) dropdown.classList.add('hidden');
        });
    }
}

function init(): void {
    setTimeout(() => {
        setupButton("walletButtonMobile", "walletDropdownMobile", "logoutButtonMobile");
        setupButton("walletButtonDesktop", "walletDropdownDesktop", "logoutButtonDesktop");
    }, 500);
}

// @ts-ignore
window.initWallet = init;

document.addEventListener('DOMContentLoaded', init);