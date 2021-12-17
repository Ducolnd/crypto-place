const path = require('path');

module.exports = {
    entry: {
        canvas: "./static/js/sidebar.js",
    },
    output: {
        path: path.resolve(__dirname, "static", 'dist'),
    },
    mode: "development",

    experiments: {
        asyncWebAssembly: true,
        syncWebAssembly: true,
        topLevelAwait: true,
    }
};