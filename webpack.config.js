const path = require('path');

module.exports = {
    entry: {
        canvas: "./static/js/sidebar.js",
        react: "./static/js/react.js",
    },
    output: {
        path: path.resolve(__dirname, "static", 'dist'),
    },
    mode: "development",
    devtool: "source-map",

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