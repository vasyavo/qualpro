define(function(require) {
    var _ = require('underscore');
    var $ = require('jQuery');
    var template = require('text!templates/brandingAndDisplayNew/list/list.html');
    var PreView = require('views/brandingAndDisplayNew/preView/preView');
    var paginator = require('views/paginator');
    var FileModel = require('models/file');
    var CONTENT_TYPES = require('constants/contentType');
    var BadgeStore = require('services/badgeStore');

    var View = paginator.extend({
        contentType: CONTENT_TYPES.BRANDING_AND_DISPLAY,
        viewType   : 'list',
        template   : _.template(template),

        events: {
            'click .listRow': 'incClicks'
        },

        initialize: function (options) {
            this.translation = options.translation;
            this.filter = options.filter;
            this.tabName = options.tabName;
            this.collection = options.collection;
            this.defaultItemsNumber = this.collection.pageSize;
            this.listLength = this.collection.totalRecords;

            options.contentType = this.contentType;

            BadgeStore.cleanupBrandingAndMonthlyDisplay();

            this.makeRender(options);
        },

        listRowClick: function (e) {
            var targetEl = $(e.target);
            var $targetRow = targetEl.closest('.listRow');
            var id = $targetRow.attr('data-id');
            var model = this.collection.get(id);
            var self = this;

            e.stopPropagation();

            this.preView = new PreView({
                model      : model,
                translation: this.translation
            });

            this.preView.on('modelChanged', function (count) {
                self.changeCommentCount(count, $targetRow);
            });
        },

        changeCommentCount: function (count, $targetRow) {
            $targetRow.find('.userMassage').text(count);
        },

        prepareDataToDisplay : function (data) {
            const currentLanguage = App.currentUser.currentLanguage;
            const fileModel = new FileModel();
            return data.map((model) => {
                const categories = [];
                model.categories.map((category) => {
                    categories.push(category.name[currentLanguage]);
                });
                model.categoryString = categories.join(', ');

                model.branchString = model.branch.name[currentLanguage];

                model.createdBy.userName = `${model.createdBy.firstName[currentLanguage]} ${model.createdBy.lastName[currentLanguage]}`;
                model.createdBy.positionString = model.createdBy.position.name[currentLanguage];
                model.createdBy.accessRoleString = model.createdBy.accessRole.name[currentLanguage];

                return model;
            });
        },

        showMoreContent: function (newModels) {
            var $currentEl = this.$el;
            var $holder = $currentEl.find('.reportingWrap');
            var jsonCollection = newModels.toJSON();

            jsonCollection = this.prepareDataToDisplay(jsonCollection);

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

            jsonCollection = this.prepareDataToDisplay(jsonCollection);

            $currentEl.html('');
            $currentEl.append('<div class="absoluteContent listnailsWrap"><div class="listnailsHolder scrollable"><div class="reportingWrap"></div></div></div>');

            $holder = $currentEl.find('.reportingWrap');
            $holder.append(this.template({
                collection : jsonCollection,
                translation: this.translation
            }));

            return this;
        }
    });

    return View;
});
