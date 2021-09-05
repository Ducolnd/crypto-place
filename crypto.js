/// Continiously querys blockchain for new transactions with metadata to update the pixelgrid

require('dotenv').config();
const axios = require('axios');
const walletId = process.env.WALLET_ID_REC;

let transactionPixelHistory = {}

function checkTransactions(query_hours=24) {
    let date = new Date((new Date() - query_hours * 60 * 60 * 1000)).toISOString();

    axios.get(`http://localhost:8090/v2/wallets/${walletId}/transactions?start=${date}`).then(res => {
        console.log('Status Code:', res.status);
    
        for (transaction of res.data) {
            console.log(transaction);
            let metadata = transaction.metadata;
            let amount = transaction.amount.quantity;
            let direction = transaction.direction == "incoming" ? true : false;
    
            if (direction && metadata != null) {
                console.log("--------------")
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
                        // transactionPixelHistory[]
                    }

                    console.log(r, g, b, x, y);
                    
                }
            }
    
        }
    })
    
    .catch(err => {
        console.log('Error: ', err.message);
    })
}

checkTransactions(3);