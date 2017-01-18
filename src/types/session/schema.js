const Schema = require('mongoose').Schema;

const schema = new Schema({
    _id: {
        type: String,
    },
    session: {
        type: String
    },
    expires: {
        type: Date
    }
}, {
    collection: 'sessions'
});

module.exports = schema;
