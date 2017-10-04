var _ = require('underscore');
var $ = require('jquery');
var topBarTemplate = require('../../../templates/consumersSurvey/topBarTemplate.html');
var pagination = require('../../../templates/pagination/pagination.html');
var baseTopBar = require('../../views/baseTopBar');
var CONTENT_TYPES = require('../../constants/contentType');

module.exports = baseTopBar.extend({
    contentType       : CONTENT_TYPES.CONSUMER_SURVEY,
    template          : _.template(topBarTemplate),
    paginationTemplate: _.template(pagination)
});
