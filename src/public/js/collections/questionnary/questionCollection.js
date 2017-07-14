var Parent = require('../parrent');
var Model = require('../../models/question');

module.exports = Parent.extend({
    model      : Model,
    url        : '/question/',
    viewType   : null,
    contentType: null,
});
