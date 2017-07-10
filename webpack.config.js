const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: './src/index.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    resolve: {
        alias: {
            async: './libs/async/lib/async',
            'js-cookie': './libs/js-cookie/src/js.cookie',
            jQuery: './libs/jquery/dist/jquery.min',
            imageCrop: './libs/Jcrop/js/jquery.Jcrop.min',
            jqueryui: './libs/jquery-ui/jquery-ui.min',
            Underscore: './libs/underscore/underscore-min',
            backbone: './libs/backbone/backbone-min',
            'backbone.radio': './libs/backbone.radio/build/backbone.radio',
            templates: '../templates',
            text: './libs/requirejs-text/text',
            helpers: 'helpers',
            constants: 'constants',
            d3: './libs/d3/d3.min',
            moment: './libs/moment/moment',
            locales: './libs/moment/min/locales',
            scrollBar: './libs/malihu-custom-scrollbar-plugin/jquery.mCustomScrollbar.concat.min',
            rater: './libs/rater/rater',
            tree: './libs/fancytree/dist/jquery.fancytree-all.min',
            'jquery-rater': './libs/jquery-bar-rating/dist/jquery.barrating.min',
            'ckeditor-core': './libs/ckeditor/ckeditor',
            'ckeditor-jquery': './libs/ckeditor/adapters/jquery',
            'jquery-masked-field': './libs/jquery.inputmask/dist/jquery.inputmask.bundle',
            sprintf: './libs/sprintf/dist/sprintf.min',
            minigrid: './libs/minigrid/dist/minigrid.min',
            socketio: '/socket.io/socket.io.js',
            lodash: './libs/lodash/lodash',
            marionette: './libs/backbone.marionette/lib/backbone.marionette',
            dropzone: './libs/dropzone/dist/dropzone-amd-module',
            shortId: './libs/js-shortid/dist/js-shortid',
            lightSlider: './libs/lightslider/dist/js/lightslider',
        },
    },
    module: {
        loaders: [
            { test: /Underscore/, loader: 'exports?_' },
            { test: /backbone/, loader: 'exports?Backbone!imports?underscore,jquery' },
        ],
    },
    plugins: [
        new webpack.IgnorePlugin(/^\.\/locale$/, [/moment$/]), // saves ~100k from build
        new webpack.optimize.UglifyJsPlugin({ minimize: true }),
    ],
};
