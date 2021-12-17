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

function send(to, amount) {
    const lovelace = (parseFloat(amount) * 1000000).toString();
}

$(document).ready(function() {
    cardano.enable().then((result) => {
        console.log("Connected: ", result);
        console.log("Address:", wallet.getAddress());
        
        wallet.send({
            address: "addr_test1qqm725nm5f7jn48jmu5ss0n9j5e6qwfvvq0mwwklhyxq6jyszazdtcyrdzhqus0l9p2vqe2svkm0r7p699g5wnyrl5jsqk78a7",
            amount: 8.04,
            metadata: {
                "Somedata": "Duco Lindhout (:",
            }
        }).then((hash) => {
            console.log("HASH: ", hash);
        })
    })
})