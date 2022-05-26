const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const pages =
    [
        { "pagename": "unittests", "chunk": "unittests" },
        { "pagename": "mha", "chunk": "standalone" },
        { "pagename": "parentframe", "chunk": "uiToggle" },
    ];

function generateHtmlWebpackPlugins() {
    return pages.map(function (val) {
        return new HtmlWebpackPlugin({
            inject: true,
            template: `./src/Pages/${val.pagename}.html`,
            filename: `${val.pagename}.html`,
            chunks: [val.chunk]
        })
    });
}

module.exports = {
    entry: {
        unittests: './src/Scripts/unittests.ts',
        standalone: './src/Scripts/StandAlone.ts',
        default: './src/Scripts/Default.ts',
        desktoppane: './src/Scripts/DesktopPane.ts',
        mobilepaneios: './src/Scripts/MobilePane-ios.ts',
        mobilepane: './src/Scripts/MobilePane.ts',
        uitoggle: './src/Scripts/uiToggle.ts',
    },
    mode: 'development',
    devtool: 'source-map',
    plugins: [].concat(generateHtmlWebpackPlugins()),
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource',
            },
            {
                test: /\.js$/,
                enforce: "pre",
                use: ["source-map-loader"],
            },
        ],
    },
    optimization: {
        splitChunks: {
            chunks: "all",
        },
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
    },
};