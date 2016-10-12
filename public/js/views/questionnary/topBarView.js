define([
    'underscore',
    'jQuery',
    'text!templates/questionnary/topBarTemplate.html',
    'text!templates/pagination/pagination.html',
    'views/baseTopBar',
    'constants/contentType'
], function (_, $, topBarTemplate, pagination, baseTopBar, CONTENT_TYPES) {
    var TopBarView = baseTopBar.extend({
        contentType       : CONTENT_TYPES.QUESTIONNARIES,
        template          : _.template(topBarTemplate),
        paginationTemplate: _.template(pagination)
    });

    return TopBarView;
});
