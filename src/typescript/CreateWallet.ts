import * as bip39 from "bip39";
import { HDKey } from "micro-ed25519-hdkey";
import { Keypair } from "@solana/web3.js";
import { Buffer } from "buffer";

window.Buffer = Buffer;

window.addEventListener("DOMContentLoaded", () => {
    try {
        // Генерация сидфразы
        const mnemonic = bip39.generateMnemonic();

        // Получаем seed и keypair
        const seed = bip39.mnemonicToSeedSync(mnemonic, "");
        const hd = HDKey.fromMasterSeed(seed.toString("hex"));
        const path = "m/44'/501'/0'/0'";
        const child = hd.derive(path);
        const keypair = Keypair.fromSeed(child.privateKey);
        const publicKey = keypair.publicKey.toBase58();

        // Сохраняем адрес в localStorage
        localStorage.setItem("walletAddress", publicKey);

        // Вывод сидфразы в колонки с нумерацией
        const mnemonicContainer = document.getElementById("mnemonic-container");
        const addressContainer = document.getElementById("address-container");
        if (!mnemonicContainer || !addressContainer) throw new Error("Элементы не найдены");

        const words = mnemonic.split(" ");
        if (words.length !== 12) throw new Error("Сидфраза не 12 слов");

        const firstCol = words.slice(0, 6);
        const secondCol = words.slice(6);

        function createColumn(wordsArray: string[], startIndex: number): string {
            return `
        <ol start="${startIndex}" class="list-decimal list-inside pl-0 text-lg text-gray-200 select-text md:text-xl lg:text-2xl">
          ${wordsArray.map(word => `<li class="mb-2 font-semibold">${word}</li>`).join("")}
        </ol>
      `;
        }

        mnemonicContainer.innerHTML = `
      <div class="flex justify-center gap-10 md:gap-12 lg:gap-16">
        ${createColumn(firstCol, 1)}
        ${createColumn(secondCol, 7)}
      </div>
    `;

        addressContainer.innerHTML = `<p class="text-sm md:text-base"><strong>Адрес кошелька:</strong> ${publicKey}</p>`;

    } catch (err) {
        console.error(err);
        alert("Ошибка генерации кошелька");
    }
});