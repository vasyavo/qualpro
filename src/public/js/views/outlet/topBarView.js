var _ = require('underscore');
var topBarTemplate = require('../../../templates/outlet/topBarTemplate.html');
var pagination = require('../../../templates/pagination/pagination.html');
var baseTopBar = require('../../views/baseTopBar');

module.exports = baseTopBar.extend({
    contentType       : "outlet",
    template          : _.template(topBarTemplate),
    paginationTemplate: _.template(pagination)
});
