var _ = require('underscore');
var topBarTemplate = require('../../../templates/contactUs/topBarTemplate.html');
var pagination = require('../../../templates/pagination/pagination.html');
var baseTopBar = require('../../views/baseTopBar');

module.exports = baseTopBar.extend({
    contentType       : "contactUs",
    template          : _.template(topBarTemplate),
    paginationTemplate: _.template(pagination)
});
