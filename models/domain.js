module.exports = (function () {
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    /**
     * @constructor DomainModel
     * @type {*|Schema}
     *
     * @property {String} name
     * @property {String} imageSrc ___base64___ representation of avatar
     * @property {String} currency ___reference___ to {@link CurrencyModel}
     * @property {Bool} archived is domain archived
     * @property {Bool} topArchived is domain topArchived
     * @property {String} type _Enum ['country', 'region', 'subRegion']_
     * @property {String} parent ___reference___ to {@link DomainModel}
     * @property {Object} createdBy
     * @property {String} createdBy.user ___reference___ to {@link PersonnelModel}
     * @property {Date} createdBy.date
     * @property {Object} editedBy
     * @property {String} editedBy.user ___reference___ to {@link PersonnelModel}
     * @property {Date} editedBy.date
     */

    var schema = new mongoose.Schema({

        name: {
            en: {type: String},
            ar: {type: String}
        },

        ID      : String,
        imageSrc: {
            type   : String,
            default: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAACWAQMAAAAGz+OhAAAABlBMVEXNy8v///83JiJ6AAABlUlEQVRIx+3UMWrEQAyFYQ0Dcekj+ApbpgjrK6XcbuZocxQfYUoXZhRJtmGfxhAIKUJYNbt8jX+EZXrNv5vEzKszltmQglpDi6zzMxuuTJ/pbdXGX7fvn9uIwlXzn7VQe4trb8PW29hiZxOHC8sXVpK3kZfZ28B1YobX6C3yOvI++bApsAbalNOINdBmOWzOicNh9bQyc/a2SOCD0KoESiXYOuj/CLZFuw2wFuw20rOxBOovmATqKsA0UFYBpoHJmQbOJYJp4FQDmAaOG4Fp4NDQ2DZICcw2mNFsg3kGs8DizAInNA1cnGmgs6KB3jSwepPAOjqTQG83Cfx09i6BN2cfEkjO7hLobZbAzjI3mtxeSuLOFgn0ViUQrY6rbhBt2HSDzppuEGyNrBtECyyBEWwjPc0A1ihpoDMLTM/GFKsGguX9isEKkQaCyW1pIJjdUYtg+x0FMN5vB63snxmwlR4aCMZsG3RmGzxt2s02uKDZBgt8YNk2mA8LO+1XjGOBnY0XNlxYvLCg5odzb4n6udNrXnPOF+LsukzuroMwAAAAAElFTkSuQmCC'
        },

        currency   : {type: String, ref: CONTENT_TYPES.CURRENCY, default: null},
        archived   : {type: Boolean, default: false},
        topArchived: {type: Boolean, default: false},
        type       : {
            type    : String,
            enum    : ['country', 'region', 'subRegion'/*, 'retailSegment', 'outlet', 'branch'*/],
            required: true
        },

        parent   : {type: ObjectId, ref: CONTENT_TYPES.DOMAIN, default: null},
        createdBy: {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {type: Date, default: new Date()}
        },

        editedBy: {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {type: Date, default: new Date()}
        }
    }, {collection: 'domains'});

    schema.index({name: 1, type: 1}, {unique: true});

    mongoose.model(CONTENT_TYPES.DOMAIN, schema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas[CONTENT_TYPES.DOMAIN] = schema;
})();