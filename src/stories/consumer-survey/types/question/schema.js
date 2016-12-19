const Schema = require('mongoose').Schema;

const schema = new Schema({
    title: {
        en: {
            type: String,
            default: ''
        },
        ar: {
            type: String,
            default: ''
        }
    },
    type: {
        type: String,
        enum: ['singleChoice', 'multiChoice', 'fullAnswer', 'nps']
    },
    options: [{
        en: {
            type: String,
            default: ''
        },
        ar: {
            type: String,
            default: ''
        }
    }]
});

module.exports = schema;
