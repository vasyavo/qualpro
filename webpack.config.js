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
            async: path.resolve(__dirname, 'src/public/js/libs/async/lib/async'),
            'js-cookie': path.resolve(__dirname, 'src/public/js/libs/js-cookie/src/js.cookie'),
            jquery: path.resolve(__dirname, 'src/public/js/libs/jquery/dist/jquery.min'),
            imageCrop: path.resolve(__dirname, 'src/public/js/libs/Jcrop/js/jquery.Jcrop.min'),
            jqueryui: path.resolve(__dirname, 'src/public/js/libs/jquery-ui/jquery-ui.min'),
            underscore: path.resolve(__dirname, 'src/public/js/libs/underscore/underscore-min'),
            backbone: path.resolve(__dirname, 'src/public/js/libs/backbone/backbone-min'),
            'backbone.radio': path.resolve(__dirname, 'src/public/js/libs/backbone.radio/build/backbone.radio'),
            d3: path.resolve(__dirname, 'src/public/js/libs/d3/d3.min'),
            moment: path.resolve(__dirname, 'src/public/js/libs/moment/moment'),
            locales: path.resolve(__dirname, 'src/public/js/libs/moment/min/locales'),
            scrollBar: path.resolve(__dirname, 'src/public/js/libs/malihu-custom-scrollbar-plugin/jquery.mCustomScrollbar.concat.min'),
            rater: path.resolve(__dirname, 'src/public/js/libs/rater/rater'),
            tree: path.resolve(__dirname, 'src/public/js/libs/fancytree/dist/jquery.fancytree-all.min'),
            'jquery-rater': path.resolve(__dirname, 'src/public/js/libs/jquery-bar-rating/dist/jquery.barrating.min'),
            'ckeditor-core': path.resolve(__dirname, 'src/public/js/libs/ckeditor/ckeditor'),
            'ckeditor-jquery': path.resolve(__dirname, 'src/public/js/libs/ckeditor/adapters/jquery'),
            'jquery-masked-field': path.resolve(__dirname, 'src/public/js/libs/jquery.inputmask/dist/jquery.inputmask.bundle'),
            'jquery-mousewheel': path.resolve(__dirname, 'src/public/js/libs/jquery-mousewheel/jquery.mousewheel'),
            sprintf: path.resolve(__dirname, 'src/public/js/libs/sprintf/dist/sprintf.min'),
            minigrid: path.resolve(__dirname, 'src/public/js/libs/minigrid/dist/minigrid.min'),
            lodash: path.resolve(__dirname, 'src/public/js/libs/lodash/lodash'),
            marionette: path.resolve(__dirname, 'src/public/js/libs/backbone.marionette/lib/backbone.marionette'),
            dropzone: path.resolve(__dirname, 'src/public/js/libs/dropzone/dist/dropzone-amd-module'),
            shortId: path.resolve(__dirname, 'src/public/js/libs/js-shortid/dist/js-shortid'),
            lightSlider: path.resolve(__dirname, 'src/public/js/libs/lightslider/dist/js/lightslider'),
        },
        extensions : ['.js', '.jsx'],
        modules : ['src', 'node_modules', 'bower_components']
    },

    devtool : 'source-map',

    module : {
        loaders : [
            {
                test: /jquery/,
                use: [
                    'expose-loader?jquery',
                ]
            },
            {
                test: /underscore/,
                use: [
                    'expose-loader?underscore',
                ]
            },
            {
                test: /backbone/,
                use: [
                    'expose-loader?backbone',
                    'imports-loader?this=>window,jquery,underscore'
                ]
            },
            {
                test: /ckeditor-core/,
                loader: 'expose-loader?ckeditor-core'
            },
            {
                test: /jqueryui/,
                loader: 'imports-loader?this=>window,jquery'
            },
            {
                test: /imageCrop/,
                loader: 'imports-loader?this=>window,jquery'
            },
            {
                test: /scrollBar/,
                loader: 'imports-loader?this=>window,jquery,jquery-mousewheel'
            },
            {
                test: /rater/,
                loader: 'imports-loader?this=>window,jquery'
            },
            {
                test: /ckeditor-jquery/,
                loader: 'imports-loader?this=>window,jquery,ckeditor-core'
            },
            {
                test: /jquery-masked-field/,
                loader: 'imports-loader?this=>window,jquery'
            },
            {
                test: /d3/,
                loader: 'expose-loader?d3'
            },
            {
                test : /\.html$/,
                loader : 'html-loader'
            },
            {
                test : /\.(png|ico|jpg|gif|svg|ttf|eot|woff|woff2)/,
                exclude : /\/node_modules\//,
                loader : 'file-loader?name=[path][name].[ext]'
            },
            {
                test : /\.css$/,
                loader : 'style-loader!css-loader'
            },
        ]
    },

    plugins: [
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/), // saves ~100k from build
        new webpack.optimize.UglifyJsPlugin({ minimize: true }),
        new HtmlWebpackPlugin({
            template : './src/public/templates/index.html',
            inject : 'body'
        }),
    ],
};
