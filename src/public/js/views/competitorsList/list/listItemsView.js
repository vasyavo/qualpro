var _ = require('underscore');
var Backbone = require('backbone');
var listTemplate = require('../../../../templates/competitorsList/list/list.html');

module.exports = Backbone.View.extend({
    template: _.template(listTemplate),

    initialize: function (options) {

        this.translation = options.translation;
        this.archived = options.archived;
        this.collection = options.collection;
        this.startNumber = (options.page - 1) * options.itemsNumber;
    },

    render: function () {
        var collectionJSON = this.collection.toJSON();

        this.$el.append(this.template({
            items      : collectionJSON,
            startNumber: this.startNumber,
            archived   : this.archived,
            translation: this.translation
        }));
    }
});
