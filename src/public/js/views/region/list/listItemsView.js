﻿define([
        'backbone',
        'text!templates/domain/listTable.html'
    ],

    function (listTemplate) {
        var CountryListItemView = Backbone.View.extend({
            el      : '#listTable',
            template: _.template(listTemplate),

            initialize: function (options) {
                this.collection = options.collection;
                this.startNumber = (options.page - 1 ) * options.itemsNumber;
            },
            render    : function () {
                this.$el.append(this.template({
                    collection: this.collection.toJSON(),
                    startNumber: this.startNumber
                }));
            }
        });

        return CountryListItemView;
    });
