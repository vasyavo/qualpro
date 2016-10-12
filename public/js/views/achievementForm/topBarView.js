define([
    'text!templates/achievementForm/topBarTemplate.html',
    'text!templates/pagination/pagination.html',
    'views/baseTopBar',
    'constants/contentType'
], function (topBarTemplate, pagination, baseTopBar, CONTENT_TYPES) {
    var TopBarView = baseTopBar.extend({
        contentType       : CONTENT_TYPES.ACHIEVEMENTFORM,
        template          : _.template(topBarTemplate),
        paginationTemplate: _.template(pagination)
    });

    return TopBarView;
});
