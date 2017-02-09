define([
    'backbone',
    'jQuery',
    'Underscore',
    'text!templates/contractsSecondary/list/list.html',
    'views/contractsSecondary/createView',
    'text!templates/contractsSecondary/list/newRow.html',
    'views/contractsSecondary/editView',
    'views/contractsSecondary/preView/preView',
    'views/filter/filtersBarView',
    'views/paginator',
    'constants/otherConstants',
    'constants/filters',
    'views/fileDialog/fileDialog',
    'collections/file/collection',
    'constants/contentType'

], function (Backbone, $, _, template, createView, newRow, EditView, PreView, filterView, paginator, OTHER_CONSTANTS, FILTER_CONSTANTS, FileDialogPreviewView, FileCollection, CONTENT_TYPES) {
    'use strict';

    var View = paginator.extend({
        contentType: CONTENT_TYPES.CONTRACTSSECONDARY,
        viewType   : 'list',
        template   : _.template(template),
        templateNew: _.template(newRow),
        CreateView : createView,

        events: {
            'click .listRow': 'incClicks'
        },

        initialize: function (options) {
            this.filter = options.filter;
            this.tabName = options.tabName;
            this.collection = options.collection;
            this.defaultItemsNumber = this.collection.pageSize;
            this.listLength = this.collection.totalRecords;
            this.translation = options.translation;

            options.contentType = this.contentType;

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

        showMoreContent: function (newModels) {
            var $currentEl = this.$el;
            var $holder = $currentEl.find('.listTable');
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

    return View;
});

