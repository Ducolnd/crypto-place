
# crypto-place

Crypto-place is a drawable 1024x1024 pixel grid powed by the Cardano blockchain. It uses metadata to encode pixel data in transactions. This data is then read from the transactions, from which an image is generated.

## Contributing

Any help would be greatly appreciated. To start contributing, simply `fork` the repository and submit a `pull request`.

### Run locally

1. Git `clone` the repository
2. Run `npm i` to install all dependencies
3. Next you will need to have a [`cardano-node`](https://developers.cardano.org/docs/get-started/installing-cardano-node) and [`cardano-wallet`](https://developers.cardano.org/docs/get-started/installing-cardano-wallet) running on your machine.
4. Create a `.env` file and edit it with your wallet address and wallet-id (cardano-wallet)
5. Build the javascript using `npm run build`
6. Run the express server using `npm start` or `node server.js`

### Things to work on

- [x] Better canvas scrolling
- [ ] Better looking site
- [ ] Data page with stats
- [ ] Better `React` code
- [ ] Display history for pixels
