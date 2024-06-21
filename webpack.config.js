const path = require('path');

module.exports = {
    entry: './src/index.ts', // Adjust the entry point to your main TypeScript file
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist_webpack'),
        library: 'trp/sor', // The global variable name for your library
        libraryTarget: 'umd', // Universal Module Definition
        globalObject: 'this',
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    mode: 'production',
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
};
