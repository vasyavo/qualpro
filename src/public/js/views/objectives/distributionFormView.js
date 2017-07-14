var $ = require('jQuery');
var _ = require('underscore');
var template = require('../../../templates/objectives/distributionTemplate.html');
var pagination = require('../../../templates/pagination/pagination.html');
var baseDialog = require('../../views/baseDialog');
var Collection = require('../../collections/distribution/collection');
var CONSTANTS = require('../../constants/otherConstants');
var ERROR_MESSAGES = require('../../constants/errorMessages');
var App = require('../../appState');

module.exports = baseDialog.extend({
    contentType       : 'Tree',
    imageSrc          : '',
    template          : _.template(template),
    paginationTemplate: _.template(pagination),
    collection        : null,
    model             : null,

    events: {
        'click .itemsNumber'              : 'switchPageCounter',
        'change #currentShowPage'         : 'showPage',
        'click .showPage'                 : 'showPage',
        'click #previousPage'             : 'previousPage',
        'click #nextPage'                 : 'nextPage',
        'click .allPage, .currentPageList': 'showPagesPopup'
    },

    initialize: function (options) {
        options = options || {};
        var self = this;
        var id = options.id;
        var currentLanguage = App.currentUser.currentLanguage;
        this.translation = options.translation;
        this.collection = new Collection({_id: id});
        this.collection.on('showMore', function (collection) {
            if (!collection.length) {
                return App.render({
                    type   : 'error',
                    message: ERROR_MESSAGES.distributionFormIsEmpty[currentLanguage]
                });
            }

            self.model = self.collection.at(0);
            self.makeRender();
            self.render();
        }, self);
    },

    preventDefaults: function (e) {
        e.preventDefault();
        e.stopPropagation();
    },

    switchPageCounter: function (e) {
        var $ul = $(e.target).closest('ul');
        var itemsNumber;

        this.preventDefaults(e);

        $ul.toggle();

        itemsNumber = e.target.textContent;

        this.defaultItemsNumber = itemsNumber;

        this.collection.getPage(1, {
            count: itemsNumber,
            page : 1,
            _id  : this.model.get('_id')
        });
    },

    setPagination: function (options) {
        var $curEl = this.$el;
        var $pageList = $curEl.find('#pageList');
        var $curPageInput = $curEl.find('#currentShowPage');
        var $itemsNumber = $curEl.find('#itemsNumber');

        var currentPage = parseInt(options.currentPage) || parseInt($curPageInput.val());
        var itemsNumber = parseInt(options.itemsNumber) || parseInt($itemsNumber.text());

        var $gridStart = $curEl.find('#gridStart');
        var $gridEnd = $curEl.find('#gridEnd');
        var $gridCount = $curEl.find('#gridCount');

        var gridCount;
        var gridStartValue;
        var gridEndValue;
        var pageNumber;
        var $lastPage;

        currentPage = isNaN(currentPage) ? 1 : currentPage;

        if (isNaN(itemsNumber)) {
            itemsNumber = CONSTANTS.DEFAULT_PER_PAGE;
        }

        gridCount = (options.totalRecords >= 0) ? options.totalRecords : parseInt($gridCount.text());
        gridStartValue = (currentPage - 1) * itemsNumber;
        gridEndValue = gridStartValue + itemsNumber;

        $gridCount.text(gridCount);

        if (gridEndValue > gridCount) {
            gridEndValue = gridCount;
        }

        $gridStart.text((gridCount === 0) ? 0 : gridStartValue + 1);
        $gridEnd.text(gridEndValue);

        if (options.length || options.length === 0) {
            $lastPage = $curEl.find('#lastPage');
            pageNumber = Math.ceil(gridCount / itemsNumber);
            $pageList.html('');

            pageNumber = pageNumber || 1;

            for (var i = 1; i <= pageNumber; i++) {
                $pageList.append('<li class="showPage">' + i + '</li>');
            }

            $lastPage.text(pageNumber);


            if (pageNumber <= 1) {
                $curEl.find('#nextPage').prop('disabled', true);
                $curEl.find('#previousPage').prop('disabled', true);
            } else {
                $curEl.find('#previousPage').prop('disabled', gridStartValue + 1 === 1);
                $curEl.find('#nextPage').prop('disabled', gridEndValue === gridCount);
            }
        }

        if (options.itemsNumber) {
            $itemsNumber.text(itemsNumber);
        }

        $curPageInput.val(currentPage);
    },

    showPage: function (e) {
        var $curEl = this.$el;
        var $target = $(e.target);
        var $ulContent = $target.closest('.allNumberPerPage');
        var $itemsNumber = $curEl.find('#itemsNumber');
        var currentPage = $target.text();
        var itemsNumber = $itemsNumber.text();

        this.setPagination({currentPage: currentPage, itemsNumber: itemsNumber});

        this.preventDefaults(e);

        this.collection.getPage(currentPage, {
            count: itemsNumber,
            page : currentPage,
            _id  : this.model.get('_id')
        });

        $ulContent.toggle();
    },

    previousPage: function (e) {
        var $curEl = this.$el;
        var $curPageInput = $curEl.find('#currentShowPage');
        var $itemsNumber = $curEl.find('#itemsNumber');
        var currentPage = parseInt($curPageInput.val()) - 1;
        var itemsNumber = parseInt($itemsNumber.text());
        var options;

        this.preventDefaults(e);

        options = {
            page : currentPage,
            count: itemsNumber,
            _id  : this.model.get('_id')
        };

        this.collection.getNextPage(options);
    },

    nextPage: function (e) {
        var $curEl = this.$el;
        var $lastPage = $curEl.find('#lastPage');
        var $curPageInput = $curEl.find('#currentShowPage');
        var $itemsNumber = $curEl.find('#itemsNumber');
        var currentPage = parseInt($curPageInput.val()) + 1;
        var itemsNumber = parseInt($itemsNumber.text());
        var lastPage = parseInt($lastPage.text());
        var options;

        if (currentPage > lastPage) {
            currentPage = lastPage;
        }

        this.preventDefaults(e);


        options = {
            page : currentPage,
            count: itemsNumber,
            _id  : this.model.get('_id')
        };

        this.collection.getNextPage(options);
    },

    showPagesPopup: function (e) {
        var target = $(e.target);
        var curUl = target.closest('button').next('ul');

        curUl.toggle();

        return false;
    },

    fillTableWithData: function (category) {
        var $mainTable = this.$el.find('#mainContent');
        var variants = _.pluck(category, 'variant');

        variants.forEach(function (variantArray) {
            variantArray.forEach(function (variant) {
                variant.item.forEach(function (item) {
                    item.branches.forEach(function (branch) {
                        $mainTable.find('[data-item="' + item._id + '"][data-branch="' + branch.branch + '"]').text(branch.indicator.toUpperCase());
                    });
                });
            });
        });
    },

    render: function () {
        var self = this;
        var $curEl = this.$el;
        var collection = this.collection;
        var modelJSON = this.model.toJSON();
        var $leftHiddenScroll;
        var $topHiddenScroll;
        var $customScroll;
        var JSON = {
            left : modelJSON.category,
            right: {
                branches: modelJSON.branches
            }
        };

        $curEl.html(this.template({
            JSON       : JSON,
            translation: this.translation
        }));

        $curEl.find('#paginationHolder').html(this.paginationTemplate({
            translation: this.translation
        }));

        $curEl = $curEl.dialog({
            dialogClass  : 'previewDialog',
            title        : 'Preview Distribution',
            showCancelBtn: false,
            width        : '80%',
            height       : '600',
            buttons      : {
                save: {
                    text : self.translation.okBtn,
                    click: function () {
                        $(this).dialog('destroy').remove();
                    }
                }
            }
        });

        this.fillTableWithData(modelJSON.category);

        $leftHiddenScroll = $curEl.find('#leftHiddenScroll');
        $topHiddenScroll = $curEl.find('#topHiddenScroll');
        $customScroll = $curEl.find('.scrollable-yx');

        $customScroll.mCustomScrollbar({
            axis     : 'yx',
            callbacks: {
                whileScrolling: function () {
                    var scroll = this.mcs;
                    var verticalScrollValue = scroll.top;
                    var horizontalScrollValue = scroll.left;

                    if (scroll.direction === 'y') {
                        $leftHiddenScroll.scrollTop(-verticalScrollValue);
                    } else {
                        $topHiddenScroll.scrollLeft(-horizontalScrollValue);
                    }

                }
            }
        });

        $leftHiddenScroll.on('mousewheel DOMMouseScroll', _.debounce(function (event) {
            var $scroll = $customScroll.find('.mCSB_scrollTools_vertical');
            var $dragger = $scroll.find('.mCSB_dragger');
            var railHeight = $scroll.find('.mCSB_draggerRail').outerHeight();
            var currentPosition = $dragger.position().top;
            var height = $dragger.height();
            var mouseScrollTo;

            mouseScrollTo = (-event.deltaY * event.deltaFactor);
            currentPosition = currentPosition + mouseScrollTo;

            if (currentPosition <= 0) {
                currentPosition = 0.1;
            }

            if (currentPosition > (railHeight - height)) {
                currentPosition = railHeight - height;
            }

            $customScroll.mCustomScrollbar('scrollTo', {y: currentPosition, x: 0}, {moveDragger: true});
        }, 500, true));

        this.setPagination({
            length      : collection.itemCount,
            currentPage : collection.currentPage,
            itemsNumber : collection.itemsNumber,
            totalRecords: collection.totalRecords
        });

        this.delegateEvents();

        return this;
    }
});
