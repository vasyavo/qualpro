define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/notes/list/list.html',
    'views/notes/createView',
    'text!templates/notes/list/newRow.html',
    'views/notes/editView',
    'views/notes/preView/preView',
    'views/filter/filtersBarView',
    'views/paginator',
    'constants/contentType'
], function (Backbone, $, _, template, createView, newRow, EditView, PreView,
             filterView, paginator, CONTENT_TYPES) {
    'use strict';

    var View = paginator.extend({
        contentType: CONTENT_TYPES.NOTES,
        viewType   : 'list',
        template   : _.template(template),
        templateNew: _.template(newRow),

        CreateView: createView,

        events: {
            'click .notesItem'  : 'incClicks',
            'click .editContent': 'showEditDialog',
            'click .trash'      : 'deleteNote'
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
            var targetRow = targetEl.closest('.notesItem');
            var id = targetRow.attr('data-id');
            var model = this.collection.get(id);

            this.preView = new PreView({
                model      : model,
                translation: this.translation
            });
        },

        showEditDialog: function (e) {
            var self = this;
            var id = $(e.target).closest('.notesItem').attr('data-id');
            var model = this.collection.get(id);

            e.stopPropagation();
            e.stopImmediatePropagation();

            this.editView = new EditView({
                model      : model,
                translation: this.translation
            });

            this.editView.on('modelSaved', function (model) {
                self.addReplaceRow(model);
            });
        },

        deleteNote: function (e) {
            var $noteItem = $(e.target).closest('.notesItem');
            var id = $noteItem.attr('data-id');
            var model = this.collection.get(id);
            var totalRecords = this.collection.totalRecords;
            var pageSize = this.collection.pageSize;
            var currentPage = this.collection.currentPage;
            var totalPages = Math.ceil(totalRecords / pageSize);
            var recordsOnLastPage = pageSize - (totalPages * pageSize - totalRecords);
            var itemsNumber = ((currentPage === totalPages) && (recordsOnLastPage < pageSize)) ? this.collection.pageSize : ++this.collection.pageSize;
            var self = this;
            var options;
            e.stopPropagation();
            e.stopImmediatePropagation();

            this.destroyModel = function () {

                model.destroy({
                    wait   : true,
                    success: function (model, response, options) {
                        $noteItem.remove();
                        self.trigger('pagination', {
                            length     : --self.collection.totalRecords,
                            currentPage: self.collection.currentPage,
                            itemsNumber: itemsNumber
                        });
                    },

                    error: function (model, xhr, options) {
                        App.render({type: 'error', message: xhr.message});
                    }
                });
            };

            options = {
                contentType: this.contentType,
                action     : 'delete',
                saveTitle  : this.translation.okBtn,
                saveCb     : function () {
                    self.destroyModel();
                    $(this).dialog('close').dialog('destroy').remove();
                }
            };

            App.showPopUp(options);
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
        }
    });

    return View;
});

