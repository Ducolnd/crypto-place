
# crypto-place

Crypto-place is a drawable 1024x1024 pixel grid powed by the Cardano blockchain. It uses metadata to encode pixel data in transactions. This data is then read from the transactions, from which an image is generated.

## Contributing

Any help would be greatly appreciated. To start contributing, simply `fork` the repository and submit a `pull request`.

### Run locally

1. Git `clone` the repository
2. Run `npm i` to install all dependencies
3. Install all dependencies for nodejs Canvas using `sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev`
4. Next you will need to create a [`Blockfrost`](https://developers.cardano.org/docs/get-started/installing-cardano-node) api key. This is for query the blockchain for transaction data
5. Create a `.env` file and edit it with your wallet address and Blockfrost api keys (testnet or mainnet)
6. Build all javascript files using `npm run build`
7. Run the express server using `npm start` or `node server.js`

### Things to work on

- [x] Better canvas scrolling
- [ ] Better looking site
- [ ] Data page with stats
- [ ] Better `React` code
- [ ] Display history for pixels
