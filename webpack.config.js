const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const pages =
    [
        { "name": "unittests", "script": "unittests" },
        { "name": "mha", "script": "StandAlone" },
        { "name": "parentframe", "script": "uiToggle" },
        { "name": "newDesktopFrame", "script": "DesktopPane" },
        { "name": "classicDesktopFrame", "script": "Default" },
        { "name": "MobilePane", "script": "MobilePane" },
        { "name": "MobilePane-ios", "script": "MobilePane-ios" },
        { "name": "Privacy", "script": "privacy" },
        // Redirection/static pages
        { "name": "Default" },
        { "name": "DefaultPhone" },
        { "name": "DefaultTablet" },
        { "name": "Functions" },
    ];

function generateHtmlWebpackPlugins() {
    return pages.map(function (page) {
        return new HtmlWebpackPlugin({
            inject: true,
            template: `./src/Pages/${page.name}.html`,
            filename: `${page.name}.html`,
            chunks: [page.script]
        })
    });
}

function generateEntry() {
    return pages.reduce((config, page) => {
        if (typeof (page.script) === "undefined") return config;
        config[page.script] = `./src/Scripts/${page.script}.ts`;
        return config;
    }, {});
}

module.exports = {
    entry: generateEntry(),
    plugins: [].concat(generateHtmlWebpackPlugins()),
    mode: 'development',
    devtool: 'source-map',
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