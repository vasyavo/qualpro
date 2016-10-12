define([
    'Backbone',
    'views/paginator',
    'text!templates/customReports/mainTemplate'
], function (Backbone, Paginator, MainTemplate) {
    'use strict';

    var MainView = Paginator.extend({
        mainTemplate: _.template(MainTemplate),

        initialize: function (options) {
            this.contentType = options.contentType;
            this.collection = options.collection;

            this.tabName = options.tabName;
            this.filter = options.filter;

            this.makeRender(options);
        },

        render: function (options) {
            var $currentEl = this.$el;

            $currentEl.html('');
            $currentEl.append(this.mainTemplate());
        }
    });

    return MainView;
});