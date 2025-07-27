import { Buffer } from "buffer";
import BigNumber from "bignumber.js";
window.Buffer = Buffer;
(globalThis as any).Buffer = Buffer;

// Константы
const SERVER_URL = 'https://d660c79c0512.ngrok-free.app';
const FALLBACK_TIMEOUT = 10000; // 10 секунд на ответ сервера

// Основная функция генерации QR
async function generateQR(amountValue: string, coin: string): Promise<void> {
    const qrContainer = document.getElementById("qrcode") as HTMLDivElement;
    const paymentInfo = document.getElementById("paymentInfo") as HTMLDivElement;
    const publicKeyString = localStorage.getItem("walletAddress");

    if (!publicKeyString || !amountValue || isNaN(Number(amountValue)) || Number(amountValue) <= 0) {
        console.error("Invalid input:", { publicKeyString, amountValue });
        showError("Invalid wallet address or amount");
        return;
    }

    console.log("Generating QR for:", { amount: amountValue, coin, wallet: publicKeyString });

    // Показываем лоадер
    showLoader(qrContainer, paymentInfo);

    try {
        // Сначала пробуем через сервер с комиссией
        const serverSuccess = await generateServerQR(amountValue, coin, publicKeyString, paymentInfo, qrContainer);

        if (!serverSuccess) {
            // Фолбэк на локальную генерацию
            console.log("Fallback to local QR generation");
            await generateLocalQR(amountValue, coin, publicKeyString, paymentInfo, qrContainer);
        }
    } catch (error) {
        console.error("QR generation failed:", error);
        showError("Failed to generate QR code");
        return;
    }

    qrContainer.style.display = "flex";
    hideSelectors();
}

// Функция для показа лоадера
function showLoader(qrContainer: HTMLDivElement, paymentInfo: HTMLDivElement): void {
    paymentInfo.innerHTML = `
        <div class="text-crypto-text-muted text-sm">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-crypto-text-muted mx-auto mb-2"></div>
            Generating payment...
        </div>
    `;
    qrContainer.style.display = "flex";
}

// Функция для показа ошибки
function showError(message: string): void {
    const qrContainer = document.getElementById("qrcode") as HTMLDivElement;
    const paymentInfo = document.getElementById("paymentInfo") as HTMLDivElement;

    paymentInfo.innerHTML = `
        <div class="text-red-400 text-sm text-center">
            ⚠️ ${message}
        </div>
    `;
    qrContainer.style.display = "flex";
}

// Серверная генерация QR с комиссией
async function generateServerQR(
    amountValue: string,
    coin: string,
    publicKeyString: string,
    paymentInfo: HTMLDivElement,
    qrContainer: HTMLDivElement
): Promise<boolean> {
    try {
        console.log("Attempting server QR generation...");

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), FALLBACK_TIMEOUT);

        const response = await fetch(`${SERVER_URL}/api/payment/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                recipient: publicKeyString,
                amount: parseFloat(amountValue),
                token: coin,
                label: `Payment ${coin}`,
                message: `Payment of ${amountValue} ${coin} with 1 USDC fee`
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log("Server response status:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Server error response:", errorText);
            return false;
        }

        const data = await response.json();
        console.log("Server response data:", data);

        if (data.success && data.data && data.data.qr_code) {
            // Успешно получили QR от сервера
            paymentInfo.innerHTML = `
                <div class="text-center">
                    <div class="text-22 font-bold text-white mb-1 leading-tight">${amountValue} ${coin}</div>
                    <div class="text-xs text-green-400 font-normal uppercase tracking-crypto mt-1">+ 1 USDC Fee</div>
                    <div class="text-xs text-crypto-text-muted mt-1">Server Mode</div>
                </div>
            `;

            const existingQR = qrContainer.querySelector('.qr-code-wrapper');
            if (existingQR) existingQR.remove();

            const qrCodeWrapper = document.createElement('div');
            qrCodeWrapper.className = 'qr-code-wrapper';

            const qrImage = document.createElement('img');
            qrImage.src = data.data.qr_code;
            qrImage.alt = 'Payment QR Code';
            qrImage.style.maxWidth = '250px';
            qrImage.style.maxHeight = '250px';
            qrImage.onerror = () => {
                console.error("QR image failed to load");
                showError("QR code image failed to load");
            };

            qrCodeWrapper.appendChild(qrImage);
            qrContainer.appendChild(qrCodeWrapper);

            console.log('Server QR created successfully:', data.data.id);
            return true;
        } else {
            console.error('Invalid server response:', data);
            return false;
        }
    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.log('Server request timed out');
        } else {
            console.error('Server QR generation failed:', error);
        }
        return false;
    }
}

// Локальная генерация без комиссии (фолбэк)
async function generateLocalQR(
    amountValue: string,
    coin: string,
    publicKeyString: string,
    paymentInfo: HTMLDivElement,
    qrContainer: HTMLDivElement
): Promise<void> {
    try {
        console.log("Starting local QR generation...");

        const { encodeURL, createQR } = await import('@solana/pay');
        const { PublicKey } = await import('@solana/web3.js');

        const recipient = new PublicKey(publicKeyString);
        const amount = new BigNumber(amountValue);

        let urlParams: any = {
            recipient,
            amount,
            label: `Payment ${coin}`,
            message: "Payment via Solana Pay"
        };

        if (coin === "USDC") {
            urlParams.splToken = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
        } else if (coin === "USDT") {
            urlParams.splToken = new PublicKey('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB');
        }

        const url = encodeURL(urlParams);
        const qr = createQR(url, 250, 'transparent');

        paymentInfo.innerHTML = `
            <div class="text-center">
                <div class="text-22 font-bold text-white mb-1 leading-tight">${amountValue} ${coin}</div>
                <div class="text-xs text-yellow-400 font-normal uppercase tracking-crypto mt-1">Local Mode</div>
                <div class="text-xs text-crypto-text-muted mt-1">No Fee</div>
            </div>
        `;

        const existingQR = qrContainer.querySelector('.qr-code-wrapper');
        if (existingQR) existingQR.remove();

        const qrCodeWrapper = document.createElement('div');
        qrCodeWrapper.className = 'qr-code-wrapper';
        qr.append(qrCodeWrapper);
        qrContainer.appendChild(qrCodeWrapper);

        console.log('Local QR created successfully');
    } catch (error) {
        console.error('Local QR generation failed:', error);
        showError("Failed to generate local QR code");
        throw error;
    }
}

function hideSelectors(): void {
    const dropdown = document.querySelector(".dropdown") as HTMLDivElement;
    const coinSelector = document.getElementById("coinSelector") as HTMLDivElement;
    const amountSection = document.getElementById("amountSection") as HTMLDivElement;

    if (dropdown) dropdown.style.display = "none";
    if (coinSelector) coinSelector.style.display = "none";
    if (amountSection) amountSection.style.display = "none";
}

// Функция для тестирования подключения к серверу
async function testServerConnection(): Promise<boolean> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch(`${SERVER_URL}/`, {
            method: 'GET',
            headers: {
                'bypass-tunnel-reminder': 'true',
                'User-Agent': 'CryptoNow-App/1.0'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        const isConnected = response.ok;
        console.log(`Server connection test: ${isConnected ? 'SUCCESS' : 'FAILED'}`);
        return isConnected;
    } catch (error) {
        console.log('Server connection test: FAILED -', error);
        return false;
    }
}

window.addEventListener("DOMContentLoaded", async () => {
    console.log("TransactionSetup loaded");

    // Тестируем подключение к серверу при загрузке
    const serverAvailable = await testServerConnection();
    console.log(`Server available: ${serverAvailable}`);

    const dropdownBtn = document.getElementById("dropdownBtn") as HTMLButtonElement;
    const dropdownContent = document.getElementById("dropdownContent") as HTMLDivElement;
    const dropdownArrow = document.getElementById("dropdownArrow") as HTMLSpanElement;
    const dropdownItems = document.querySelectorAll(".dropdown-item") as NodeListOf<HTMLDivElement>;
    const qrContainer = document.getElementById("qrcode") as HTMLDivElement;
    const coinSelector = document.getElementById("coinSelector") as HTMLDivElement;
    const amountSection = document.getElementById("amountSection") as HTMLDivElement;
    const amountInput = document.getElementById("amountInput") as HTMLInputElement;
    const generateBtn = document.getElementById("generateBtn") as HTMLButtonElement;

    let selectedCoin = "SOL"; // Изменили дефолт на SOL
    qrContainer.style.display = "none";

    // Показываем статус сервера в интерфейсе
    if (!serverAvailable) {
        const statusIndicator = document.createElement('div');
        statusIndicator.innerHTML = `
            <div class="text-xs text-yellow-400 text-center mb-2">
                ⚠️ Server offline - local mode only
            </div>
        `;
        dropdownBtn.parentNode?.insertBefore(statusIndicator, dropdownBtn);
    }

    dropdownBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdownContent.classList.toggle("hidden");
        dropdownArrow.classList.toggle("dropdown-arrow-rotate");
    });

    dropdownItems.forEach(item => {
        item.addEventListener("click", () => {
            const selectedText = item.textContent || "";
            dropdownBtn.childNodes[0].textContent = selectedText;
            dropdownContent.classList.add("hidden");
            dropdownArrow.classList.remove("dropdown-arrow-rotate");

            coinSelector.style.display = "flex";
            coinSelector.classList.remove("hidden");
        });
    });

    const coinItems = document.querySelectorAll(".coin-item") as NodeListOf<HTMLDivElement>;
    coinItems.forEach(item => {
        item.addEventListener("click", () => {
            selectedCoin = item.getAttribute("data-coin") || "SOL";

            coinItems.forEach(coin => coin.classList.remove("text-white"));
            coinItems.forEach(coin => coin.classList.add("text-crypto-text-muted"));
            item.classList.remove("text-crypto-text-muted");
            item.classList.add("text-white");

            amountSection.style.display = "block";
            amountSection.classList.remove("hidden");
        });
    });

    generateBtn.addEventListener("click", async () => {
        const amountValue = amountInput.value.trim();

        if (!amountValue || isNaN(Number(amountValue)) || Number(amountValue) <= 0) {
            showError("Please enter a valid amount");
            return;
        }

        generateBtn.disabled = true;
        generateBtn.textContent = "Generating...";

        try {
            await generateQR(amountValue, selectedCoin);
        } finally {
            generateBtn.disabled = false;
            generateBtn.textContent = "Generate QR";
        }
    });

    // Обработка Enter в поле ввода
    amountInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            generateBtn.click();
        }
    });

    window.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        if (!target.closest('.dropdown')) {
            dropdownContent.classList.add("hidden");
            dropdownArrow.classList.remove("dropdown-arrow-rotate");
        }
    });
});