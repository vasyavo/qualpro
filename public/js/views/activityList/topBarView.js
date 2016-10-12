'use strict';

define([
    'Backbone',
    'Underscore',
    'jQuery',
    'text!templates/activityList/topBarTemplate.html',
    'text!templates/pagination/pagination.html',
    'views/baseTopBar'
], function (Backbone, _, $, topBarTemplate, pagination, baseTopBar) {
    var TopBarView = baseTopBar.extend({
        contentType       : 'activityList',
        template          : _.template(topBarTemplate),
        paginationTemplate: _.template(pagination)

    });
    return TopBarView;
});
