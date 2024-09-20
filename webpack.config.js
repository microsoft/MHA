/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const devCerts = require("office-addin-dev-certs");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const FileManagerPlugin = require("filemanager-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const webpack = require("webpack");

async function getHttpsOptions() {
    const httpsOptions = await devCerts.getHttpsServerOptions();
    return { ca: httpsOptions.ca, key: httpsOptions.key, cert: httpsOptions.cert };
}

// Simple stupid hash to reduce commit ID to something short
const getHash = function (str) {
    var hash = 42;
    if (str.length) { for (var i = 0; i < str.length; i++) { hash = Math.abs((hash << 5) - hash + str.charCodeAt(i)); } }
    return hash.toString(16);
};

var commitID = process.env.SCM_COMMIT_ID;
if (!commitID) commitID = "test";
const version = getHash(commitID);
console.log("commitID: " + commitID);
console.log("version: " + version);

var aikey = process.env.APPINSIGHTS_INSTRUMENTATIONKEY;
if (typeof (aikey) === "undefined" || aikey === "") aikey = "unknown";
console.log("aikey: " + aikey);

const buildTime = new Date().toUTCString();
console.log("buildTime: " + buildTime);

const pages =
    [
        { "name": "unittests", "script": "unittests" },
        { "name": "mha", "script": "mha" },
        { "name": "uitoggle", "script": "uiToggle" },
        { "name": "newDesktopFrame", "script": "DesktopPane" },
        { "name": "classicDesktopFrame", "script": "Default" },
        { "name": "newMobilePaneIosFrame", "script": "MobilePane-ios" },
        { "name": "privacy", "script": "privacy" },
        // Redirection/static pages
        { "name": "Default" },
        { "name": "DefaultPhone" },
        { "name": "DefaultTablet" },
        { "name": "DesktopPane" },
        { "name": "MobilePane" },
        { "name": "Functions" },
    ];

function generateEntry() {
    return pages.reduce((config, page) => {
        if (typeof (page.script) === "undefined") return config;
        config[page.script] = `./src/Scripts/${page.script}.ts`;
        return config;
    }, {});
}

function generateHtmlWebpackPlugins() {
    return pages.map(function (page) {
        return new HtmlWebpackPlugin({
            inject: true,
            template: `./src/Pages/${page.name}.html`,
            filename: `${page.name}.html`,
            chunks: [page.script]
        });
    });
}

module.exports = async (env, options) => {
    const config = {
        entry: generateEntry(),
        plugins: [
            new MiniCssExtractPlugin({
                filename: version + "/[name].css"
            }),
            new webpack.DefinePlugin({
                __VERSION__: JSON.stringify(version),
                __AIKEY__: JSON.stringify(aikey),
                __BUILDTIME__: JSON.stringify(buildTime)
            }),
            new FileManagerPlugin({
                events: {
                    onEnd: {
                        copy: [
                            { source: "./src/Resources/*.gif", destination: "./Resources/" },
                            { source: "./src/Resources/*.jpg", destination: "./Resources/" }
                        ]
                    }
                }
            }),
            new ForkTsCheckerWebpackPlugin(),
        ].concat(generateHtmlWebpackPlugins()),
        mode: "development",
        devtool: "source-map",
        target: ["web", "es5"],
        module: {
            rules: [
                { test: /fabric(\.min)?\.js$/, use: "exports-loader?exports=fabric" },
                {
                    test: /\.tsx?$/,
                    use: [
                        {
                            loader: "ts-loader",
                            options: {
                                logLevel: "info"
                            }
                        }
                    ],
                    exclude: /node_modules/,
                },
                {
                    test: /\.css$/i,
                    use: [MiniCssExtractPlugin.loader, "css-loader"],
                },
                {
                    test: /\.js$/,
                    enforce: "pre",
                    use: ["source-map-loader"],
                },
            ],
        },
        optimization: {
            runtimeChunk: "single",
            splitChunks: {
                chunks: "all",
                maxInitialRequests: Infinity,
                minSize: 0,
            },
        },
        resolve: {
            extensions: [".tsx", ".ts", ".js"],
        },
        output: {
            filename: version + "/[name].js",
            path: path.resolve(__dirname, "Pages"),
            publicPath: "/Pages/",
            clean: true,
        },
        devServer: {
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            static: __dirname,
            server: {
                type: "https",
                options: env.WEBPACK_BUILD || options.https !== undefined ? options.https : await getHttpsOptions(),
            },
            port: process.env.npm_package_config_dev_server_port || 44336,
        },
    };

    return config;
};
