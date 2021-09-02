require('dotenv').config();
const axios = require('axios');
const walletId = process.env.WALLET_ID;

function checkTransactions() {
    axios.get(`http://localhost:8090/v2/wallets/${walletId}/transactions`).then(res => {
        console.log('Status Code:', res.status);
    
        for (transaction of res.data) {
            let metadata = transaction.metadata;
            let amount = transaction.amount.quantity;
            let direction = transaction.direction == "incoming" ? true : false;
    
            if (direction && metadata != null) {
                console.log(metadata, amount)
            }
    
        }
    })
    
    .catch(err => {
        console.log('Error: ', err.message);
    })
}

checkTransactions();