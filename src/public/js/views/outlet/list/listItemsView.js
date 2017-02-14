define([
        'backbone',
        'underscore',
        'text!templates/outlet/list/listTable.html'
    ],

    function (Backbone, _, listTemplate) {
        var CountryListItemView = Backbone.View.extend({
            el      : '#listTable',
            template: _.template(listTemplate),

            initialize: function (options) {
                this.translation = options.translation;
                this.collection = options.collection;
                this.startNumber = (options.page - 1 ) * options.itemsNumber;
                this.show = options.show;
                this.tabName = options.tabName;
            },
            render    : function () {
                this.$el.append(this.template({
                    collection : this.collection.toJSON(),
                    startNumber: this.startNumber,
                    show       : this.show,
                    tabName    : this.tabName,
                    translation: this.translation
                }));
            }
        });

        return CountryListItemView;
    });
