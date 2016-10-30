define([
    'Backbone',
    'jQuery',
    'Underscore',
    'views/paginator',
    'views/notifications/createView',
    'views/notifications/preView/preView',
    'constants/contentType',
    'text!templates/notifications/list/list.html',
    'text!templates/notifications/list/newRow.html',
    'dataService',
    'models/notifications'
], function (Backbone, $, _, paginator, createView, PreView, CONTENT_TYPES, template, newRow,
             dataService, Model) {
    'use strict';

    var View = paginator.extend({
        contentType: CONTENT_TYPES.NOTIFICATIONS,
        viewType   : 'list',
        template   : _.template(template),
        templateNew: _.template(newRow),

        CreateView: createView,

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
            var self = this;
            var targetEl = $(e.target);
            var targetRow = targetEl.closest('.listRow');
            var id = targetRow.attr('data-id');
            var url = this.contentType + '/' + id;
            var model;
            dataService.getData(url, {}, function (err, result) {
                if (err) {
                    App.render(err);
                }
                model = new Model(result, {parse: true});
                self.preView = new PreView({
                    model      : model,
                    translation: self.translation
                });
            });
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
