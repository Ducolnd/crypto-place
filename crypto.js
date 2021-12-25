/// Continiously querys blockchain for new transactions with metadata to update the pixelgrid

require('dotenv').config();
const png = require('pngjs').PNG;
const fs = require('fs');
const axios = require('axios');
const {createCanvas} = require('canvas');

const walletId = process.env.WALLET_ID;
const CanvasPath = "./static/images/canvas.png";

// Update canvas file with new pixels
function updateCanvas(withPixels) {
    if (!fs.existsSync("afile.png")) {
        const canvas = createCanvas(100, 100);
        canvas.getContext("2d").fillStyle = "white"
        canvas.getContext("2d").fillRect(0,0,100,100);

        fs.writeFileSync(CanvasPath, canvas.toBuffer("image/png"));
    }
    
    fs.createReadStream(CanvasPath)
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
                .pipe(fs.createWriteStream("static/images/canvas.png"))
                .on("finish", function () {
                    console.log("Wrote pixels");
                });
        });
}

// Get index from coordinate
function idx(x, y, width) {
    return (width * y + x) << 2;
}

function checkTransactions(query_hours = 24, callback) {
    let date = new Date((new Date() - query_hours * 60 * 60 * 1000)).toISOString(); // From when we want to query transactions
    let transactionPixelHistory = [];

    axios.get(`http://localhost:8090/v2/wallets/${walletId}/transactions?start=${date}`).then(res => {
        for (let i = 0; i < res.data.length; i++) {
            let transaction = res.data[i];

            // Make sure it is meant for us
            if (transaction.metadata !== null && transaction.direction === "incoming") {
                let amount = parseFloat(transaction.amount.quantity) / 1000000.0;
                let pixels = parseMetaData(transaction.metadata);

                // The metadata was not in the correct format
                if (pixels === null) {
                    continue;
                }

                // No enough funds
                if (pixels.length * 0.1 > amount) {
                    // Remove surplus pixels
                    pixels.slice(parseInt(amount * 10), pixels.length);
                }

                transactionPixelHistory.push(pixels);
            }
        }

        callback(transactionPixelHistory);
    })

        .catch(err => {
            console.log('Error: ', err.message);
        })
}

// Parses the unreadable Cardano Metadata into something workable
function parseMetaData(metadata) {
    let data = [];

    try {
        for (let pixel of metadata["721"].map[0].v.list) {
            let d = {};
            let raw = pixel.list;

            d["x"] = raw[0].int;
            d["y"] = raw[1].int;
            d["r"] = raw[2].int;
            d["g"] = raw[3].int;
            d["b"] = raw[4].int;

            data.push(d);
        }

        return data
    }
    catch (e) {
        return null
    }
}

checkTransactions(48, data => {
    updateCanvas(data);
})