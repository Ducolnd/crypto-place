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
            for (const pixel of Object.values(withPixels)[0]) {
                let i = idx(pixel.x, pixel.y, this.width);
        
                this.data[i] = pixel.r;
                this.data[i + 1] = pixel.g;
                this.data[i + 2] = pixel.b;
                this.data[i + 3] = 255;

            }

        this.pack()
            .pipe(fs.createWriteStream("static/images/canvas.png"))
            .on("finish", function () {
                console.log("Wrote pixels");
            });

    });
}

function idx(x, y, width) {
    return (width * y + x) << 2;
}

function checkTransactions(query_hours=24, callback) {
    let date = new Date((new Date() - query_hours * 60 * 60 * 1000)).toISOString(); // From when we want to query transactions
    let transactionPixelHistory = {}

    axios.get(`http://localhost:8090/v2/wallets/${walletId}/transactions?start=${date}`).then(res => {
        console.log('Status Code:', res.status);
    
        for (transaction of res.data) {
            let metadata = transaction.metadata;
            let transactionAmount = transaction.amount.quantity;
            let direction = transaction.direction == "incoming" ? true : false;
    
            // Verify transaction is incoming and that it has metadata attached.
            if (direction && metadata != null) {
                console.log("--------------")

                let rawPixelData = Object.values(metadata);
                let numPixels = rawPixelData.length;

                // Verify transacted money is enough. One pixel = 0.1ADA
                if (transactionAmount / 1000000 >= numPixels * 0.1) {
                    let intermediateBuffer = [];
                    for (pixelData of Object.values(metadata)) {
                        let values = pixelData.list
    
                        let r = values[0].int;
                        let g = values[1].int;
                        let b = values[2].int;
                        let x = values[3].int;
                        let y = values[4].int;
    
                        if (
                            x > process.env.BOARD_SIZE_X || 
                            x < 0 ||
                            y > process.env.BOARD_SIZE_Y ||
                            y < 0
                        ) {
                            console.log("Metadata pixel values are invalid for transaction: ", transaction.id);
                        } else {
                            // Insert pixels in buffer
                            intermediateBuffer.push({r, g, b, x, y})
                        }                        
                    }
                    transactionPixelHistory[transaction.inserted_at.time] = intermediateBuffer;
                    console.log("Added pixels for transaction ", transaction.id);
                } else {
                    console.log("Insufficient ada was send")
                }
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