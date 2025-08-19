/**
 * Webpack configuration file for the MHA project.
 *
 * This configuration file sets up various plugins and settings for building the project,
 * including handling TypeScript files, CSS extraction, HTML template generation, and more.
 *
 * Plugins used:
 * - FileManagerPlugin: Manages file operations like copying resources.
 * - ForkTsCheckerWebpackPlugin: Runs TypeScript type checking in a separate process.
 * - HtmlWebpackPlugin: Generates HTML files for each page.
 * - MiniCssExtractPlugin: Extracts CSS into separate files.
 * - webpack.DefinePlugin: Defines global constants.
 *
 * Functions:
 * - getHttpsOptions: Asynchronously retrieves HTTPS options for the development server.
 * - getHash: Generates a short hash from a given string.
 * - generateEntry: Generates an entry object for webpack configuration.
 * - generateHtmlWebpackPlugins: Generates an array of HtmlWebpackPlugin instances for each page.
 *
 * Environment Variables:
 * - SCM_COMMIT_ID: The commit ID used to generate a version hash.
 * - APPINSIGHTS_INSTRUMENTATIONKEY: Application Insights instrumentation key.
 * - npm_package_config_dev_server_port: Port for the development server.
 *
 * @param {Object} env - Environment variables passed to the webpack configuration.
 * @param {Object} options - Options passed to the webpack configuration.
 * @returns {Promise<Object>} The webpack configuration object.
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");

const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin"); // eslint-disable-line @typescript-eslint/naming-convention
const HtmlWebpackPlugin = require("html-webpack-plugin"); // eslint-disable-line @typescript-eslint/naming-convention
const MiniCssExtractPlugin = require("mini-css-extract-plugin"); // eslint-disable-line @typescript-eslint/naming-convention
const devCerts = require("office-addin-dev-certs");
const webpack = require("webpack");

/**
 * Asynchronously retrieves HTTPS server options.
 *
 * This function attempts to get HTTPS server options using the `devCerts` library.
 * If successful, it returns an object containing the certificate authority (CA),
 * key, and certificate. If an error occurs, it logs the error and returns an empty object.
 *
 * @returns {Promise<{ca: string, key: string, cert: string} | {}>} A promise that resolves to an object with HTTPS options or an empty object if an error occurs.
 */
async function getHttpsOptions() {
    try {
        const httpsOptions = await devCerts.getHttpsServerOptions();
        return { ca: httpsOptions.ca, key: httpsOptions.key, cert: httpsOptions.cert };
    } catch (error) {
        console.error("Error getting HTTPS options:", error);
        return {};
    }
}

/**
 * Generates a hash for a given string.
 * Used to reduce commit ID to something short.
 *
 * @param {string} str - The input string to hash.
 * @returns {string} The hexadecimal representation of the hash.
 */
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
    { name: "mha", script: "mha" },
    { name: "uitoggle", script: "uiToggle" },
    { name: "newDesktopFrame", script: "newDesktopFrame" },
    { name: "classicDesktopFrame", script: "classicDesktopFrame" },
    { name: "newMobilePaneIosFrame", script: "newMobilePaneIosFrame" },
    { name: "privacy", script: "privacy" },
    // Redirection/static pages
    { name: "Default" }, // uitoggle.html?default=classic
    { name: "DefaultPhone" }, // uitoggle.html?default=classic
    { name: "DefaultTablet" }, // uitoggle.html?default=classic
    { name: "DesktopPane" }, // uitoggle.html?default=new
    { name: "MobilePane" }, // uitoggle.html?default=new-mobile
    { name: "Functions" },
];

/**
 * Generates an entry object for webpack configuration.
 *
 * This function iterates over a list of pages and constructs an entry object
 * where each key is the name of a script and the value is the path to the
 * corresponding TypeScript file.
 * Entry object looks like this:
 * {
 * 'mha': './src/Scripts/ui/mha.ts',
 * 'uiToggle': './src/Scripts/ui/uiToggle.ts',
 * ...
 * }
 *
 * @returns {Object} An object representing the entry points for webpack.
 */
function generateEntry() {
    return pages.reduce((config, page) => {
        if (page.script) {
            config[page.script] = `./src/Scripts/ui/${page.script}.ts`;
        }
        return config;
    }, {});
}

/**
 * Generates an array of HtmlWebpackPlugin instances for each page.
 * One looks like this:
 * new HtmlWebpackPlugin ({
 *  inject: true,
 *  template: './src/Pages/mha.html',
 *  filename: 'mha.html',
 *  chunks: [ 'mha' ]
 * })
 *
 * This is how our actual html files are generated, with includes for the appropriate scripts and CSS.
 *
 * @returns {HtmlWebpackPlugin[]} An array of HtmlWebpackPlugin instances.
 */
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
                __VERSION__: JSON.stringify(version), // eslint-disable-line @typescript-eslint/naming-convention
                __AIKEY__: JSON.stringify(aikey), // eslint-disable-line @typescript-eslint/naming-convention
                __BUILDTIME__: JSON.stringify(buildTime), // eslint-disable-line @typescript-eslint/naming-convention
            }),
            new ForkTsCheckerWebpackPlugin(),
            ...generateHtmlWebpackPlugins(),
        ],
        mode: "development",
        devtool: "source-map",
        target: ["web", "es2022"],
        module: {
            rules: [
                {
                    test: /fabric(\.min)?\.js$/,
                    use: [{
                        loader: "exports-loader",
                        options: {
                            type: "commonjs",
                            exports: "fabric"
                        }
                    }]
                },
                {
                    test: /\.tsx?$/,
                    use: [{ loader: "ts-loader", options: { logLevel: "info" } }],
                    exclude: /node_modules/,
                },
                { test: /\.css$/i, use: [MiniCssExtractPlugin.loader, "css-loader"] },
                { test: /\.js$/, enforce: "pre", use: ["source-map-loader"] },
                {
                    test: /\.(gif|jpg|jpeg|png|svg)$/i,
                    type: 'asset/resource',
                    generator: {
                        filename: 'Resources/[name][ext]'
                    }
                },
                {
                    test: /\.(woff|woff2|ttf|eot)$/i,
                    type: 'asset/resource',
                    generator: {
                        filename: 'fonts/[name][ext]'
                    }
                }
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
            headers: { "Access-Control-Allow-Origin": "*" }, // eslint-disable-line @typescript-eslint/naming-convention
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