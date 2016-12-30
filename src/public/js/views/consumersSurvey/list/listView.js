define([
    'Backbone',
    'jQuery',
    'Underscore',
    'moment',
    'views/paginator',
    'views/consumersSurvey/createView',
    'views/consumersSurvey/preView/preView',
    'text!templates/consumersSurvey/list/list.html',
    'text!templates/consumersSurvey/list/newRow.html',
    'constants/contentType'
], function (Backbone, $, _, moment, paginator, CreateView, PreView, template, NewRowTemplate, CONTENT_TYPES) {
    'use strict';

    var View = paginator.extend({
        contentType: CONTENT_TYPES.CONSUMER_SURVEY,
        viewType   : 'list',
        CreateView : CreateView,

        template   : _.template(template),
        templateNew: _.template(NewRowTemplate),

        events: {
            'click .flexRow': 'incClicks'
        },

        initialize: function (options) {
            this.translation = options.translation;
            this.filter = options.filter;
            this.tabName = options.tabName;
            this.collection = options.collection;
            this.defaultItemsNumber = this.collection.pageSize;
            this.listLength = this.collection.totalRecords;

            options.contentType = this.contentType;

            this.makeRender(options);
        },

        listRowClick: function (e) {
            var self = this;
            var $targetEl = $(e.target);
            var $targetRow = $targetEl.closest('.flexRow');
            var id = $targetRow.attr('data-id');
            var model = this.collection.get(id);

            this.preView = new PreView({
                model      : model,
                translation: this.translation
            });
            this.preView.on('duplicate', this.createItem, this);
            this.preView.on('edit', this.createItem, this);
            this.preView.on('updatePreview', function (model) {
                self.collection.add(model, {merge: true});
            });
        },

        showMoreContent: function (newModels) {
            var $currentEl = this.$el;
            var jsonCollection = newModels.toJSON();

            this.pageAnimation(this.collection.direction, $currentEl);

            $currentEl.empty();
            $currentEl.html(this.template({
                collection : jsonCollection,
                translation: this.translation
            }));
        },

        render: function () {
            var $currentEl = this.$el;
            var jsonCollection = this.collection.toJSON();

            jsonCollection = jsonCollection.map(function(item) {
                item.startDate = moment(item.startDate).format('DD.MM.YYYY');
                return item;
            });

            $currentEl.html(this.template({
                collection : jsonCollection,
                translation: this.translation
            }));

            return this;
        }

    });

    return View;
});
