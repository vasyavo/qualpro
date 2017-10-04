var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var populate = require('../populate');
var FilterView = require('../views/filter/filtersBarView');
var filterBarTemplate = require('../../templates/filter/filterBar.html');
var CONSTANTS = require('../constants/otherConstants');
var FILTERS_CONSTANTS = require('../constants/filters');
var dataService = require('../dataService');
var CONTENT_TYPES = require('../constants/contentType');
var custom = require('../custom');
var App = require('../appState');

module.exports = Backbone.View.extend({
    filterBarTemplate: _.template(filterBarTemplate),

    stopPropagation: function (e) {
        e.stopPropagation();
    },

    goTo: function () {
        var id = this.model.get('_id');
        var modelJSON = this.model.toJSON();
        var viewType = custom.getCurrentVT({contentType: this.contentType}) || 'list';
        var filter = {
            _id: {
                values: [id],
                type  : 'ObjectId'
            }
        };
        var currentUserId;
        var url;
        var tabName = 'all';
        var coveredUsersIds;

        if ([CONTENT_TYPES.OBJECTIVES, CONTENT_TYPES.INSTORETASKS].indexOf(this.contentType) !== -1) {
            currentUserId = App.currentUser._id;
            if (modelJSON.createdBy && modelJSON.createdBy.user && modelJSON.createdBy.user._id === currentUserId) {
                tabName = 'createdByMe';
            } else if (_.filter(modelJSON.assignedTo, function (user) { return user._id === currentUserId; }).length) {
                tabName = 'assignedToMe';
            } else {
                coveredUsersIds = Object.keys(App.currentUser.covered);
                if (coveredUsersIds.length && _.filter(modelJSON.assignedTo, function (user) { return coveredUsersIds.indexOf(user._id) !== -1 || coveredUsersIds.indexOf(user.createdBy.user._id) !== -1; }).length) {
                    tabName = 'myCover';
                }
            }
        }

        url = '#qualPro/' + this.contentType + '/' + tabName + '/' + viewType + '/filter=' + encodeURIComponent(JSON.stringify(filter));
        Backbone.history.navigate(url, {trigger: true});
    },

    checkForEmptyInput: function (collection, $el) {
        var filesToDelete = _.map(collection.models, function (file) {
            if (!file.get('contentType') && !file.get('name')) {
                $el.find('#' + file.cid).remove();
                return file;
            }
        });
        if (filesToDelete.length) {
            collection.remove(filesToDelete);
        }

    },

    showHideActionDropdown: function (e) {
        e.stopPropagation();

        var targetEl = $(e.target);
        var parrentDiv = targetEl.closest('div');
        var ulContainer = parrentDiv.find('ul');

        ulContainer.toggleClass('showActionDropDown');
    },

    makeRender: function (options) {
        _.bindAll(this, 'render', 'afterRender');
        var self = this;

        options = options || {};

        this.render = _.wrap(this.render, function (render) {
            self.beforeRender(options);
            render();
            self.afterRender(options);
            return self;
        });
    },

    beforeRender: function (options) {
        if (options.translation) {
            this.translation = options.translation;
        }
    },

    afterRender: function (options) {
        var $curEl = this.$el;
        var self = this;
        var canvasSize = CONSTANTS.CANVAS_SIZE;
        var canvas;
        var contentType = options.contentType || null;
        var ifFilter = FILTERS_CONSTANTS.FILTERS.hasOwnProperty(contentType);

        if (ifFilter) {
            if (!App.filterCollections) {
                App.filterCollections = {};
            }

            if (!App.filterCollections[contentType]) {
                dataService.getData('/filters/' + contentType, {filter: this.filter}, function (err, result) {
                    if (err) {
                        return App.render(err);
                    }

                    App.filterCollections[contentType] = result;
                    self.appFiltersCollectionLoaded(options);
                });
            } else {
                this.appFiltersCollectionLoaded(options);
            }
        }

        $curEl
            .tooltip({
                items   : '*.hoverFullText',
                position: {
                    at       : 'top+40',
                    my       : 'top',
                    collision: 'flip'
                },
                open    : function (event, ui) {
                },
                content : function () {
                    return $(this).prop('innerText');
                }
            });

        $curEl.find('.scrollable').mCustomScrollbar();
        $curEl.find('.scrollable-yx').mCustomScrollbar({
            axis: 'yx'
        });
        $curEl
            .find('.tabs')
            .tabs({
                activate: function (event, ui) {
                    var $target = ui.newTab;
                    var $newPanel = ui.newPanel;
                    var id = $newPanel.attr('id');
                    var width = $target.attr('data-width') || 'auto';

                    if (['monthly', 'biYearly'].indexOf(id) !== -1) {
                        self.trigger('$tabsChanged', id);
                    }

                    if (self.contentType === CONTENT_TYPES.INSTORETASKS || self.contentType === CONTENT_TYPES.OBJECTIVES) {
                        self.showHideTopButtons(ui);
                    }

                    $target.closest('.dialog_js').dialog('option', 'width', width);
                }
            });

        canvas = $curEl.find('.avatar canvas');

        canvas.attr('width', canvasSize);
        canvas.attr('height', canvasSize);

        $curEl.on('dialogbeforeclose', function () {
            var keys;

            if (self.filterView) {
                keys = Object.keys(self.filterView.filter);
                keys.forEach(function (key) {
                    var collection = self.filterView.filtersCollections[key];

                    if (collection) {
                        collection.unselectAll();
                    }
                });

                App.filterCollections = self.filterView.filtersCollections;
            }
        });

        App.masonryGrid.call(this.$el);
    },

    appFiltersCollectionLoaded: function (options) {
        var $curEl = this.$el;
        var filterHolder;
        var $filterBar = $curEl.find('.filterBar');
        var self = this;

        if ($filterBar.length) {
            if (options.contentType === 'createQuestionnary') {
                $filterBar.html(this.filterBarTemplate({
                    showHeader : false,
                    showClear  : true,
                    translation: options.translation
                }));
            } else {
                $filterBar.html(this.filterBarTemplate({
                    showHeader : true,
                    showClear  : true,
                    translation: options.translation
                }));
            }
            filterHolder = $filterBar.find('.filtersFullHolder');
            options.el = filterHolder;
            this.filterView = new FilterView(options);

            this.filterView.bind('filter', function (filter) {
                self.filter = filter;
            });
            this.filterView.render();
        }
    },

    pageAnimation: function (direction, $holder) {
        // do not remove this function
    },

    setCanvasSize: function (width, height) {
        var $curEl = this.$el;
        var canvas = $curEl.find('.avatar canvas');

        width = width || CONSTANTS.CANVAS_SIZE;
        height = height || CONSTANTS.CANVAS_SIZE;

        canvas.attr('width', width);
        canvas.attr('height', height);
    },

    disableEvent: function (e) {
        e.preventDefault();

        this.trigger('disableEvent', e, [this.model.get('_id')]);
    },

    showHideArabicName: function (e) {
        e.preventDefault();

        var targetEl = $(e.target);
        var parentEl = targetEl.closest('.cell');
        var arabicNameBox = parentEl.find('.nameAr');

        arabicNameBox.toggle();
    },

    domainsToNames: function (user, lang) {
        var anotherLang;

        lang = lang || 'en';
        anotherLang = lang === 'en' ? 'ar' : 'en';

        _.each(user, function (value, key) {
            if (_.isArray(value)) {
                user[key] = _.reduce(value, function (memo, domain) {
                    var curName;
                    if (domain && domain.name) {
                        curName = domain.name[lang] || domain.name[anotherLang];
                        if (!memo) {
                            return curName;
                        } else {
                            return memo + ', ' + curName;
                        }
                    }
                }, '');
            }
        });

        return user;
    },

    getTypeFromContentType: function (contentType) {
        if (CONSTANTS.IMAGE_CONTENT_TYPES.indexOf(contentType) !== -1) {
            return 'image_icon';
        } else if (CONSTANTS.VIDEO_CONTENT_TYPES.indexOf(contentType) !== -1) {
            return 'video_icon';
        } else if (CONSTANTS.MS_WORD_CONTENT_TYPES.indexOf(contentType) !== -1) {
            return 'word_icon';
        } else if (CONSTANTS.MS_EXCEL_CONTENT_TYPES.indexOf(contentType) !== -1) {
            return 'excel_icon';
        } else if (CONSTANTS.MS_POWERPOINT_CONTENT_TYPES.indexOf(contentType) !== -1) {
            return 'powerpoint_icon';
        } else {
            return 'pdf_icon';
        }
    },

    hideNewSelect: function () {
        $('.newSelectList').hide();
    },

    notHide      : function () {
        return false;
    },
    nextSelect   : function (e) {
        this.showNewSelect(e, false, true);
    },
    prevSelect   : function (e) {
        this.showNewSelect(e, true, false);
    },
    showNewSelect: function (e, prev, next) {
        var $target = $(e.target);

        if (!$target.hasClass('readonly')) {
            populate.showSelect(e, prev, next, this);
        }

        return false;
    },
    chooseOption : function (e) {
        var $target = $(e.target);
        var holder = $target.closest('.cell').find('.currentSelected');

        holder.text($target.text()).attr('data-id', $target.attr('id'));
    }
});
