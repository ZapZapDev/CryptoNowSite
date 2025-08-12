import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

const network = WalletAdapterNetwork.Mainnet;

function formatAddress(address: string): string {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function setupWalletUI(
    buttonId: string,
    dropdownId: string,
    logoutId: string,
    wallet: PhantomWalletAdapter | SolflareWalletAdapter
) {
    const button = document.getElementById(buttonId) as HTMLButtonElement;
    const dropdown = document.getElementById(dropdownId) as HTMLDivElement;
    const logoutBtn = document.getElementById(logoutId) as HTMLButtonElement;

    let connectedAddress: string | null = null;

    button.addEventListener('click', async () => {
        if (!connectedAddress) {
            try {
                await wallet.connect();
                connectedAddress = wallet.publicKey?.toBase58() || null;

                if (connectedAddress) {
                    button.innerHTML = `${formatAddress(connectedAddress)}
                        <svg class="w-3 h-3 ml-1 inline" fill="none" stroke="white" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
                        </svg>`;
                }
            } catch (err) {
                console.error("Wallet connection failed:", err);
            }
        } else {
            dropdown.classList.toggle('hidden');
        }
    });

    logoutBtn.addEventListener('click', async () => {
        try {
            await wallet.disconnect();
        } catch {}
        connectedAddress = null;
        button.textContent = "Connect Wallet";
        dropdown.classList.add('hidden');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const phantom = new PhantomWalletAdapter();
    const solflare = new SolflareWalletAdapter({ network });

    // Пока ставим Phantom, можно заменить на Solflare
    setupWalletUI("walletButtonMobile", "walletDropdownMobile", "logoutButtonMobile", phantom);
    setupWalletUI("walletButtonDesktop", "walletDropdownDesktop", "logoutButtonDesktop", phantom);
});
