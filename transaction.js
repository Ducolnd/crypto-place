require('dotenv').config();
const axios = require('axios');
const walletId = process.env.WALLET_ID;

function transaction() {
    axios.post(`http://localhost:8090/v2/wallets/${walletId}/transactions`, {
        "passphrase":"test123456",
        "payments":[
            {
                "address":"addr_test1qqm725nm5f7jn48jmu5ss0n9j5e6qwfvvq0mwwklhyxq6jyszazdtcyrdzhqus0l9p2vqe2svkm0r7p699g5wnyrl5jsqk78a7",
                "amount":{
                    "quantity":1587954,
                    "unit":"lovelace"
                }
            }
        ],
        "metadata":{
            "42":{
                "map":[
                    {
                        "k":{
                            "string":"Duco"
                        },
                        "v":{
                            "string":"Second Metadata! 01-09-2021"
                        }
                    },
                ]
            }
        }
    }).then(res => {
        console.log('Status Code:', res.status);
    
        console.log(res.data)
    })
    
    .catch(err => {
        console.log('Error: ', err.message);
    })
}

transaction();