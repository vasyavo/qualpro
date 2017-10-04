var _ = require('underscore');
var topBarTemplate = require('../../../templates/competitorBranding/topBarTemplate.html');
var pagination = require('../../../templates/pagination/pagination.html');
var baseTopBar = require('../../views/baseTopBar');

module.exports = baseTopBar.extend({
    contentType       : "country",
    template          : _.template(topBarTemplate),
    paginationTemplate: _.template(pagination)
});
