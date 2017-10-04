var _ = require('underscore');
var topBarTemplate = require('../../../templates/newProductLaunch/topBarTemplate.html');
var pagination = require('../../../templates/pagination/pagination.html');
var baseTopBar = require('../../views/baseTopBar');
var CONTENT_TYPES = require('../../constants/contentType');

module.exports = baseTopBar.extend({
    contentType       : CONTENT_TYPES.NEWPRODUCTLAUNCH,
    template          : _.template(topBarTemplate),
    paginationTemplate: _.template(pagination)
});
