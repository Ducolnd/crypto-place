const wasm = await import("@emurgo/cardano-serialization-lib-browser/cardano_serialization_lib.js");
const nami_lib = await import("nami-wallet-api");
const cardano = window.cardano;

const wallet = await nami_lib.NamiWalletApi(
    cardano,
    "testnetAIiYXMPjRJDZqahVQ237yoe12zra8XAx",
    wasm,
)

function parsePixels(pixels) {
    let better = [];

    for (const pixel of pixels) {
        better.push([
            pixel.x, pixel.y, pixel.r, pixel.g, pixel.b
        ])
    }

    return better
}

// Send pixels to the 'server' aka cardano wallet.
export async function sendPixels(pixels) {   
    return wallet.send({
        address: process.env.WALLET_ADDR,
        amount: pixels.length * 0.1,
        metadata: {
            pixels: parsePixels(pixels),
        }
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