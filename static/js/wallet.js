const wasm = await import("@emurgo/cardano-serialization-lib-browser/cardano_serialization_lib.js");
const nami_lib = await import("nami-wallet-api");
const cardano = window.cardano;

const wallet = await nami_lib.NamiWalletApi(
    cardano,
    "testnetAIiYXMPjRJDZqahVQ237yoe12zra8XAx",
    wasm,
)

// Send pixels to the 'server' aka cardano wallet.
export function sendPixels(pixels) {   
    wallet.send({
        address: "addr_test1qze28nytrunhtfe0xth687n9933yj6mc0glph7yetcgvuwc2xf3hclyd5syrcg66wa205037ma6vkghzmjd0l0rl649qdzva7e",
        amount: pixels.length * 0.1,
        metadata: {
            pixels: pixels,
        }
    }).then(hash => {
        console.log("Transaction was succesful. Transaction hash: ", hash);
    })
}

export async function activateCardano() {
    wallet.enable().then(result => {
        $("#connectBtn").text('Connected');
        $("#connectBtn").attr('class', 'btn btn-success');
    }, 
    error => {
        alert("could not connect", error);
    })
}