var _ = require('underscore');
var topBarTemplate = require('../../../templates/brandingAndMonthlyDisplay/topBarTemplate.html');
var pagination = require('../../../templates/pagination/pagination.html');
var baseTopBar = require('../../views/baseTopBar');

module.exports = baseTopBar.extend({
    contentType       : "brandingAndMonthlyDisplay",
    template          : _.template(topBarTemplate),
    paginationTemplate: _.template(pagination)
});
