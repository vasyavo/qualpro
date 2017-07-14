var $ = require('jQuery');
var _ = require('underscore');
var BaseDialog = require('../../views/baseDialog');
var template = require('../../../templates/promotions/promotionsItems/header.html');
var tbodyTemplate = require('../../../templates/promotions/promotionsItems/tbody.html');
var paginationTemplate = require('../../../templates/pagination/pagination.html');
var FilePreviewTemplate = require('../../../templates/file/preView.html');
var Collection = require('../../collections/promotionsItems/collection');
var dataService = require('../../dataService');
var CONSTANTS = require('../../constants/otherConstants');
var FileCollection = require('../../collections/file/collection');
var FileDialogPreviewView = require('../../views/fileDialog/fileDialog');
var CONTENT_TYPES = require('../../constants/contentType');
var ERROR_MESSAGES = require('../../constants/errorMessages');
var EditPromotionItemView = require('../../views/promotions/editPromotionItem');
var PromotionItemModel = require('../../models/promotionsItems');
var INFO_MESSAGES = require('../../constants/infoMessages');

module.exports = BaseDialog.extend({
    contentType        : CONTENT_TYPES.PROMOTIONSITEMS,
    template           : _.template(template),
    tbodyTemplate      : _.template(tbodyTemplate),
    paginationTemplate : _.template(paginationTemplate),
    filePreviewTemplate: _.template(FilePreviewTemplate),

    events: {
        'click .oe_sortable'              : 'sort',
        'click .itemsNumber'              : 'switchPageCounter',
        'change #currentShowPage'         : 'showPage',
        'click .showPage'                 : 'showPage',
        'click #previousPage'             : 'previousPage',
        'click #nextPage'                 : 'nextPage',
        'click .allPage, .currentPageList': 'showPagesPopup',
        'click .commentBottom .attachment': 'onShowFilesInComment',
        'click #showAllDescription'       : 'onShowAllDescriptionInComment',
        'click .masonryThumbnail'         : 'showFilePreviewDialog',
        'click #downloadFile'             : 'stopPropagation',
        'click #edit': 'editTableItemData',
        'click .delete': 'deleteTableItem',
    },

    initialize: function (options) {
        var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) ? App.currentUser.currentLanguage : 'en';
        this.promotion = options.promotion;
        this.translation = options.translation;
        this.collection = new Collection({
            promotion: this.promotion
        });
        this.previewFiles = new FileCollection();

        this.makeRender();

        this.collection.once('showMore', function (collection) {
            if (!collection.length) {
                return App.render({
                    type   : 'notification',
                    message: ERROR_MESSAGES.promotionTableIsEmpty[currentLanguage]
                });
            }

            this.render();
        }, this);

        this.collection.on('showMore', function () {
            this.renderTbody();
        }, this);
        this.collection.on('reset', function () {
            this.renderTbody();
        }, this);
    },

    editTableItemData: function (event) {
        var that = this;
        var target = $(event.target);
        var promotionItemId = target.attr('data-id');
        var stopMapping = false;
        var searchedBranch = null;

        this.collection.toJSON().some(function(outlet) {
            outlet.branches.some(function (branch) {
                if (branch.promotionItemId === promotionItemId) {
                    searchedBranch = branch;

                    stopMapping = true;
                }

                return stopMapping;
            });

            return stopMapping;
        });

        if (searchedBranch) {
            this.editPromotionItemView = new EditPromotionItemView({
                translation: this.translation,
                branch: searchedBranch,
            });

            this.editPromotionItemView.on('edit-promotion-item', function (data, promotionItemId) {
                var model = new PromotionItemModel();
                model.editTableItemData(promotionItemId, data);

                model.on('promotion-item-data-edited', function () {
                    that.collection.getPage(that.collection.currentPage, {
                        promotion: that.promotion,
                    });
                    that.editPromotionItemView.$el.dialog('close').dialog('destroy').remove();
                });
            });
        }
    },

    deleteTableItem: function () {
        if (confirm(INFO_MESSAGES.confirmDeletePromoEvaluationItem[App.currentUser.currentLanguage])) {
            var that = this;
            var target = $(event.target);
            var promotionItemId = target.attr('data-id');
            var model = new PromotionItemModel();

            model.deletePromotionItem(promotionItemId);

            model.on('promotion-item-deleted', function () {
                that.$el.dialog('close').dialog('destroy').remove();
            });
        }
    },

    showFilePreviewDialog: _.debounce(function (e) {
        var $el = $(e.target);
        var $thumbnail = $el.closest('.masonryThumbnail');
        var fileModelId = $thumbnail.attr('data-id');
        var fileModel = this.previewFiles.get(fileModelId);

        this.fileDialogView = new FileDialogPreviewView({
            fileModel  : fileModel,
            translation: this.translation,
            bucket     : CONTENT_TYPES.COMMENT
        });
        this.fileDialogView.on('download', function (options) {
            var url = options.url;
            var originalName = options.originalName;
            var $fileElement;
            $thumbnail.append('<a class="hidden" id="downloadFile" href="' + url + '" download="' + originalName + '"></a>');
            $fileElement = $thumbnail.find('#downloadFile');
            $fileElement[0].click();
            $fileElement.remove();
        });
    }, 1000, true),

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

        function comparatorForUiNames(modelA, modelB) {
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
                model.branches.sort(comparatorForUiNames);
            });
        } else if (sortData === 'outlet') {
            collectionJSON.sort(comparatorForUiNames);
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
            count    : itemsNumber,
            page     : 1,
            promotion: this.promotion
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
            count    : itemsNumber,
            page     : currentPage,
            promotion: this.promotion
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
            page     : currentPage,
            count    : itemsNumber,
            promotion: this.promotion
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
            page     : currentPage,
            count    : itemsNumber,
            promotion: this.promotion
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

    onShowFilesInComment: function (e) {
        var self = this;
        var $target = $(e.target);
        var $commentDescription = $target.closest('.commentDescription');
        var commentId = $commentDescription.data().id;
        var $showFilesBlock = $commentDescription.find('#showFilesBlock');
        var showFiles = $target.hasClass('showFiles');
        var $loadFiles = $target.hasClass('loadFile');
        var attachmentsCount = parseInt($target.closest('.commentBottom').find('.commentCount').text(), 10);

        $target.toggleClass('showFiles');

        if (!showFiles) {
            if (!$loadFiles && attachmentsCount) {
                dataService.getData('/comment/' + commentId, {}, function (err, filesCollection) {
                    if (err) {
                        return App.render(err);
                    }

                    $target.addClass('loadFile');

                    self.showFilesInComment($showFilesBlock, filesCollection);

                    self.previewFiles.setAndUpdateModels(filesCollection, true);
                });
            } else {
                $showFilesBlock.show();
            }
        } else {
            $showFilesBlock.hide();
        }
    },

    showFilesInComment: function ($showFilesBlock, files) {
        var self = this;

        $showFilesBlock.html('');

        files.forEach(function (file) {
            $showFilesBlock.append(self.filePreviewTemplate({
                model: file
            }));
        });
    },

    onShowAllDescriptionInComment: function (e) {
        var $target = $(e.target);
        var $descriptionBlock = $target.closest('.commentDescription').find('#commentBody');

        $descriptionBlock.toggleClass('showAllDescription');
    },

    renderTbody: function () {
        var $curEl = this.$el;
        var jsonCollection = this.collection.toJSON();

        $curEl.find('#promotionsItemsTbody').html(this.tbodyTemplate({
            outlet     : jsonCollection,
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
            title        : 'Select Title',
            showCancelBtn: false,
            buttons      : {
                save: {
                    text : 'Ok',
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
