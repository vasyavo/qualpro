var $ = require('jquery');
var _ = require('underscore');
var paginator = require('../views/paginator');
var App = require('../appState');
var requireContent = require('../helpers/requireContent');

module.exports = paginator.extend({

    thumbnailClicks: 0,

    incClicks: function (e) {
        this.thumbnailClicks += 1;
        this.runClickThumbnail(e);
    },

    clickThumbnail: function (e) {
        var clicks = this.thumbnailClicks;

        this.thumbnailClicks = 0;

        if (clicks == 1) {
            this.checkThumbnail(e);
        } else {
            this.showPreview(e);
        }
    },

    createItem: function () {
        var contentType = this.contentType;
        var viewType = this.viewType;
        var parentId = this.parentId;
        var self = this;
        var CreateView = this.CreateView;

        var Model = requireContent(contentType + '.model');

        var createView = new CreateView({
            Model      : Model,
            contentType: contentType,
            viewType   : viewType,
            parentId   : parentId,
            translation: self.translation
        });

        createView.on('itemSaved', function () {
            self.collection.getPage(1);
        });

        createView.on('modelSaved', function (model) {
            self.addReplaceRow(model);
        });
    },

    editItem: function (id) {
        var contentType = this.contentType;
        var viewType = this.viewType;
        var parentId = this.parentId;
        var curentId = id || this.$el.find('input[type="checkbox"]:checked').attr('id');
        var model = this.collection.get(curentId);
        var self = this;

        var editView = new this.EditView({
            model      : model,
            contentType: contentType,
            viewType   : viewType,
            parentId   : parentId,
            translation: this.translation
        });

        editView.on('itemArchived', function () {
            self.collection.getPage(1);
        });

        editView.on('modelSaved', function (model) {

            if (App.currentUser._id === model.get('_id')){
                App.currentUser = model.toJSON();
                self.trigger('renderCurrentUserInfo');
            }

            self.addReplaceRow(model);
        });
    },

    addReplaceRow: function (model) {
        var $curEl = this.$el;
        var $thumbnailsContainer = $curEl.find('.thumbnailsItems');
        var id = model.get('_id');
        var $thumbnails = $thumbnailsContainer.find('.thumbnail[data-id="' + id + '"]');
        var modelJSON = model.toJSON();

        var formString = this.templateNew({
            model: modelJSON,
            App: App,
        });

        if ($thumbnails.length) {
            $thumbnails.replaceWith(formString);
            $curEl.find('.rating').barrating({readonly: true});
            if (this.preView) {
                this.preView.trigger('updatePreview', model);
            }
            this.collection.add(modelJSON, {merge: true});
        } else {
            $curEl.find('.noData').remove();
            this.collection.add(modelJSON, {remove: false});
            this.trigger('pagination',{
                length     : ++this.collection.totalRecords,
                currentPage: this.collection.currentPage,
                itemsNumber: ++this.collection.pageSize
            });
            $thumbnailsContainer.prepend(this.templateNew({
                model: modelJSON,
                App: App,
            }));
        }

        this.trigger('hideActionDd');
    },

    checkThumbnail: function (e) {
        var $targetEl = $(e.target);
        var $targetDivContainer = $targetEl.closest(".thumbnail");
        var $checkbox = $targetDivContainer.find('input[type="checkbox"]');
        var checked = $checkbox.prop('checked');

        $checkbox.prop('checked', !checked);

        this.inputClick(e);
    },

    showFilteredPage: function (filter) {
        var itemsNumber = $("#itemsNumber").text();

        this.filter = filter;

        this.startTime = new Date();
        this.newCollection = false;

        $("#top-bar-deleteBtn").hide();
        $('#checkAll').prop('checked', false);

        this.changeLocationHash(1, itemsNumber, filter);
        this.collection.firstPage({count: itemsNumber, filter: filter});
    },

    showMoreContent: function (newModels) {
        var $currentEl = this.$el;
        var $holder = $currentEl.find('.thumbnailsItems');

        this.pageAnimation(this.collection.direction, $holder);

        $holder.empty();
        $holder.html(this.template({
            collection: newModels.toJSON(),
            App: App,
        }));

        this.trigger('selectedElementsChanged', {
            length  : 0,
            checkAll: false
        });

        App.$preLoader.fadeFn({
            visibleState: false
        });
    }

});
