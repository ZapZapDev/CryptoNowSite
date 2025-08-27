//ConnectWallet.ts
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { GlowWalletAdapter } from "@solana/wallet-adapter-glow";
import { BackpackWalletAdapter } from "@solana/wallet-adapter-backpack";

type WalletType = "phantom" | "solflare" | "glow" | "backpack";

const SERVER_URL = 'https://zapzap666.xyz';

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
let currentSessionKey: string | null = null;

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

}

function setArrow(up: boolean) {
    if (!arrowIcon) return;
    arrowIcon.style.transform = up ? "rotate(180deg)" : "rotate(0deg)";
}

// Серверная аутентификация
async function loginToServer(walletAddress: string): Promise<string | null> {
    try {
        console.log('🔐 Logging in to server:', walletAddress.slice(0, 8) + '...');

        const response = await fetch(`${SERVER_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress })
        });

        const data = await response.json();

        console.log('📥 Server response:', {
            success: data.success,
            hasSessionKey: !!data.sessionKey,
            sessionKeyPreview: data.sessionKey?.slice(0, 8) + '...',
            error: data.error
        });

        if (data.success && data.sessionKey) {
            console.log('✅ Server login successful');
            return data.sessionKey;
        } else {
            console.error('❌ Server login failed:', data.error || 'No session key received');
            return null;
        }
    } catch (error) {
        console.error('❌ Server login error:', error);
        return null;
    }
}

async function validateServerSession(walletAddress: string, sessionKey: string): Promise<boolean> {
    try {
        console.log('🔍 Validating server session');
        console.log('🔑 Session key:', sessionKey?.slice(0, 8) + '...');

        const response = await fetch(`${SERVER_URL}/api/auth/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress, sessionKey })
        });

        const data = await response.json();

        console.log('📥 Validation response:', {
            success: data.success,
            reason: data.reason
        });

        return data.success;
    } catch (error) {
        console.error('❌ Session validation error:', error);
        return false;
    }
}

async function logoutFromServer(walletAddress: string) {
    try {
        await fetch(`${SERVER_URL}/api/auth/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ walletAddress })
        });
        console.log('🚪 Server logout successful');
    } catch (error) {
        console.error('❌ Server logout error:', error);
    }
}

async function connectWallet(type: WalletType) {
    const adapter = solanaAdapters[type];
    await adapter.connect({ onlyIfTrusted: false });
    const publicKey = adapter.publicKey;

    if (publicKey) {
        const walletAddress = publicKey.toBase58();

        // Логинимся на сервер
        const sessionKey = await loginToServer(walletAddress);

        if (sessionKey) {
            connectedWalletType = type;
            currentSessionKey = sessionKey;

            // Сохраняем в localStorage для авто-подключения
            localStorage.setItem("connectedWalletType", type);
            localStorage.setItem("connectedWalletAddress", walletAddress);
            localStorage.setItem("sessionKey", sessionKey);

            updateWalletButton(walletAddress);
            closeModal();

            console.log('✅ Wallet connected and authenticated');
        } else {
            alert('Failed to authenticate with server');
        }
    }
}

function disconnectWallet() {
    if (!connectedWalletType) return;

    const adapter = solanaAdapters[connectedWalletType];
    const walletAddress = localStorage.getItem("connectedWalletAddress");

    if (adapter.disconnect) adapter.disconnect();

    // Логаут с сервера
    if (walletAddress) {
        logoutFromServer(walletAddress);
    }

    connectedWalletType = null;
    currentSessionKey = null;

    localStorage.removeItem("connectedWalletType");
    localStorage.removeItem("connectedWalletAddress");
    localStorage.removeItem("sessionKey");

    walletButtonDesktop.textContent = "Connect Wallet";
    walletButtonMobile.textContent = "Connect Wallet";
    setArrow(false);
    hideDropdown();

    console.log('🚪 Wallet disconnected');
}

function openModal() {
    walletModal.classList.remove("hidden");
    walletModal.classList.add("flex");
}

function closeModal() {
    walletModal.classList.add("hidden");
    walletModal.classList.remove("flex");
}

// === Проверка при загрузке и автоподключение ===
window.addEventListener("load", async () => {
    const savedType = localStorage.getItem("connectedWalletType") as WalletType;
    const savedAddress = localStorage.getItem("connectedWalletAddress");
    const savedSessionKey = localStorage.getItem("sessionKey");

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
                statusSpan.style.display = "none";
            }
        }
    });

    // Автоподключение
    if (savedType && savedAddress && savedSessionKey) {
        console.log('🔄 Attempting auto-reconnect...');

        // Валидируем сессию на сервере
        const isValidSession = await validateServerSession(savedAddress, savedSessionKey);

        if (isValidSession) {
            const adapter = solanaAdapters[savedType];
            try {
                await adapter.connect({ onlyIfTrusted: true });
                if (adapter.connected && adapter.publicKey) {
                    connectedWalletType = savedType;
                    currentSessionKey = savedSessionKey;
                    updateWalletButton(adapter.publicKey.toBase58());
                    console.log('✅ Auto-reconnect successful');
                } else {
                    disconnectWallet();
                }
            } catch {
                disconnectWallet();
            }
        } else {
            console.log('❌ Session invalid, clearing local storage');
            disconnectWallet();
        }
    }
});

// === Остальные event listeners (без изменений) ===
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