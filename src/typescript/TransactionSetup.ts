import { Buffer } from "buffer";
import BigNumber from "bignumber.js";
window.Buffer = Buffer;
(globalThis as any).Buffer = Buffer;

// Пробуем подключиться к серверу, если нет - локальная генерация
async function generateQR(amountValue: string, coin: string): Promise<void> {
    const qrContainer = document.getElementById("qrcode") as HTMLDivElement;
    const paymentInfo = document.getElementById("paymentInfo") as HTMLDivElement;
    const publicKeyString = localStorage.getItem("walletAddress");

    if (!publicKeyString || !amountValue || isNaN(Number(amountValue)) || Number(amountValue) <= 0) {
        return;
    }

    // Сначала пробуем через сервер с комиссией
    try {
        const response = await fetch('https://44ed40f8f282.ngrok-free.app/api/payment/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                recipient: publicKeyString,
                amount: parseFloat(amountValue),
                token: coin,
                label: `Payment ${coin}`,
                message: `Payment of ${amountValue} ${coin} with 1 USDC fee`
            })
        });

        const data = await response.json();

        if (data.success && data.data) {
            // Сервер работает - показываем QR с комиссией
            paymentInfo.innerHTML = `
                <div class="text-22 font-bold text-white mb-1 leading-tight">${amountValue} ${coin}</div>
                <div class="text-xs text-green-400 font-normal uppercase tracking-crypto mt-1">+ 1 USDC Fee</div>
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

            qrCodeWrapper.appendChild(qrImage);
            qrContainer.appendChild(qrCodeWrapper);

            console.log('QR с комиссией создан:', data.data.id);
        } else {
            throw new Error('Server error');
        }
    } catch (error) {
        // Сервер не работает - локальная генерация без комиссии
        console.log('Сервер недоступен, локальная генерация');
        await generateLocalQR(amountValue, coin, publicKeyString, paymentInfo, qrContainer);
    }

    qrContainer.style.display = "flex";
    hideSelectors();
}

// Локальная генерация без комиссии (фолбэк)
async function generateLocalQR(amountValue: string, coin: string, publicKeyString: string, paymentInfo: HTMLDivElement, qrContainer: HTMLDivElement): Promise<void> {
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
    }

    const url = encodeURL(urlParams);
    const qr = createQR(url, 250, 'transparent');

    paymentInfo.innerHTML = `
        <div class="text-22 font-bold text-white mb-1 leading-tight">${amountValue} ${coin}</div>
        <div class="text-xs text-yellow-400 font-normal uppercase tracking-crypto mt-1">Local Mode</div>
    `;

    const existingQR = qrContainer.querySelector('.qr-code-wrapper');
    if (existingQR) existingQR.remove();

    const qrCodeWrapper = document.createElement('div');
    qrCodeWrapper.className = 'qr-code-wrapper';
    qr.append(qrCodeWrapper);
    qrContainer.appendChild(qrCodeWrapper);
}

function hideSelectors(): void {
    const dropdown = document.querySelector(".dropdown") as HTMLDivElement;
    const coinSelector = document.getElementById("coinSelector") as HTMLDivElement;
    const amountSection = document.getElementById("amountSection") as HTMLDivElement;

    if (dropdown) dropdown.style.display = "none";
    if (coinSelector) coinSelector.style.display = "none";
    if (amountSection) amountSection.style.display = "none";

    const backBtn = document.getElementById("backBtn");
    if (backBtn) backBtn.style.display = "block";
}

window.addEventListener("DOMContentLoaded", () => {
    const dropdownBtn = document.getElementById("dropdownBtn") as HTMLButtonElement;
    const dropdownContent = document.getElementById("dropdownContent") as HTMLDivElement;
    const dropdownArrow = document.getElementById("dropdownArrow") as HTMLSpanElement;
    const dropdownItems = document.querySelectorAll(".dropdown-item") as NodeListOf<HTMLDivElement>;
    const backBtn = document.getElementById("backBtn") as HTMLButtonElement;
    const qrContainer = document.getElementById("qrcode") as HTMLDivElement;
    const coinSelector = document.getElementById("coinSelector") as HTMLDivElement;
    const amountSection = document.getElementById("amountSection") as HTMLDivElement;
    const amountInput = document.getElementById("amountInput") as HTMLInputElement;
    const generateBtn = document.getElementById("generateBtn") as HTMLButtonElement;

    let selectedCoin = "USDC";
    qrContainer.style.display = "none";

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
            selectedCoin = item.getAttribute("data-coin") || "USDC";

            coinItems.forEach(coin => coin.classList.remove("text-white"));
            coinItems.forEach(coin => coin.classList.add("text-crypto-text-muted"));
            item.classList.remove("text-crypto-text-muted");
            item.classList.add("text-white");

            amountSection.style.display = "block";
            amountSection.classList.remove("hidden");
        });
    });

    generateBtn.addEventListener("click", () => {
        const amountValue = amountInput.value.trim();
        generateQR(amountValue, selectedCoin);
    });

    window.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        if (!target.closest('.dropdown')) {
            dropdownContent.classList.add("hidden");
            dropdownArrow.classList.remove("dropdown-arrow-rotate");
        }
    });

    backBtn.addEventListener("click", () => {
        window.location.href = "Dashboard.html";
    });
});