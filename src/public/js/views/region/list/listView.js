var ListView = require('../../../views/domain/list');

module.exports = ListView.extend({
    contentType: 'region',
    childContent: 'subRegion'
});
