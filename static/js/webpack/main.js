import _ from 'lodash';
import {log} from "./module-test";

const wasm = await import("@emurgo/cardano-serialization-lib-browser/cardano_serialization_lib.js");
const nami_lib = await import("nami-wallet-api");
const cardano = window.cardano;

const wallet = await nami_lib.NamiWalletApi(
    cardano,
    "testnetAIiYXMPjRJDZqahVQ237yoe12zra8XAx",
    wasm,
)

// Send pixels to the 'server' aka cardano wallet.
function sendPixels(pixels) {
    wallet.send({
        address: "addr_test1qqm725nm5f7jn48jmu5ss0n9j5e6qwfvvq0mwwklhyxq6jyszazdtcyrdzhqus0l9p2vqe2svkm0r7p699g5wnyrl5jsqk78a7",
        amount: 8.04,
        metadata: {
            pixels: pixels,
        }
    }).then(hash => {
        console.log("Transaction was succesful. Transaction hash: ", hash);
    })
}

$(document).ready(function() {
    
})