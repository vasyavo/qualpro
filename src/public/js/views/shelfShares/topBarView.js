define([
    'text!templates/shelfShares/topBarTemplate.html',
    'text!templates/pagination/pagination.html',
    'views/baseTopBar',
    'constants/contentType'
],
function (topBarTemplate, pagination, baseTopBar, contentType) {
    var TopBarView = baseTopBar.extend({
        contentType       : contentType.SHELFSHARES,
        template          : _.template(topBarTemplate),
        paginationTemplate: _.template(pagination)
    });

    return TopBarView;
});