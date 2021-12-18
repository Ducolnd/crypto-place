/// Continiously querys blockchain for new transactions with metadata to update the pixelgrid

require('dotenv').config();
const png = require('pngjs').PNG;
const fs = require('fs');
const axios = require('axios');
const walletId = process.env.WALLET_ID_REC;

// Update canvas file with new pixels
function updateCanvas(withPixels) {
    fs.createReadStream("static/images/canvas.png")
        .pipe(new png())
        .on("parsed", function () {
            try {
                console.log(withPixels);
                for (const pixelGroup of withPixels) {
                    for (const pixel of pixelGroup) {
                        let i = idx(pixel.x, pixel.y, this.width);
    
                        console.log("Wrinting pixels x, y, r, g, b, i", pixel.x, pixel.y, pixel.r, pixel.g, pixel.b, i);
    
                        this.data[i] = pixel.r;
                        this.data[i + 1] = pixel.g;
                        this.data[i + 2] = pixel.b;
                        this.data[i + 3] = 255;
                    }
                }
            } catch (error) {
                console.error("No valid transactions were given, error: ", error);
                return
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
    let date = new Date((new Date() - 60 * 5 * 1000)).toISOString(); // From when we want to query transactions
    let transactionPixelHistory = []

    axios.get(`http://localhost:8090/v2/wallets/${walletId}/transactions?from=${date}`).then(res => {
        console.log('Status Code:', res.status);

        for (let i = 0; i < res.data.slice(0, 2).length; i++) {
            let transaction = res.data[i];

            // Make sure it is meant for us
            if (transaction.metadata !== null && transaction.direction === "incoming") {
                let amount = parseFloat(transaction.amount.quantity) / 1000000.0;
                let pixels = parseMetaData(transaction.metadata);

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

checkTransactions(48, data => {
    updateCanvas(data);
})

// Parses the unreadable Cardano Metadata into something workable
function parseMetaData(metadata) {
    let data = [];

    for (let pixel of Object.values(metadata)[0].map[0].v.list) {
        let d = {};
        for (let raw of pixel.map) {
            d[raw.k.string] = raw.v.int
        }
        data.push(d);
    }

    return data
}