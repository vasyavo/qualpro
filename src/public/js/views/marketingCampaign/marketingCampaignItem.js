var $ = require('jQuery');
var _ = require('underscore');
var async = require('async');
var BaseDialog = require('../../views/baseDialog');
var template = require('../../../templates/marketingCampaign/marketingCampaignItem/header.html');
var tbodyTemplate = require('../../../templates/marketingCampaign/marketingCampaignItem/tbody.html');
var paginationTemplate = require('../../../templates/pagination/pagination.html');
var Collection = require('../../collections/marketingCampaignItem/collection');
var dataService = require('../../dataService');
var CONSTANTS = require('../../constants/otherConstants');
var FileCollection = require('../../collections/file/collection');
var CONTENT_TYPES = require('../../constants/contentType');
var ERROR_MESSAGES = require('../../constants/errorMessages');
var CommentFiewDialog = require('../../views/marketingCampaign/comments/comment');

module.exports = BaseDialog.extend({
    contentType       : CONTENT_TYPES.MARKETING_CAMPAIGN_ITEM,
    template          : _.template(template),
    tbodyTemplate     : _.template(tbodyTemplate),
    paginationTemplate: _.template(paginationTemplate),
    events            : {
        'click .oe_sortable'              : 'sort',
        'click .itemsNumber'              : 'switchPageCounter',
        'change #currentShowPage'         : 'showPage',
        'click .showPage'                 : 'showPage',
        'click #previousPage'             : 'previousPage',
        'click #nextPage'                 : 'nextPage',
        'click .allPage, .currentPageList': 'showPagesPopup',
        'click #viewComments'             : 'showComments'
    },

    initialize: function (options) {
        var currentLanguage = App.currentUser.currentLanguage;
        this.currentLanguage = currentLanguage;

        this.brandingAndDisplay = options.brandingAndDisplay;
        this.translation = options.translation;
        this.collection = new Collection({
            brandingAndDisplay: this.brandingAndDisplay,
            fetch             : true
        });
        this.previewFiles = new FileCollection();
        this.files = new FileCollection();
        this.ALLOWED_CONTENT_TYPES = _.union(
            CONSTANTS.IMAGE_CONTENT_TYPES,
            CONSTANTS.VIDEO_CONTENT_TYPES,
            CONSTANTS.MS_WORD_CONTENT_TYPES,
            CONSTANTS.MS_EXCEL_CONTENT_TYPES,
            CONSTANTS.MS_POWERPOINT_CONTENT_TYPES,
            CONSTANTS.OTHER_FORMATS
        );

        this.makeRender();

        this.collection.once('showMore', function (collection) {
            if (!collection.length) {
                return App.render({
                    type   : 'notification',
                    message: ERROR_MESSAGES.brandingTableIsEmpty[currentLanguage]
                });
            }

            this.render();
        }, this);

        this.collection.on('showMore', function (collection) {
            this.renderTbody();
        }, this);
        this.collection.on('reset', function (collection) {
            this.renderTbody();
        }, this);
    },

    showComments: function (e) {
        var $target = $(e.target);
        var self = this;
        this.brandingItemId = $target.attr('data-id');
        this.commentDialog = new CommentFiewDialog({
            id         : this.brandingItemId,
            translation: self.translation
        });
        this.commentDialog.on('comment-deleted', function () {
            if (self.commentDialog.commentsCount < 1) {
                dataService.deleteData('/marketingCampaignItem/' + self.brandingItemId, {}, function (err) {
                    if (err) {
                        return App.renderErrors([
                            ERROR_MESSAGES.somethingWentWrong[self.currentLanguage]
                        ]);
                    }

                    self.trigger('re-render');
                    self.$el.dialog('close').dialog('destroy').remove();
                    self.commentDialog.$el.dialog('close').dialog('destroy').remove();
                });
            }
        });
    },

    preventDefaults: function (e) {
        e.preventDefault();
        e.stopPropagation();
    },

    sort: function (e) {
        var collectionJSON = this.collection.toJSON();
        var $el = $(e.target);
        var $th = $el.closest('th');
        var sortData = $th.attr('data-sort');
        var sortType = parseInt($el.attr('sort-type'));
        var sort = {};
        var data;

        $el.attr('sort-type', sortType === 1 ? -1 : 1);

        $th.siblings('.oe_sortable')
            .removeClass('sorted')
            .find('div')
            .attr('sort-type', 1);
        $th.addClass('sorted');

        function comparatorForUiNamesBranches(modelA, modelB) {
            var nameA = getName(modelA.branch);
            var nameB = getName(modelB.branch);

            function getName(model) {
                var employeeAttr = model.name;

                if (employeeAttr) {
                    return model.name.currentLanguage;
                }

                return false;
            }

            return sortType === 1 ? nameA.localeCompare(nameB) : nameA.localeCompare(nameB) * -1;
        }

        function comparatorForUiNamesCustomers(modelA, modelB) {
            var nameA = getName(modelA);
            var nameB = getName(modelB);

            function getName(model) {
                var employeeAttr = model.name;

                if (employeeAttr) {
                    return model.name.currentLanguage;
                }

                return false;
            }

            return sortType === 1 ? nameA.localeCompare(nameB) : nameA.localeCompare(nameB) * -1;
        }

        if (sortData === 'branch') {
            collectionJSON.forEach(function (model) {
                model.branches.sort(comparatorForUiNamesBranches);
            });
        } else if (sortData === 'outlet') {
            collectionJSON.sort(comparatorForUiNamesCustomers);
        }
        this.collection.reset(collectionJSON);
    },

    switchPageCounter: function (e) {
        var $ul = $(e.target).closest('ul');
        var itemsNumber;
        var options;

        this.preventDefaults(e);

        $ul.toggle();

        itemsNumber = e.target.textContent;

        this.defaultItemsNumber = itemsNumber;

        options = {
            count             : itemsNumber,
            page              : 1,
            brandingAndDisplay: this.brandingAndDisplay
        };

        if (this.sortData) {
            options.sort = this.sortData;
        }

        this.collection.getPage(1, options);
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

        $curEl.find('#pageListScrollable').mCustomScrollbar();

        if (options.itemsNumber) {
            $itemsNumber.text(itemsNumber);
        }

        $curPageInput.val(currentPage);
    },

    showPage: function (e) {
        var $curEl = this.$el;
        var $target = $(e.target);
        var $ulContent = $target.closest('.pagesPopup');
        var $itemsNumber = $curEl.find('#itemsNumber');
        var currentPage = $target.text() || $target.val();
        var itemsNumber = $itemsNumber.text();
        var options;

        this.preventDefaults(e);

        this.setPagination({currentPage: currentPage, itemsNumber: itemsNumber});

        options = {
            count             : itemsNumber,
            page              : currentPage,
            brandingAndDisplay: this.brandingAndDisplay
        };

        if (this.sortData) {
            options.sort = this.sortData;
        }

        this.collection.getPage(currentPage, options);

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
            page              : currentPage,
            count             : itemsNumber,
            brandingAndDisplay: this.brandingAndDisplay
        };

        if (this.sortData) {
            options.sort = this.sortData;
        }

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
            page              : currentPage,
            count             : itemsNumber,
            brandingAndDisplay: this.brandingAndDisplay
        };

        if (this.sortData) {
            options.sort = this.sortData;
        }

        this.collection.getNextPage(options);
    },

    showPagesPopup: function (e) {
        var target = $(e.target);
        var curUl = target.closest('button').next('.pagesPopup');

        curUl.toggle();

        return false;
    },

    renderTbody: function () {
        var $curEl = this.$el;
        var jsonCollection = this.collection.toJSON();

        $curEl.find('#promotionsItemsTbody').html(this.tbodyTemplate({
            collection : jsonCollection,
            translation: this.translation
        }));

        this.setPagination({
            length      : this.collection.itemCount,
            currentPage : this.collection.currentPage,
            itemsNumber : this.collection.itemsNumber,
            totalRecords: this.collection.totalRecords
        });
    },

    render: function () {
        var $curEl = this.$el;

        $curEl.html(this.template({
            translation: this.translation
        }));

        $curEl.find('#paginationHolder').html(this.paginationTemplate({
            translation: this.translation
        }));

        $curEl.dialog({
            dialogClass  : 'promotionsItemsDialog',
            title        : this.translation.selectTitle,
            showCancelBtn: false,
            buttons      : {
                save: {
                    text : this.translation.okBtn,
                    click: function () {
                        $(this).dialog('destroy').remove();
                    }
                }
            }
        });

        this.delegateEvents(this.events);

        return this;
    }
});
