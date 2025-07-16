import * as bip39 from "bip39";
import { HDKey } from "micro-ed25519-hdkey";
import { Keypair } from "@solana/web3.js";
import { Buffer } from "buffer";

window.Buffer = Buffer;

window.addEventListener("DOMContentLoaded", () => {
    try {
        const mnemonic = bip39.generateMnemonic();

        const seed = bip39.mnemonicToSeedSync(mnemonic, "");
        const hd = HDKey.fromMasterSeed(seed.toString("hex"));
        const path = "m/44'/501'/0'/0'";
        const child = hd.derive(path);
        const keypair = Keypair.fromSeed(child.privateKey);
        const publicKey = keypair.publicKey.toBase58();

        localStorage.setItem("walletAddress", publicKey);

        const mnemonicContainer = document.getElementById("mnemonic-container");
        if (!mnemonicContainer) throw new Error("Element not found");

        const words = mnemonic.split(" ");
        if (words.length !== 12) throw new Error("Not 12 words");

        const wordsHtml = words.map((word, index) => `
            <div class="bg-crypto-card border-2 border-crypto-border rounded-lg p-2 flex items-center justify-between min-w-0">
                <span class="text-crypto-text-muted text-xs font-semibold mr-2 flex-shrink-0">${index + 1}.</span>
                <span class="text-white text-xs font-semibold truncate">${word}</span>
            </div>
        `).join("");

        mnemonicContainer.innerHTML = `
            <div class="w-full max-w-xs mx-auto">
                <div class="grid grid-cols-2 gap-2 mb-3">
                    ${wordsHtml}
                </div>
                <div class="flex justify-end">
                    <button 
                        id="copyBtn" 
                        class="bg-crypto-card border-2 border-crypto-border rounded-lg px-3 py-2 flex items-center gap-1.5 hover:bg-crypto-border hover:scale-105 transition-all duration-200 active:scale-95"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-crypto-text-muted">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        <span class="text-crypto-text-muted text-xs font-semibold">Copy</span>
                    </button>
                </div>
            </div>
        `;

        const copyBtn = document.getElementById("copyBtn");
        copyBtn?.addEventListener("click", async () => {
            try {
                await navigator.clipboard.writeText(mnemonic);
                copyBtn.classList.add("scale-110", "bg-crypto-border-hover");
                setTimeout(() => {
                    copyBtn.classList.remove("scale-110", "bg-crypto-border-hover");
                }, 150);
            } catch (err) {
                console.error("Failed to copy:", err);
            }
        });

    } catch (err) {
        console.error(err);
        alert("Wallet generation error");
    }
});