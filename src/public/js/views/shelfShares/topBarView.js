var _ = require('underscore');
var topBarTemplate = require('../../../templates/shelfShares/topBarTemplate.html');
var pagination = require('../../../templates/pagination/pagination.html');
var baseTopBar = require('../../views/baseTopBar');
var contentType = require('../../constants/contentType');

module.exports = baseTopBar.extend({
    contentType       : contentType.SHELFSHARES,
    template          : _.template(topBarTemplate),
    paginationTemplate: _.template(pagination)
});
