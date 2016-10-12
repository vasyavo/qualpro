define([
        'Backbone',
        'Underscore',
        'text!templates/planogram/list/list.html'
    ],

    function (Backbone, _, listTemplate) {
        'use strict';

        var ListItemView = Backbone.View.extend({
            template: _.template(listTemplate),

            initialize: function (options) {
                this.translation = options.translation;
                this.collection = options.collection;
                this.startNumber = (options.page - 1) * options.itemsNumber;
            },

            render: function () {
                var collectionJSON = this.collection.toJSON();

                this.$el.append(this.template({
                    items      : collectionJSON,
                    startNumber: this.startNumber,
                    translation: this.translation
                }));
            }
        });

        return ListItemView;
    });
