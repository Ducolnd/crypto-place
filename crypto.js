/// Continiously querys blockchain for new transactions with metadata to update the pixelgrid

require('dotenv').config();
const png = require('pngjs').PNG;
const fs = require('fs');
const axios = require('axios');
const {createCanvas} = require('canvas');

const CanvasPath = "./static/images/canvas.png";
const addr = process.env.WALLET_ADDR;
const blockfrostKey = process.env.BLOCKFROST_KEY_TESTNET;
const metadataLabel = 982541024549416;

const requestHeaders = {
    project_id: blockfrostKey,
}

let addrUri = (addr) => {
    return `https://cardano-testnet.blockfrost.io/api/v0/addresses/${addr}/transactions`
}

let metaUri = (id) => {
    return `https://cardano-testnet.blockfrost.io/api/v0/metadata/txs/labels/${id}`
}

async function queryMetadata(done) {
    let hashes = [];
    let metadata = [];

    axios.get(addrUri(addr), {headers: requestHeaders, params: {order: "desc"}}).then(res => {
        for (transaction of res.data) {
            hashes.push(transaction.tx_hash);
        }

        axios.get(metaUri(metadataLabel), {headers: requestHeaders, params: {order: "desc"}}).then(res => {
            for (tx of res.data) {
                if (hashes.includes(tx.tx_hash)) {
                    metadata.push(tx.json_metadata.pixels);

                }
            }

            // return
            done(metadata.reverse());
        }).catch(err => {
            console.log("failed", err);
        })
        
    }).catch(err => {
        console.log("failed", err)
    })

}

queryMetadata(res => {
    console.log(res);
    updateCanvas(res);
})

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
                        let i = idx(pixel[0], pixel[1], this.width);

                        this.data[i] = pixel[2];
                        this.data[i + 1] = pixel[3];
                        this.data[i + 2] = pixel[4];
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