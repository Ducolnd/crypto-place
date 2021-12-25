const path = require('path');
const Dotenv = require('dotenv-webpack');

module.exports = {
    entry: {
        canvas: "./src/js/sidebar.js",
    },
    output: {
        path: path.resolve(__dirname, "static", 'dist'),
    },
    mode: "development",
    devtool: "source-map",

    plugins: [
        new Dotenv()
    ],

    module: {
        rules: [
            {
                test: /\.?js$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ['@babel/preset-env', '@babel/preset-react']
                    }
                }
            }
        ]
    },

    experiments: {
        asyncWebAssembly: true,
        syncWebAssembly: true,
        topLevelAwait: true,
    }
};