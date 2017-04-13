const Schema = require('mongoose').Schema;

const schema = new Schema({
    _id: {
        type: String,
        unique: true,
    },
    name: {
        type: String,
        default: 'All',
    },
}, {
    autoIndex: false,
    collection: 'currencies',
    versionKey: false,
});

module.exports = schema;
