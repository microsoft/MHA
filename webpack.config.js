/**
 * Webpack configuration file for the MHA project.
 *
 * This configuration file sets up various plugins and settings for building the project,
 * including handling TypeScript files, CSS extraction, HTML template generation, and more.
 * The configuration is environment-aware, with different optimizations for development and production.
 *
 * Plugins used:
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

import path from "path";
import { fileURLToPath } from "url";

import CopyWebpackPlugin from "copy-webpack-plugin";
import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import devCerts from "office-addin-dev-certs";
import webpack from "webpack";
import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

export default async (env, options) => {
    console.log("🚀 Starting webpack config function");
    console.log("📋 env:", env);
    console.log("📋 options:", options);

    const isProduction = options.mode === "production";
    console.log("🏭 isProduction:", isProduction);
    console.log("Starting webpack.config.js - isProduction:", isProduction);

    console.log("📦 Generating entry points...");
    const config = {
        entry: generateEntry(),
        plugins: [
            new MiniCssExtractPlugin({ filename: `${version}/[name].css` }),
            new webpack.DefinePlugin({
                __VERSION__: JSON.stringify(version),
                __AIKEY__: JSON.stringify(aikey),
                __BUILDTIME__: JSON.stringify(buildTime),
            }),
            new ForkTsCheckerWebpackPlugin(),
            // Custom plugin to log compilation start/end times with timestamps
            {
                apply(compiler) {
                    compiler.hooks.watchRun.tap("TimestampPlugin", () => {
                        const timestamp = new Date().toISOString().replace("T", " ").substr(0, 19);
                        console.log(`\n🔄 [${timestamp}] WEBPACK RECOMPILATION STARTED`);
                    });

                    compiler.hooks.done.tap("TimestampPlugin", (stats) => {
                        const timestamp = new Date().toISOString().replace("T", " ").substr(0, 19);
                        const compilationTime = stats.endTime - stats.startTime;
                        console.log(`✅ [${timestamp}] WEBPACK RECOMPILATION COMPLETED (${compilationTime}ms)\n`);
                    });

                    compiler.hooks.invalid.tap("TimestampPlugin", (fileName) => {
                        const timestamp = new Date().toISOString().replace("T", " ").substr(0, 19);
                        console.log(`📝 [${timestamp}] FILE CHANGED: ${fileName}`);
                    });
                }
            },
            new CopyWebpackPlugin({
                patterns: [
                    { from: "src/Resources/*", to: path.resolve(__dirname, "Resources/[name][ext]") },
                    { from: "src/data/rules.json", to: path.resolve(__dirname, "Pages/data/[name][ext]") }
                ]
            }),
            ...generateHtmlWebpackPlugins(),
            // Bundle analyzer (when env.analyze is set)
            ...(env?.analyze ? [new BundleAnalyzerPlugin({
                analyzerMode: "static",
                openAnalyzer: false,
                reportFilename: "../Pages/bundle-analysis/bundle-report.html",
            })] : []),
        ],
        mode: isProduction ? "production" : "development",
        devtool: isProduction ? "source-map" : "source-map",
        target: ["web", "es2022"],
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: [{
                        loader: "ts-loader",
                        options: {
                            logLevel: "info",
                            transpileOnly: true, // Let ForkTsCheckerWebpackPlugin handle type checking
                            experimentalWatchApi: true, // Faster incremental builds
                        }
                    }],
                    exclude: /node_modules/,
                },
                { test: /\.css$/i, use: [MiniCssExtractPlugin.loader, "css-loader"] },
                { test: /\.js$/, enforce: "pre", use: ["source-map-loader"] },
                {
                    test: /\.(gif|jpg|jpeg|png|svg)$/i,
                    type: "asset/resource",
                    generator: {
                        filename: "Resources/[name][ext]"
                    }
                },
                {
                    test: /\.(woff|woff2|ttf|eot)$/i,
                    type: "asset/resource",
                    generator: {
                        filename: "fonts/[name][ext]"
                    }
                },
                {
                    test: /\.json$/i,
                    type: "asset/resource",
                    generator: {
                        filename: "data/[name][ext]"
                    }
                }
            ],
        },
        optimization: {
            runtimeChunk: "single",
            splitChunks: {
                chunks: "all",
                maxInitialRequests: Infinity,
                minSize: 20000, // 20KB minimum chunk size
                maxSize: 500000, // 500KB maximum chunk size
                cacheGroups: {
                    // Framework libraries (React, Vue, etc. if any)
                    framework: {
                        test: /[\\/]node_modules[\\/](react|react-dom|vue|angular)[\\/]/,
                        name: "framework",
                        priority: 40,
                        reuseExistingChunk: true,
                    },
                    // Large libraries that should be separate
                    largeLibs: {
                        test: /[\\/]node_modules[\\/](framework7|lodash|moment|date-fns)[\\/]/,
                        name: "large-libs",
                        priority: 30,
                        reuseExistingChunk: true,
                    },
                    // Office/Microsoft specific libraries
                    office: {
                        test: /[\\/]node_modules[\\/](office-addin|@microsoft)[\\/]/,
                        name: "office-libs",
                        priority: 25,
                        reuseExistingChunk: true,
                    },
                    // Utilities and smaller libraries
                    vendor: {
                        test: /[\\/]node_modules[\\/]/,
                        name: "vendors",
                        priority: 20,
                        reuseExistingChunk: true,
                        maxSize: 200000, // 200KB - more aggressive splitting
                        minSize: 30000, // 30KB minimum
                    },
                    // Common code between entry points
                    common: {
                        name: "common",
                        minChunks: 2,
                        priority: 10,
                        reuseExistingChunk: true,
                    },
                    // Default group for everything else
                    default: {
                        minChunks: 2,
                        priority: 5,
                        reuseExistingChunk: true,
                    }
                }
            },
        },
        resolve: {
            extensions: [".tsx", ".ts", ".js"],
            // Improve module resolution performance
            alias: {
                "@": path.resolve(__dirname, "src"),
                "@scripts": path.resolve(__dirname, "src/Scripts"),
                "@styles": path.resolve(__dirname, "src/Content"),
            },
        },
        output: {
            filename: `${version}/[name].js`,
            path: path.resolve(__dirname, "Pages"),
            publicPath: "/Pages/",
            clean: true,
            chunkLoadingGlobal: "mhaChunkLoad",
            crossOriginLoading: "anonymous",
            asyncChunks: true,
            compareBeforeEmit: true,
        },
        devServer: {
            headers: {
                "Access-Control-Allow-Origin": "*", // eslint-disable-line @typescript-eslint/naming-convention
                "X-Content-Type-Options": "nosniff", // eslint-disable-line @typescript-eslint/naming-convention
                "X-XSS-Protection": "1; mode=block", // eslint-disable-line @typescript-eslint/naming-convention
                "Referrer-Policy": "no-referrer-when-downgrade", // eslint-disable-line @typescript-eslint/naming-convention
            },
            allowedHosts: "all", // Allow requests from any host (needed for OWA iframe)
            static: {
                directory: __dirname,
                watch: false, // Disable watching of static files
                publicPath: "/",
                serveIndex: true
            },
            watchFiles: {
                paths: [
                    "src/**/*.{ts,js,css}",
                    "src/Pages/*.html",
                    "src/data/rules.json"
                ],
                options: {
                    ignored: [
                        "**/.git/**",
                        "**/node_modules/**",
                        "**/coverage/**",
                        "**/*.map",
                        "**/*.log",
                        "**/*.md", // Explicitly ignore markdown files
                        ".gitignore",
                        ".gitattributes"
                    ],
                    usePolling: false,
                    ignoreInitial: true,
                },
            },
            server: {
                type: "https",
                options: env.WEBPACK_BUILD || options.https !== undefined ? options.https : await getHttpsOptions(),
            },
            port: process.env.npm_package_config_dev_server_port || 44336,
            compress: true, // Enable gzip compression
            hot: true, // Enable hot module replacement
            open: false, // Don't auto-open browser
            client: {
                overlay: {
                    errors: true,
                    warnings: false,
                },
                progress: true,
                logging: "verbose", // Changed from "info" to "verbose" for more details
                reconnect: 5,
            },
        },
        stats: {
            preset: "minimal",
            colors: true,
            timings: true,
            assets: false,
            chunks: false,
            modules: false,
            children: false,
            warnings: true,
            errors: true,
            errorDetails: true,
            logging: "info",
            loggingDebug: ["webpack.Progress"],
        },
        infrastructureLogging: {
            level: "info",
            debug: false,
        },
    };

    console.log("⚙️ Main config object created successfully");

    // Production-specific optimizations
    if (isProduction) {
        console.log("🏭 Applying production optimizations...");
        // Remove console.log statements in production
        config.optimization.minimizer = [
            "...",
            new webpack.DefinePlugin({
                // eslint-disable-next-line @typescript-eslint/naming-convention
                "console.log": "void 0",
            })
        ];

        // Add performance budgets with more realistic limits for chunked bundles
        config.performance = {
            maxAssetSize: 500000, // 500KB per asset (more realistic with chunking)
            maxEntrypointSize: 1000000, // 1MB per entry point (reduced from 1.5MB)
            hints: "warning",
        };

        // Production-specific optimization
        config.optimization.usedExports = true;
        config.optimization.sideEffects = false;
    } else {
        console.log("🛠️ Applying development optimizations...");
        // Development-specific optimizations
        config.cache = {
            type: "filesystem",
            buildDependencies: {
                config: [__filename],
            },
        };

        // Faster source map generation in development
        config.module.rules.forEach(rule => {
            if (rule.enforce === "pre" && rule.use && rule.use.includes("source-map-loader")) {
                rule.exclude = /node_modules/;
            }
        });
    }

    console.log("🎯 Webpack config completed successfully");
    return config;
};
