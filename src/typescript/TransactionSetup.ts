import { Buffer } from "buffer";
import BigNumber from "bignumber.js";
window.Buffer = Buffer;
(globalThis as any).Buffer = Buffer;

async function loadSolanaLibraries() {
    const { encodeURL, createQR } = await import('@solana/pay');
    const { PublicKey } = await import('@solana/web3.js');
    return { encodeURL, createQR, PublicKey };
}

async function generateQR(amountValue: string, coin: string): Promise<void> {
    const qrContainer = document.getElementById("qrcode") as HTMLDivElement;
    const paymentInfo = document.getElementById("paymentInfo") as HTMLDivElement;
    const publicKeyString = localStorage.getItem("walletAddress");

    // Проверка суммы – если некорректна, ничего не делаем
    if (!publicKeyString || !amountValue || isNaN(Number(amountValue)) || Number(amountValue) <= 0) {
        return;
    }

    try {
        const { encodeURL, createQR, PublicKey } = await loadSolanaLibraries();
        const recipient = new PublicKey(publicKeyString);
        const amount = new BigNumber(amountValue);

        let urlParams: any = {
            recipient,
            amount,
            label: `Оплата ${coin}`,
            message: "Оплата через Solana Pay"
        };

        if (coin === "USDC") {
            urlParams.splToken = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
        }

        const url = encodeURL(urlParams);
        const qr = createQR(url, 250, 'transparent');

        // Добавляем информацию о платеже
        paymentInfo.innerHTML = `
            <div class="payment-amount">${amountValue} ${coin}</div>
            <div class="payment-network">Сеть: Solana</div>
        `;

        // Очищаем контейнер и добавляем QR-код
        const existingQR = qrContainer.querySelector('.qr-code-wrapper');
        if (existingQR) {
            existingQR.remove();
        }

        const qrCodeWrapper = document.createElement('div');
        qrCodeWrapper.className = 'qr-code-wrapper';
        qr.append(qrCodeWrapper);
        qrContainer.appendChild(qrCodeWrapper);

        qrContainer.style.display = "flex";

        // Скрываем все кроме QR и кнопки назад
        const dropdown = document.querySelector(".dropdown") as HTMLDivElement;
        const coinSelector = document.getElementById("coinSelector") as HTMLDivElement;
        const amountSection = document.getElementById("amountSection") as HTMLDivElement;

        if (dropdown) dropdown.style.display = "none";
        if (coinSelector) coinSelector.style.display = "none";
        if (amountSection) amountSection.style.display = "none";

    } catch (error) {
        console.error("Ошибка генерации QR:", error);
    }
}

window.addEventListener("DOMContentLoaded", () => {
    const dropdownBtn = document.getElementById("dropdownBtn") as HTMLButtonElement;
    const dropdownContent = document.getElementById("dropdownContent") as HTMLDivElement;
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
        dropdownContent.classList.toggle("show");
        dropdownBtn.classList.toggle("active");
    });

    dropdownItems.forEach(item => {
        item.addEventListener("click", () => {
            const selectedText = item.textContent || "";
            dropdownBtn.textContent = selectedText;
            dropdownContent.classList.remove("show");
            dropdownBtn.classList.remove("active");

            coinSelector.style.display = "flex";
        });
    });

    const coinItems = document.querySelectorAll(".coin-item") as NodeListOf<HTMLDivElement>;
    coinItems.forEach(item => {
        item.addEventListener("click", () => {
            selectedCoin = item.getAttribute("data-coin") || "USDC";

            // Добавляем визуальное выделение выбранной монеты
            coinItems.forEach(coin => coin.classList.remove("selected"));
            item.classList.add("selected");

            amountSection.style.display = "block";
        });
    });

    generateBtn.addEventListener("click", () => {
        const amountValue = amountInput.value.trim();
        generateQR(amountValue, selectedCoin);
    });

    window.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        if (!target.matches('.dropbtn') && !target.closest('.dropdown')) {
            dropdownContent.classList.remove("show");
            dropdownBtn.classList.remove("active");
        }
    });

    backBtn.addEventListener("click", () => {
        window.location.href = "Dashboard.html";
    });
});