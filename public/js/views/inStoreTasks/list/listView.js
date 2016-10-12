define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/inStoreTasks/list/list.html',
    'text!templates/inStoreTasks/list/newRow.html',
    'views/inStoreTasks/createView',
    'views/inStoreTasks/editView',
    'views/inStoreTasks/preView/preView',
    'views/filter/filtersBarView',
    'views/paginator',
    'constants/contentType',
    'dataService'
], function (Backbone, $, _, template, newRow, createView,
             EditInStoreTaskView, PreView, filterView, paginator, CONTENT_TYPES, dataService) {
    'use strict';

    var View = paginator.extend({
        contentType    : CONTENT_TYPES.INSTORETASKS,
        viewType       : 'list',
        template       : _.template(template),
        templateNew    : _.template(newRow),
        notCheckFilters: true,

        CreateView: createView,

        events: {
            'click .listRow': 'incClicks'
        },

        initialize: function (options) {

            this.tabName = options.tabName;
            this.filter = options.filter;
            this.collection = options.collection;
            this.defaultItemsNumber = this.collection.pageSize;
            this.listLength = this.collection.totalRecords;
            this.translation = options.translation;

            options.contentType = this.contentType;

            this.makeRender(options);
        },

        listRowClick: function (e) {
            var self = this;
            var targetEl = $(e.target);
            var targetRow = targetEl.closest('.listRow');
            var id = targetRow.attr('data-id');
            var model = this.collection.get(id);

            this.preView = new PreView({
                model      : model,
                translation: this.translation
            });
            this.preView.on('modelSaved', function (model) {
                self.collection.add(model, {merge: true});
                self.addReplaceRow(model);
            });

            this.preView.on('showEditInStoreTaskDialog', this.showEditInStoreTaskDialog, this);
        },

        showEditInStoreTaskDialog: function (model, duplicate) {
            var self = this;

            if (duplicate) {
                this.editInStoreTaskView = new EditInStoreTaskView({
                    model      : model,
                    duplicate  : duplicate,
                    translation: this.translation
                });

                this.editInStoreTaskView.on('modelSaved', function (model) {
                    self.collection.add(model, {merge: true});
                    self.addReplaceRow(model);
                });
            } else {
                dataService.getData(this.contentType + '/' + model.get('_id'), {}, function (err, response) {
                    if (err) {
                        return App.render({type: 'error', message: err.message});
                    }

                    self.editInStoreTaskView = new EditInStoreTaskView({
                        model      : response,
                        translation: self.translation
                    });

                    self.editInStoreTaskView.on('modelSaved', function (model) {
                        self.collection.add(model, {merge: true});
                        self.addReplaceRow(model);
                    });
                });
            }
        },

        render: function () {
            var $currentEl = this.$el;
            var jsonCollection = this.collection.toJSON();
            var covered = App.currentUser && App.currentUser.covered || {};
            var $holder;

            $currentEl.html('');
            $currentEl.append('<div class="absoluteContent listnailsWrap"><div class="listnailsHolder scrollable"><div class="listTable"></div></div></div>');

            $holder = $currentEl.find('.listTable');
            $holder.append(this.template({
                collection : jsonCollection,
                translation: this.translation,
                tabName    : this.tabName,
                covered    : covered
            }));

            return this;
        },

        showMoreContent: function (newModels) {
            var $currentEl = this.$el;
            var $holder = $currentEl.find('.listTable');
            var jsonCollection = newModels.toJSON();
            var covered = App.currentUser && App.currentUser.covered || {};

            this.pageAnimation(this.collection.direction, $holder);

            $holder.empty();
            $holder.html(this.template({
                collection : jsonCollection,
                translation: this.translation,
                tabName    : this.tabName,
                covered    : covered
            }));
        }
    });

    return View;
});
