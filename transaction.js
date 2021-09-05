require('dotenv').config();
const axios = require('axios');

function transaction() {
    data = {
        "passphrase":process.env.WALLET_PASSPHRASE,
        "payments":[
            {
                "address":"addr_test1qrpgm3calx3hhjnp244wqvx6d5tadzrw4z0t608jay9xgepm0uqgsmeay4puv9yjcvzwslyswff9wtd85h26vrwmapzq8raqag",
                "amount":{
                    "quantity":999979,
                    "unit":"lovelace"
                }
            }
        ],
        "metadata": {
            "0": {
                "list": [
                    {
                        "int": 3, // r
                    },
                    {
                        "int": 12, // g
                    },
                    {
                        "int": 255, // b
                    },
                    {
                        "int": 1001, // x
                    },
                    {
                        "int": -1, // y
                    },
                ]
            },
            "1": {
                "list": [
                    {
                        "int": 2,
                    },
                    {
                        "int": 4,
                    },
                    {
                        "int": 534,
                    },
                    {
                        "int": 204,
                    },
                    {
                        "int": 24,
                    },
                ]
            }
        }
    }

    axios.post(`http://localhost:8090/v2/wallets/${process.env.WALLET_ID_SEND}/transactions`, data, {'Content-Type': 'application/json'}).then(res => {
        console.log('Status Code:', res.status);
    
        console.log(res.data)
    })
    
    .catch(err => {
        console.log('Error: ', err.message, err);
    })
}

transaction();