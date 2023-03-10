var _ = require('underscore');
var Backbone = require('backbone');
var compactContentTemplate = require('../../../templates/personnel/compactContent.html');
var CreateView = require('../../views/createView');

module.exports = Backbone.View.extend({

    className: 'form',

    events: {
        'click #personnels p>a': 'openPersonnelDialog'
    },

    initialize: function (options) {

        this.translation = options.translation;
        this.collection = options.collection;

        this.render();
    },

    template: _.template(compactContentTemplate),

    openPersonnelDialog: function (e) {
        e.preventDefault();
        alert('personell popup');
        var itemId = $(e.target).closest('a').attr('id');
    },

    render: function () {
        this.$el.html(this.template({
            collection : this.collection,
            translation: this.translation
        }));
        return this;
    },

    createItem: function () {
        new CreateView({
            translation: this.translation
        });
    }
});
