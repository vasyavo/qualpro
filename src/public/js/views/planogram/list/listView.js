define(function(require) {
    var _ = require('underscore');
    var headerTemplate = require('text!templates/planogram/list/header.html');
    var newRowTemplate = require('text!templates/planogram/list/newRow.html');
    var ListItemsView = require('views/planogram/list/listItemsView');
    var paginator = require('views/paginator');
    var REGEXP = require('constants/validation');
    var createView = require('views/planogram/createView');
    var CONTENT_TYPES = require('constants/contentType');
    var BadgeStore = require('services/badgeStore');

    var View = paginator.extend({
        contentType: CONTENT_TYPES.PLANOGRAM,
        viewType   : 'list',
        template   : _.template(headerTemplate),
        templateNew: _.template(newRowTemplate),

        CreateView: createView,

        //TODO Maybe rewrite logic of display personnel phoneNumber and status in newRow
        REGEXP: REGEXP,

        events: {
            'click .checkboxLabel'        : 'checked',
            'click input[type="checkbox"]': 'inputClick'
        },

        initialize: function (options) {
            this.translation = options.translation;
            this.filter = options.filter;
            this.collection = options.collection;
            this.defaultItemsNumber = this.collection.pageSize;
            this.listLength = this.collection.totalRecords;
            this.singleSelect = options.singleSelect;

            BadgeStore.cleanupPlanogram();

            this.makeRender(options);
        },

        render: function () {
            var $currentEl = this.$el;

            $currentEl.html('');
            $currentEl.append(this.template({
                translation: this.translation
            }));

            this.$itemsEl = $currentEl.find('.listTable');

            $currentEl.append(new ListItemsView({
                el         : this.$itemsEl,
                collection : this.collection,
                translation: this.translation
            }).render());

            return this;
        },

        showMoreContent: function (newModels) {
            var holder = this.$el;
            var itemView;

            holder.find('.listTable').empty();

            this.trigger('hideActionDd');

            itemView = new ListItemsView({
                el         : this.$itemsEl,
                collection : newModels,
                translation: this.translation
            });

            holder.append(itemView.render());
            itemView.undelegateEvents();

            holder.find('#checkAll').prop('checked', false);
        }
    });

    return View;
});
