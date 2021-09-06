require('dotenv').config();
const axios = require('axios');
const util = require('util')

function transaction(pixels) {
    metadata = {};
    i = 0;
    for (const pixel of pixels) {
        metadata[i] = {"list": [
            {"int": pixel.color[0]},
            {"int": pixel.color[1]},
            {"int": pixel.color[2]},
            {"int": pixel.x},
            {"int": pixel.y},
        ]};
        i++;
    }

    console.log(util.inspect(metadata, {showHidden: false, depth: null}));

    data = {
        "passphrase":process.env.WALLET_PASSPHRASE,
        "payments":[
            {
                "address":"addr_test1qrpgm3calx3hhjnp244wqvx6d5tadzrw4z0t608jay9xgepm0uqgsmeay4puv9yjcvzwslyswff9wtd85h26vrwmapzq8raqag",
                "amount":{
                    "quantity":1548999,
                    "unit":"lovelace"
                }
            }
        ],
        "metadata": metadata,        
    }

    axios.post(`http://localhost:8090/v2/wallets/${process.env.WALLET_ID_SEND}/transactions`, data, {'Content-Type': 'application/json'}).then(res => {
        console.log('Status Code:', res.status);
    
        console.log("Transaction ID:", res.data.id)
    })
    
    .catch(err => {
        console.log('Error: ', err.message, err);
    })
}

module.exports = {
    transaction
}