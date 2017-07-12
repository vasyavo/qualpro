var _ = require('underscore');
var $ = require('jQuery');
var template = require('text!templates/contractsYearly/list/list.html');
var createView = require('views/contractsYearly/createView');
var newRow = require('text!templates/contractsYearly/list/newRow.html');
var EditView = require('views/contractsYearly/editView');
var PreView = require('views/contractsYearly/preView/preView');
var paginator = require('views/paginator');
var FileDialogPreviewView = require('views/fileDialog/fileDialog');
var FileCollection = require('collections/file/collection');
var CONTENT_TYPES = require('constants/contentType');
var BadgeStore = require('services/badgeStore');

module.exports = paginator.extend({
    contentType: CONTENT_TYPES.CONTRACTSYEARLY,
    viewType   : 'list',
    template   : _.template(template),
    templateNew: _.template(newRow),

    CreateView: createView,

    // .bannerMin замінити потім на адекватний div
    events: {/*
        'click .bannerMin': 'showFilePreviewDialog',*/
        'click .listRow'  : 'incClicks'
    },

    initialize: function (options) {
        this.filter = options.filter;
        this.tabName = options.tabName;
        this.collection = options.collection;
        this.defaultItemsNumber = this.collection.pageSize;
        this.listLength = this.collection.totalRecords;
        this.translation = options.translation;
        options.contentType = this.contentType;

        BadgeStore.cleanupContractsYearly();

        this.makeRender(options);
    },

    listRowClick: function (e) {
        var targetEl = $(e.target);
        var targetRow = targetEl.closest('.listRow');
        var id = targetRow.attr('data-id');
        var model = this.collection.get(id);

        this.preView = new PreView({
            model      : model,
            translation: this.translation
        });

        this.preView.on('showEditDialog', this.showEditDialog, this);
    },

    showEditDialog: function (model, duplicate) {
        var self = this;

        this.editView = new EditView({
            model      : model,
            duplicate  : duplicate,
            translation: this.translation
        });

        this.editView.on('modelSaved', function (model) {
            self.collection.add(model, {merge: true});
            self.addReplaceRow(model);
        });
    },

    showFilePreviewDialog: _.debounce(function (e) {
        var $targetEl = $(e.target);
        var $targetRow = $targetEl.closest('.listRow');
        var $targetFile = $targetEl.closest('.fileThumbnailItem');
        var id = $targetRow.attr('data-id');
        var FileId = $targetFile.attr('data-id');
        var model = this.collection.get(id);
        var fileModel;

        e.stopPropagation();
        e.stopImmediatePropagation();

        this.previewFiles = new FileCollection(model.get('documents'), true);
        fileModel = this.previewFiles.get(FileId);

        this.fileDialogView = new FileDialogPreviewView({
            fileModel  : fileModel,
            bucket     : 'documents',
            translation: this.translation
        });
    }, 1000, true),

    showMoreContent: function (newModels) {
        var $currentEl = this.$el;
        var $holder = $currentEl.find(".listTable");
        var jsonCollection = newModels.toJSON();

        this.pageAnimation(this.collection.direction, $holder);

        $holder.empty();
        $holder.html(this.template({
            collection : jsonCollection,
            translation: this.translation
        }));
    },

    render: function () {
        var $currentEl = this.$el;
        var jsonCollection = this.collection.toJSON();
        var $holder;

        $currentEl.html('');
        $currentEl.append('<div class="absoluteContent listnailsWrap"><div class="listnailsHolder scrollable"><div class="listTable"></div></div></div>');

        $holder = $currentEl.find('.listTable');
        $holder.append(this.template({
            collection : jsonCollection,
            translation: this.translation
        }));

        return this;
    }
});
