'use strict';
define([
    'text!templates/documents/topBarTemplate.html',
    'text!templates/pagination/pagination.html',
    'views/baseTopBar',
    'constants/contentType'
], function (topBarTemplate, pagination, baseTopBar, CONTENT_TYPES) {
    var TopBarView = baseTopBar.extend({
        contentType       : CONTENT_TYPES.DOCUMENTS,
        template          : _.template(topBarTemplate),
        paginationTemplate: _.template(pagination)
    });

    return TopBarView;
});