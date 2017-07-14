var _ = require('underscore');
var topBarTemplate = require('../../../templates/domain/topBarTemplate.html');
var pagination = require('../../../templates/pagination/pagination.html');
var baseTopBar = require('../../views/baseTopBar');

module.exports = baseTopBar.extend({
    contentType       : "region",
    template          : _.template(topBarTemplate),
    paginationTemplate: _.template(pagination)
});