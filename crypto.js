/// Continiously querys blockchain for new transactions with metadata to update the pixelgrid

require('dotenv').config();
const png = require('pngjs').PNG;
const fs = require('fs');
const axios = require('axios');
const { createCanvas } = require('canvas');

const network = process.env.NETWORK;
const metadataLabel = 982541024549416;
const pixelCost = 0.1; // 0.1 ADA per pixel
const canvasSize = 256;

let canvasPath;
let addr;
let blockfrostKey;
let apiPath;

if (network == "testnet") {
    addr = process.env.WALLET_ADDR_TESTNET;
    blockfrostKey = process.env.BLOCKFROST_KEY_TESTNET;
    apiPath = "https://cardano-testnet.blockfrost.io/api/v0";
    canvasPath = "./static/images/testnet.png";
} else if (network == "mainnet") {
    apiPath = "https://cardano-mainnet.blockfrost.io/api/v0"
    addr = process.env.WALLET_ADDR_MAINNET;
    blockfrostKey = process.env.BLOCKFROST_KEY_MAINNET;
    canvasPath = "./static/images/mainnet.png";
} else {
    console.error("Incorrect .env arguments!");
}


const requestHeaders = {
    project_id: blockfrostKey,
}

let addrUri = (addr) => {
    return `${apiPath}/addresses/${addr}/transactions`
}

let metaUri = (id) => {
    return `${apiPath}/metadata/txs/labels/${id}`
}

let utxoUri = (id) => {
    return `${apiPath}/txs/${id}/utxos`
}

let processedHashes = [];

function queryMetadata() {
    let hashes = [];
    let metadata = [];

    // Confirm the transaction is actually ours
    return new Promise((resolve, reject) => {
        axios.get(addrUri(addr), { headers: requestHeaders, params: { order: "desc", from: 3191421 } }).then(res => {
            for (let transaction of res.data) {
                if (processedHashes.includes(transaction.tx_hash)) {
                    break;
                }

                hashes.push(transaction.tx_hash);
            }

            // Update for next time
            processedHashes = [...processedHashes, ...hashes.slice()];

            if (hashes.length > 0) {
                // Get all metadata in network with label = metadataLabel
                axios.get(metaUri(metadataLabel), { headers: requestHeaders, params: { order: "desc" } }).then(res => {

                    let sequence = Promise.resolve();

                    res.data.forEach(tx => {
                        sequence = sequence.then(async () => {
                            if (hashes.includes(tx.tx_hash) && tx.json_metadata != null) {
                                let format = formatMetadata(tx.json_metadata.pixels);

                                // Something went wrong in formatting metadata, it was probably wrong
                                if (format != null) {
                                    // Check if enough ada was sent
                                    await axios.get(utxoUri(tx.tx_hash), { headers: requestHeaders }).then(res => {

                                        for (let output of res.data.outputs) {
                                            if (output.address == addr) {

                                                let transactionAmount = (output.amount[0].quantity / 1000000) + 0.01; // Provide a little room to breath

                                                if ((format.length * pixelCost) > (transactionAmount)) {
                                                    console.log("Transaction was not sufficiently funded: ", format.length * pixelCost, transactionAmount);
                                                } else {
                                                    console.log("adding", Date.now());
                                                    metadata.push(format);
                                                }

                                            }
                                        }

                                    }).catch(err => {
                                        console.log("Error", err);
                                    })
                                }
                            }
                        });
                    })

                    // Return
                    sequence.then(() => {
                        resolve(metadata.reverse());
                    })

                }).catch(err => {
                    console.log("failed", err);
                })
            }

            // Catch address  request errors
        }).catch(err => {
            if (err.response.data.message == "The requested component has not been found.")  {
                console.log("Address has no transactions")
                resolve([])
            } else {
                console.log("failed", err)
            }
        })
    })
}


function formatMetadata(data) {
    pixels = [];

    try {
        for (pixel of data) {
            pixels.push({
                x: pixel[0],
                y: pixel[1],
                r: pixel[2],
                g: pixel[3],
                b: pixel[4],
            })
        }

        return pixels
    } catch {
        console.log("Error occured");
        return null
    }
}

// Update canvas file with new pixels
function updateCanvas(withPixels) {
    if (!fs.existsSync(canvasPath)) {
        const canvas = createCanvas(canvasSize, canvasSize);
        canvas.getContext("2d").fillStyle = "white"
        canvas.getContext("2d").fillRect(0, 0, canvasSize, canvasSize);

        fs.writeFileSync(canvasPath, canvas.toBuffer("image/png"));
    }

    fs.createReadStream(canvasPath)
        .pipe(new png())
        .on("parsed", function () {
            try {
                for (const pixelGroup of withPixels) {
                    for (const pixel of pixelGroup) {
                        let i = idx(pixel.x, pixel.y, this.width);

                        this.data[i] = pixel.r;
                        this.data[i + 1] = pixel.g;
                        this.data[i + 2] = pixel.b;
                        this.data[i + 3] = 255;
                    }
                }
            } catch (error) {
                console.error("No valid transactions were given, error: ", error);
            }

            this.pack()
                .pipe(fs.createWriteStream(canvasPath))
                .on("finish", function () {
                    console.log("Wrote", withPixels.length, "transactions");
                });
        });
}

async function getProtocolParameter() {
    let latestBlock = (await blockfrostRequest("/blocks/latest")).data;
    if (!latestBlock) throw "ERROR.FAILED_PROTOCOL_PARAMETER";

    let p = (await blockfrostRequest(`/epochs/${latestBlock.epoch}/parameters`)).data;
    if (!p) throw "ERROR.FAILED_PROTOCOL_PARAMETER";

    return {
        linearFee: {
            minFeeA: p.min_fee_a.toString(),
            minFeeB: p.min_fee_b.toString(),
        },
        minUtxo: '1000000', //p.min_utxo, minUTxOValue protocol paramter has been removed since Alonzo HF. Calulation of minADA works differently now, but 1 minADA still sufficient for now
        poolDeposit: p.pool_deposit,
        keyDeposit: p.key_deposit,
        maxTxSize: p.max_tx_size,
        slot: latestBlock.slot,
    };
}

async function blockfrostRequest(endpoint) {
    try {
        return await axios.get(`${apiPath}${endpoint}`, {
            headers: requestHeaders,
        });
    } catch (err) {
        console.log("error", err);
    }
}

// Get index from coordinate
function idx(x, y, width) {
    return (width * y + x) << 2;
}

async function get() {
    let res = await queryMetadata();

    updateCanvas(res);
}

get();
setInterval(() => {
    get();
}, 10000);

// Update protocol parameters every 10 minutes
setInterval(() => {
    getProtocolParameter().then((params) => {
        console.log(params);
        fs.writeFile("protocolparams.json", JSON.stringify(params), (err) => {
            if (err) throw err;
            console.log("Updated protocol parameters");
        })
    });
}, 10 * 60 * 1000);