define(function(require) {
    var _ = require('underscore');
    var $ = require('jQuery');
    var moment = require('moment');
    var paginator = require('views/paginator');
    var CreateView = require('views/consumersSurvey/createView');
    var PreView = require('views/consumersSurvey/preView/preView');
    var template = require('text!templates/consumersSurvey/list/list.html');
    var NewRowTemplate = require('text!templates/consumersSurvey/list/newRow.html');
    var CONTENT_TYPES = require('constants/contentType');
    var BadgeStore = require('services/badgeStore');

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

            BadgeStore.cleanupConsumerSurvey();

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
            this.preView.on('re-render', function (questionId) {
                var questionBlock = $('#question-block-' + questionId);
                questionBlock.click();
                questionBlock.click();
            });
            this.preView.on('update-list-view', function () {
                self.collection.fetch({
                    reset: true,
                    success: function (response) {
                        self.showMoreContent(response);
                    }
                });
            });
        },

        showMoreContent: function (newModels) {
            var $currentEl = this.$el;
            var jsonCollection = newModels.toJSON();

            this.pageAnimation(this.collection.direction, $currentEl);

            jsonCollection.map(function (item) {
                item.startDate = moment(item.startDate).format('DD.MM.YYYY');
                return item;
            });

            $currentEl.empty();
            $currentEl.html(this.template({
                collection : jsonCollection,
                translation: this.translation
            }));
        },

        render: function () {
            var $currentEl = this.$el;
            var jsonCollection = this.collection.toJSON();

            jsonCollection.map(function (item) {
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
