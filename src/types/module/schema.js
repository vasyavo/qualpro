const Schema = require('mongoose').Schema;
const ObjectId = Schema.Types.ObjectId;

var schema = new Schema({
    _id: Number,
    name: {
        en: { type: String, default: '' },
        ar: { type: String, default: '' }
    },
    href: { type: String, default: '' },
    users: {},
    parrent: Number,
    visible: Boolean
}, { collection: 'modules' });

module.exports = schema;
