const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: './src/public/js/main.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'src/public/dist'),
    },
    resolve: {
        alias: {
            locales: 'moment/min/locales',
            'jquery.inputmask': 'jquery.inputmask/dist/jquery.inputmask.bundle',
            fancytree: 'jquery.fancytree/dist/jquery.fancytree.min',
        },
        extensions: ['.js', '.jsx'],
        modules: ['node_modules', 'bower_components'],
    },

    devtool: 'source-map',

    module: {
        loaders: [
            {
                test: /app/,
                use: 'imports-loader?backbone',
            },
            {
                test: /lightslider/,
                use: 'imports-loader?jQuery=jquery',
            },
            {
                test: /fancytree/,
                use: 'imports-loader?jQuery=jquery,jqueryui',
            },
            {
                test: /jquery.inputmask/,
                use: 'imports-loader?jQuery=jquery',
            },
            {
                test: /rater-jquery/,
                use: 'imports-loader?jQuery=jquery',
            },
            {
                test: /\.html$/,
                loader: 'html-loader',
            },
            {
                test: /\.(png|ico|jpg|gif|svg|ttf|eot|woff|woff2)/,
                exclude: /\/node_modules\//,
                loader: 'file-loader?name=[path][name].[ext]',
            },
            {
                test: /\.css$/,
                loader: 'style-loader!css-loader',
            },
        ],
    },

    plugins: [
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/), // saves ~100k from build
        //new webpack.optimize.UglifyJsPlugin({ minimize: true }),
        new HtmlWebpackPlugin({
            template: './src/public/templates/index.html',
            inject: 'body',
        }),
    ],
};
