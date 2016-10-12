module.exports = (function () {
    var mongoose = require('mongoose');
    var moduleSchema = mongoose.Schema({
        _id : Number,
        name: {
            en: {type: String, default: ''},
            ar: {type: String, default: ''}
        },
        href   : {type: String, default: ''},
        users  : {},
        parrent: Number,
        visible: Boolean
    }, {collection: 'modules'});

    mongoose.model('module', moduleSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas['module'] = moduleSchema;
})();
