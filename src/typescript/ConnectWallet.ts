import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { GlowWalletAdapter } from "@solana/wallet-adapter-glow";
import { BackpackWalletAdapter } from "@solana/wallet-adapter-backpack";

type WalletType = "phantom" | "solflare" | "glow" | "backpack";

const walletButtonDesktop = document.getElementById("walletButtonDesktop") as HTMLButtonElement;
const walletButtonMobile = document.getElementById("walletButtonMobile") as HTMLButtonElement;
const walletModal = document.getElementById("walletModal") as HTMLDivElement;
const walletModalClose = document.getElementById("walletModalClose") as HTMLButtonElement;
const walletListButtons = document.querySelectorAll<HTMLButtonElement>("#walletList button[data-wallet]");

const solanaAdapters: Record<WalletType, any> = {
    phantom: new PhantomWalletAdapter(),
    solflare: new SolflareWalletAdapter(),
    glow: new GlowWalletAdapter(),
    backpack: new BackpackWalletAdapter()
};

// Функция для проверки установлен ли кошелек
function isWalletInstalled(walletType: WalletType): boolean {
    switch(walletType) {
        case 'phantom':
            return !!(window as any).phantom?.solana;
        case 'solflare':
            return !!(window as any).solflare || !!(window as any).solana?.isSolflare;
        case 'glow':
            return !!(window as any).glow || !!(window as any).glowSolana;
        case 'backpack':
            return !!(window as any).backpack || !!(window as any).solana?.isBackpack;
        default:
            return false;
    }
}

let connectedWalletType: WalletType | null = null;
let arrowIcon: SVGElement | null = null;
let walletDropdown: HTMLDivElement | null = null;

function shortenAddress(addr: string) {
    return addr.slice(0, 4) + "..." + addr.slice(-4);
}

function updateWalletButton(address: string) {
    const shortAddr = shortenAddress(address);
    walletButtonDesktop.innerHTML = `
        ${shortAddr}
        <svg id="walletArrow" class="w-5 h-5 ml-2 transition-transform duration-200" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
            <path d="M6 9l6 6 6-6"/>
        </svg>
    `;
    walletButtonMobile.textContent = `${shortAddr} ▼`;
    arrowIcon = document.getElementById("walletArrow") as SVGElement;
}

function setArrow(up: boolean) {
    if (!arrowIcon) return;
    arrowIcon.style.transform = up ? "rotate(180deg)" : "rotate(0deg)";
}

async function connectWallet(type: WalletType) {
    const adapter = solanaAdapters[type];
    await adapter.connect({ onlyIfTrusted: false });
    const publicKey = adapter.publicKey;
    if (publicKey) {
        connectedWalletType = type;
        localStorage.setItem("connectedWalletType", type);
        localStorage.setItem("connectedWalletAddress", publicKey.toBase58());
        updateWalletButton(publicKey.toBase58());
        closeModal();
    }
}

function disconnectWallet() {
    if (!connectedWalletType) return;
    const adapter = solanaAdapters[connectedWalletType];
    if (adapter.disconnect) adapter.disconnect();

    connectedWalletType = null;
    localStorage.removeItem("connectedWalletType");
    localStorage.removeItem("connectedWalletAddress");

    walletButtonDesktop.textContent = "Connect Wallet";
    walletButtonMobile.textContent = "Connect Wallet";
    setArrow(false);
    hideDropdown();
}

function openModal() {
    walletModal.classList.remove("hidden");
    walletModal.classList.add("flex");
}

function closeModal() {
    walletModal.classList.add("hidden");
    walletModal.classList.remove("flex");
}

// === Проверка при загрузке и установка статуса Installed ===
window.addEventListener("load", async () => {
    const savedType = localStorage.getItem("connectedWalletType") as WalletType;
    const savedAddress = localStorage.getItem("connectedWalletAddress");

    // Проверка и установка статуса "Installed" для каждого кошелька
    document.querySelectorAll<HTMLButtonElement>("#walletModal button[data-wallet]").forEach(btn => {
        const walletType = btn.getAttribute("data-wallet") as WalletType;
        const statusSpan = btn.querySelector<HTMLSpanElement>(".wallet-status");

        if (statusSpan) {
            const isInstalled = isWalletInstalled(walletType);

            if (isInstalled) {
                statusSpan.textContent = "Installed";
                statusSpan.classList.remove("bg-crypto-border", "text-gray-300");
                statusSpan.classList.add("bg-green-600/20", "text-green-400", "border", "border-green-600/30");
            } else {
                statusSpan.textContent = "";
                // Скрываем пустой элемент полностью
                statusSpan.style.display = "none";
            }
        }
    });

    if (savedType && savedAddress) {
        const adapter = solanaAdapters[savedType];
        try {
            await adapter.connect({ onlyIfTrusted: true });
            if (adapter.connected && adapter.publicKey) {
                connectedWalletType = savedType;
                updateWalletButton(adapter.publicKey.toBase58());
            } else {
                disconnectWallet();
            }
        } catch {
            disconnectWallet();
        }
    }
});

// === Модалки ===
walletButtonMobile.addEventListener("click", () => {
    if (!connectedWalletType) openModal();
});
walletModalClose?.addEventListener("click", closeModal);

walletListButtons.forEach(btn => {
    btn.addEventListener("click", async (e) => {
        const walletType = (e.currentTarget as HTMLButtonElement).getAttribute("data-wallet") as WalletType;
        if (!walletType) return;
        await connectWallet(walletType);
    });
});

// === Создаём дропдаун под кнопкой ===
if (walletButtonDesktop) {
    walletDropdown = document.createElement("div");
    walletDropdown.id = "walletDropdown";
    walletDropdown.className =
        "absolute bg-crypto-card border border-crypto-border rounded-lg w-44 hidden shadow-lg z-50 overflow-hidden transition-all duration-200 opacity-0 pointer-events-none";

    walletDropdown.innerHTML = `
        <button id="logoutButton" class="w-full text-left px-4 py-2 text-red-500 font-medium hover:bg-crypto-border transition flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M17 16l4-4m0 0l-4-4m4 4H7"/>
            </svg>
            Logout
        </button>
    `;

    document.body.appendChild(walletDropdown);

    const positionDropdown = () => {
        if (!walletDropdown) return;
        const rect = walletButtonDesktop.getBoundingClientRect();
        walletDropdown.style.top = rect.bottom + window.scrollY + "px";
        walletDropdown.style.left = rect.left + window.scrollX + "px";
    };

    const showDropdown = () => {
        if (!walletDropdown) return;
        positionDropdown();
        walletDropdown.classList.remove("hidden", "opacity-0", "pointer-events-none");
        setArrow(true);
    };

    const hideDropdown = () => {
        if (!walletDropdown) return;
        walletDropdown.classList.add("opacity-0", "pointer-events-none");
        setArrow(false);
        setTimeout(() => walletDropdown?.classList.add("hidden"), 200);
    };

    const logoutBtn = walletDropdown.querySelector<HTMLButtonElement>("#logoutButton");
    logoutBtn?.addEventListener("click", () => {
        disconnectWallet();
        hideDropdown();
    });

    // Ховер/клик логика
    let hoverTimer: number | null = null;
    const enter = () => {
        if (!connectedWalletType) return;
        if (hoverTimer) clearTimeout(hoverTimer);
        showDropdown();
    };
    const leave = () => {
        if (hoverTimer) clearTimeout(hoverTimer);
        hoverTimer = window.setTimeout(() => {
            if (!walletDropdown?.matches(":hover") && !walletButtonDesktop.matches(":hover")) {
                hideDropdown();
            }
        }, 150);
    };

    walletButtonDesktop.addEventListener("mouseenter", enter);
    walletDropdown.addEventListener("mouseenter", enter);
    walletButtonDesktop.addEventListener("mouseleave", leave);
    walletDropdown.addEventListener("mouseleave", leave);

    walletButtonDesktop.addEventListener("click", () => {
        if (!connectedWalletType) openModal();
    });
}