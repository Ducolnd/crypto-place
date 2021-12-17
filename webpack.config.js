const path = require('path');

module.exports = {
    entry: './static/js/webpack/main.js',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, "static", 'dist'),
    },
    mode: "development",

    experiments: {
        asyncWebAssembly: true,
        syncWebAssembly: true,
        
    }
};