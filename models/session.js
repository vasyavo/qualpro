module.exports = (function () {
    var mongoose = require('mongoose');
    var sessionSchema = mongoose.Schema({

        session: {type: String},
        expires: {type: Date}

    }, {collection: 'sessions'});

    mongoose.model('session', sessionSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas['session'] = sessionSchema;
})();
