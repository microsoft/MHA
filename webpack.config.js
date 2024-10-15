/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");

const FileManagerPlugin = require("filemanager-webpack-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const devCerts = require("office-addin-dev-certs");
const webpack = require("webpack");

async function getHttpsOptions() {
    try {
        const httpsOptions = await devCerts.getHttpsServerOptions();
        return { ca: httpsOptions.ca, key: httpsOptions.key, cert: httpsOptions.cert };
    } catch (error) {
        console.error("Error getting HTTPS options:", error);
        return {};
    }
}

// Simple hash function to reduce commit ID to something short
const getHash = (str) => {
    let hash = 42;
    if (str.length) {
        for (let i = 0; i < str.length; i++) {
            hash = Math.abs((hash << 5) - hash + str.charCodeAt(i));
        }
    }
    return hash.toString(16);
};

const commitID = process.env.SCM_COMMIT_ID || "test";
const version = getHash(commitID);
console.log("commitID:", commitID);
console.log("version:", version);

const aikey = process.env.APPINSIGHTS_INSTRUMENTATIONKEY || "unknown";
console.log("aikey:", aikey);

const buildTime = new Date().toUTCString();
console.log("buildTime:", buildTime);

const pages = [
    { name: "mha", script: "ui/mha" },
    { name: "uitoggle", script: "ui/uiToggle" },
    { name: "newDesktopFrame", script: "ui/newDesktopFrame" },
    { name: "classicDesktopFrame", script: "ui/classicDesktopFrame" },
    { name: "newMobilePaneIosFrame", script: "ui/newMobilePaneIosFrame" },
    { name: "privacy", script: "ui/privacy" },
    // Redirection/static pages
    { name: "Default" }, // uitoggle.html?default=classic
    { name: "DefaultPhone" }, // uitoggle.html?default=classic
    { name: "DefaultTablet" }, // uitoggle.html?default=classic
    { name: "DesktopPane" }, // uitoggle.html?default=new
    { name: "MobilePane" }, // uitoggle.html?default=new-mobile
    { name: "Functions" },
];

function generateEntry() {
    return pages.reduce((config, page) => {
        if (page.script) {
            config[page.script] = `./src/Scripts/${page.script}.ts`;
        }
        return config;
    }, {});
}

function generateHtmlWebpackPlugins() {
    return pages.map((page) => new HtmlWebpackPlugin({
        inject: true,
        template: `./src/Pages/${page.name}.html`,
        filename: `${page.name}.html`,
        chunks: [page.script],
    }));
}

module.exports = async (env, options) => {
    const config = {
        entry: generateEntry(),
        plugins: [
            new MiniCssExtractPlugin({ filename: `${version}/[name].css` }),
            new webpack.DefinePlugin({
                __VERSION__: JSON.stringify(version),
                __AIKEY__: JSON.stringify(aikey),
                __BUILDTIME__: JSON.stringify(buildTime),
            }),
            new FileManagerPlugin({
                events: {
                    onEnd: {
                        copy: [
                            { source: "./src/Resources/*.gif", destination: "./Resources/" },
                            { source: "./src/Resources/*.jpg", destination: "./Resources/" },
                        ],
                    },
                },
            }),
            new ForkTsCheckerWebpackPlugin(),
            ...generateHtmlWebpackPlugins(),
        ],
        mode: "development",
        devtool: "source-map",
        target: ["web", "es5"],
        module: {
            rules: [
                { test: /fabric(\.min)?\.js$/, use: "exports-loader?exports=fabric" },
                {
                    test: /\.tsx?$/,
                    use: [{ loader: "ts-loader", options: { logLevel: "info" } }],
                    exclude: /node_modules/,
                },
                { test: /\.css$/i, use: [MiniCssExtractPlugin.loader, "css-loader"] },
                { test: /\.js$/, enforce: "pre", use: ["source-map-loader"] },
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
            filename: `${version}/[name].js`,
            path: path.resolve(__dirname, "Pages"),
            publicPath: "/Pages/",
            clean: true,
        },
        devServer: {
            headers: { "Access-Control-Allow-Origin": "*" },
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