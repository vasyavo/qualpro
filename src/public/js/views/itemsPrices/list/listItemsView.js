define([
    'backbone',
    'Underscore',
    'text!templates/itemsPrices/list/list.html'
], function (Backbone, _, listTemplate) {
    'use strict';

    var ListItemView = Backbone.View.extend({
        template: _.template(listTemplate),

        initialize: function (options) {

            this.translation = options.translation;
            this.archived = options.archived;
            this.collection = options.collection;
            this.startNumber = (options.page - 1) * options.itemsNumber;
        },
        render    : function () {
            var collectionJSON = this.collection.toJSON();

            this.$el.append(this.template({
                items      : collectionJSON,
                startNumber: this.startNumber,
                archived   : this.archived,
                translation: this.translation
            }));
        }
    });

    return ListItemView;
});
