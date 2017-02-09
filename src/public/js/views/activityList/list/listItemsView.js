define([
    'backbone',
    'text!templates/activityList/list/list.html',
], function (Backbone, listTemplate) {
    var ActivityListItemView = Backbone.View.extend({
        template: _.template(listTemplate),

        initialize: function (options) {
            this.collection = options.collection;
            this.startNumber = (options.page - 1 ) * options.itemsNumber;
            this.showCheckboxes = options.showCheckboxes;
        },

        render: function () {
            var collectionJSON = this.collection.toJSON();

            this.$el.append(this.template({
                collection    : collectionJSON,
                startNumber   : this.startNumber,
                showCheckboxes: this.showCheckboxes
            }));
        }
    });

    return ActivityListItemView;
});
