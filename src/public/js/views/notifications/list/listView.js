define(function(require) {
    var _ = require('underscore');
    var $ = require('jQuery');
    var paginator = require('views/paginator');
    var createView = require('views/notifications/createView');
    var PreView = require('views/notifications/preView/preView');
    var CONTENT_TYPES = require('constants/contentType');
    var template = require('text!templates/notifications/list/list.html');
    var newRow = require('text!templates/notifications/list/newRow.html');
    var dataService = require('dataService');
    var Model = require('models/notifications');
    var BadgeStore = require('services/badgeStore');

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

            BadgeStore.cleanupNotifications();

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
