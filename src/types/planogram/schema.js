const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const CONTENT_TYPES = require('./../../public/js/constants/contentType.js');

const schema = new Schema({
    country: { type: ObjectId, ref: CONTENT_TYPES.DOMAIN, require: true },
    retailSegment: [{ type: ObjectId, ref: CONTENT_TYPES.RETAILSEGMENT }],
    product: { type: ObjectId, ref: CONTENT_TYPES.CATEGORY, require: true },
    displayType: {
        _id : { type: String, enum: ['floorDisplayId', 'gondolaId', 'thematicStandId', 'shelfId', 'otherId']},
        name : {
            ar : String,
            en : String
        }
    },
    configuration: {
        _id: {
            type : ObjectId,
            require: true
        },
        name: {
            type: String,
            require: true
        }
    },
    fileID: { type: ObjectId, ref: CONTENT_TYPES.FILES, default: null, require: true },
    archived: { type: Boolean, default: false },
    createdBy: {
        user: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null },
        date: { type: Date, default: new Date() }
    },
    editedBy: {
        user: { type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null },
        date: { type: Date, default: new Date() }
    }
}, { collection: 'planograms' });
mongoose.connection.collection('planograms').createIndex({ 'displayType.name.en': 1, product: 1, country : 1, 'configuration._id' : 1}, { unique: true });

module.exports = schema;
