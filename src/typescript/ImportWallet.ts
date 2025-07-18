import * as bip39 from "bip39";
import { HDKey } from "micro-ed25519-hdkey";
import { Keypair } from "@solana/web3.js";
import { Buffer } from "buffer";

window.Buffer = Buffer;

const importBtn = document.getElementById("importButton") as HTMLButtonElement;
const mnemonicInput = document.getElementById("mnemonicInput") as HTMLTextAreaElement;
const pasteBtn = document.getElementById("pasteBtn") as HTMLButtonElement;

// Активация кнопки при вводе
mnemonicInput?.addEventListener("input", () => {
    importBtn.disabled = !mnemonicInput.value.trim();
});

// Paste функционал
pasteBtn?.addEventListener("click", async () => {
    try {
        const text = await navigator.clipboard.readText();
        mnemonicInput.value = text.trim();
        importBtn.disabled = !text.trim();
    } catch (err) {
        console.log("Paste failed");
    }
});

// Import функционал с сохранением приватного ключа
importBtn?.addEventListener("click", () => {
    const mnemonic = mnemonicInput.value.trim();

    if (!mnemonic) {
        alert("Enter a sidephrase");
        return;
    }

    if (!bip39.validateMnemonic(mnemonic)) {
        alert("Failure: the seed phrase is incorrect");
        return;
    }

    try {
        const seed = bip39.mnemonicToSeedSync(mnemonic, "");
        const hd = HDKey.fromMasterSeed(seed.toString("hex"));
        const child = hd.derive("m/44'/501'/0'/0'");
        const keypair = Keypair.fromSeed(child.privateKey);


        localStorage.setItem("walletAddress", keypair.publicKey.toBase58());

        alert(`LocalStorage:\n${JSON.stringify(localStorage, null, 2)}`);

        window.location.href = "Dashboard.html";

    } catch (err) {
        alert("Failed to import wallet");
    }
});