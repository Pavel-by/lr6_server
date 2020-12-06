const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
    entry: path.join(__dirname, 'src/www.js'),
    output: {
        filename: 'bundle.js',
        path: path.join(__dirname, "/dist/"),
    },
    devtool: "eval-source-map",
    target: 'node',
    externals: [nodeExternals()],
    module: {
        rules: [
            {
                test: /\.m?js$/,
                exclude:  /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        "presets": [
                            ["@babel/preset-env", {
                                "useBuiltIns": "usage",
                                "corejs": 3
                            }],
                            "@babel/preset-flow"
                        ],
                        "plugins": [
                            "@babel/plugin-proposal-class-properties"
                        ]
                    }
                }
            }
        ]
    }
};