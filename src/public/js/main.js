/**
 * @namespace App
 * @type {{file: {MAXSIZE: number, MaxFileSizeDisplay: string}, requestedURL: null, savedFilters: {}}}
 */

var App = App ||
    {
        file: {
            MAXSIZE           : 10485760,  //size in kilobytes  = 3 MB
            MaxFileSizeDisplay: '10 MB'
        },

        requestedURL: null
    };

require.config({
    paths: {
        async                : './libs/async/lib/async',
        'js-cookie'          : './libs/js-cookie/src/js.cookie',
        jQuery               : './libs/jquery/dist/jquery.min',
        imageCrop            : './libs/Jcrop/js/jquery.Jcrop.min',
        jqueryui             : './libs/jquery-ui/jquery-ui.min',
        Underscore           : './libs/underscore/underscore-min',
        backbone : './libs/backbone/backbone-min',
        'backbone.radio' : './libs/backbone.radio/build/backbone.radio',
        templates            : '../templates',
        text                 : './libs/requirejs-text/text',
        helpers              : 'helpers',
        constants            : 'constants',
        d3                   : './libs/d3/d3.min',
        moment               : './libs/moment/moment',
        locales              : './libs/moment/min/locales',
        scrollBar            : './libs/malihu-custom-scrollbar-plugin/jquery.mCustomScrollbar.concat.min',
        rater                : './libs/rater/rater',
        tree                 : './libs/fancytree/dist/jquery.fancytree-all.min',
        'jquery-rater'       : './libs/jquery-bar-rating/dist/jquery.barrating.min',
        'ckeditor-core'      : './libs/ckeditor/ckeditor',
        'ckeditor-jquery'    : './libs/ckeditor/adapters/jquery',
        'jquery-masked-field': './libs/jquery.inputmask/dist/jquery.inputmask.bundle',
        sprintf              : './libs/sprintf/dist/sprintf.min',
        minigrid             : './libs/minigrid/dist/minigrid.min',
        socketio             : '/socket.io/socket.io.js',
        lodash               : './libs/lodash/lodash',
        marionette : './libs/backbone.marionette/lib/backbone.marionette',
        dropzone: './libs/dropzone/dist/dropzone-amd-module',
    },
    shim : {
        jqueryui : ['jQuery'],
        imageCrop: ['jQuery'],
        backbone : ['Underscore', 'jQuery'],
        app      : ['backbone', 'jqueryui', 'imageCrop'],
        d3       : {
            exports: 'd3'
        },

        scrollBar : ['jQuery'],
        rater     : ['jQuery'],
        Underscore: {
            exports: '_'
        },

        jQuery: {
            exports: '$'
        },

        'ckeditor-core': {
            exports: 'CKEDITOR'
        },

        'ckeditor-jquery'    : ['jQuery', 'ckeditor-core'],
        'jquery-masked-field': ['jQuery']
    }
});

require([
    'backbone',
    'jQuery',
    'app',
    'minigrid'
], function (Backbone, $, app, MiniGrid) {
    var Store = function () {
        this.save = function (name, data) {
            localStorage.setItem(name, JSON.stringify(data));
        };
        this.find = function (name) {
            var store = localStorage.getItem(name);
            return (store && JSON.parse(store)) || null;
        };
        this.remove = function (name) {
            localStorage.removeItem(name);
        };
    };

    App.storage = new Store();

    App.errorContainer = $('#errorHandler');

    /**
     *
     * @param {object} data
     * @param {string} [data.type] Type of message. Can be on of {`error`|`notification`|`alert`}.
     * Default `error`
     * @param {string} data.message Body of message. Field is required.
     * @example
     *     App.render({type: 'notification', message: 'New tasks are available'})
     * @memberof App
     */

    App.render = function (data) {
        var $container = this.errorContainer;
        var messageClass = data.type || 'error';
        var index = data.index || 1;
        var text = data.message || 'Something went wrong';
        var $renderEl = $('<div class="animate ' + messageClass + '">' + text + '</div>');

        $container.append($renderEl);

        setTimeout(function () {
            $renderEl.remove();
        }, (index + 1) * 2500);
    };

    App.showPopUp = function (options) {
        require(['views/popUp'], function (PopUpView) {
            new PopUpView(options);
        });
    };

    App.renderErrors = function (errors) {
        var errorsLength = errors.length;

        function renderCurrent(index) {
            var message = errors[index];

            setTimeout(function () {
                App.render({type: 'error', message: message, index: index});
            }, (index + 1) * 500);

        }

        if (errorsLength > 0) {
            for (var i = errorsLength - 1;
                 i >= 0;
                 i--) {
                renderCurrent(i);
            }
        }
    };

    App.setMenuCount = function (id, count) {
        var $curEl = $('#leftMenuHolder');
        var $el = $curEl.find('#' + id);

        if (count) {
            $el.attr('data-count', count);
        } else {
            $el.removeAttr('data-count');
        }
    };

    App.setMenuNotificationCount = function (count) {
        var $curEl = $('#topMenuHolder');
        var $el = $curEl.find('#notificationCount');

        if (count) {
            $el.text(count);
            $el.removeClass('hidden');
        } else {
            $el.text(0);
            $el.addClass('hidden');
        }
    };

    App.masonryGrid = function (elClass, wrapClass, between) {
        var betweenWidth = between || 12;
        var elClassName = elClass || '.masonryThumbnail';
        var wrapClassName = wrapClass || '.masonryThumbnailsWrapper';
        var grid;

        if (!this.find(wrapClassName).length) {
            return false;
        }

        grid = new MiniGrid({
            container: wrapClassName,
            item     : elClassName,
            gutter   : betweenWidth
        });

        grid.mount();

        return grid;
    };

    Backbone._sync = Backbone.sync;
    // override original sync method to make header request contain csrf token
    Backbone.sync = function (method, model, options, error) {
        options.beforeSend = function (xhr) {
            xhr.setRequestHeader('X-CSRF-Token', $("meta[name='csrf-token']").attr('content'));
        };
        /* proxy the call to the old sync method */
        return Backbone._sync(method, model, options, error);
    };

    String.prototype.capitalizer = function (filter) {
        var self = this;

        function capitalize() {
            return self.replace(/\w\S*/g, function (txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            });
        }

        function firstCapitalize() {
            return self.substr(0, 1).toUpperCase() + self.substr(1);
        }

        switch (filter) {
            case 'caps':
                return capitalize();
                break;
            case 'firstCaps':
                return firstCapitalize();
                break;
            case 'upper':
                return this.toUpperCase();
                break;
            case 'lower':
                return this.toLowerCase();
                break;
        }
    };

    //region Array extensions

    if (!Array.prototype.find) {
        Array.prototype.find = function (predicate) {
            var element;

            if (typeof predicate !== 'function') {
                element = predicate;
                predicate = function (arrayElement) {
                    return arrayElement === element
                };
            }

            for (var i = this.length;
                 i--;) {
                if (predicate(this[i])) {
                    return this[i];
                }
            }

            return null;
        };
    }

    /**
     *
     * @param predicate - condition function that will check every element in array and add it to result array if function returns true
     * @returns {Array} - array of elements from original array that match specified condition function - predicate
     */
    Array.prototype.where = function (predicate) {
        var result = [];

        this.forEach(function (element) {
            if (predicate(element)) {
                result.push(element);
            }
        });

        return result;
    };

    Array.prototype.contains = function (predicate) {
        if (typeof predicate == 'function') {
            return !!this.find(predicate);
        } else {
            return !!~this.indexOf(predicate);
        }
    };

    Object.defineProperty(Object.prototype, 'getNestedProperty', {
        value     : function (propertyFullName) {
            var result = this;
            var names = propertyFullName.split('.');
            var name;

            var getResult = function (result) {
                if (Array.isArray(result)) {
                    result = result.map(function (resultItem) {
                        if (resultItem) {
                            if (Array.isArray(resultItem)) {
                                return getResult(resultItem);
                            } else {
                                return resultItem[name];
                            }
                        }
                    });
                } else {
                    result = result[name];
                }

                return result;
            };

            while (names.length && result) {
                name = names.shift();
                result = getResult(result);
            }

            return result;
        },
        enumerable: false
    });
    app.initialize();
    app.applyDefaults();
});
