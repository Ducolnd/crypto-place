const wasm = await import("@emurgo/cardano-serialization-lib-browser/cardano_serialization_lib.js");
const nami_lib = await import("nami-wallet-api");
const cardano = window.cardano;

const wallet = await nami_lib.NamiWalletApi(
    cardano,
    process.env.BLOCKFROST_KEY_TESTNET,
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
        address: process.env.WALLET_ADDR_TESTNET,
        amount: pixels.length * 0.1,
        metadata: {
            pixels: parsePixels(pixels),
        },
        metadataLabel: "982541024549416",
    })
}

export function activateCardano() {
    wallet.enable().then(result => {
        $("#connectBtn").text('Connected');
        $("#connectBtn").attr('class', 'btn btn-success');
    }, 
    error => {
        $("#connectBtn").text('Attempting to connect with wallet...');
        $("#connectBtn").attr('class', 'btn btn-info');

        setTimeout(() => {
            $("#connectBtn").text('Failed to connect with Nami Wallet');
            $("#connectBtn").attr('class', 'btn btn-danger');
        }, 500)
    })
}