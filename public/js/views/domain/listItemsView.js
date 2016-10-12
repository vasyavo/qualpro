define([
    'Backbone',
    'underscore',
    'text!templates/domain/listTable.html'
], function (Backbone, _, listTemplate) {
    'use strict';

    var CountryListItemView = Backbone.View.extend({
        el: '.listTable',
        template: _.template(listTemplate),

        initialize: function (options) {
            this.collection = options.collection;
            this.contentType = options.contentType;
            this.startNumber = (options.page - 1 ) * options.itemsNumber;
            this.childContent = options.childContent;
            this.tabName = options.tabName;
            this.show = options.show;
        },
        render: function () {
            this.$el.append(this.template({
                collection  : this.collection.toJSON(),
                contentType : this.contentType,
                startNumber : this.startNumber,
                childContent: this.childContent,
                tabName     : this.tabName,
                show        : this.show
            }));
        }
    });

    return CountryListItemView;
});
