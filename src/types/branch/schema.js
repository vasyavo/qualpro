const Schema = require('mongoose').Schema;
const async = require('async');
const CONTENT_TYPES = require('./../../public/js/constants/contentType');
const RetailSegmentModel = require('./../retailSegment/model');
const OutletModel = require('./../outlet/model');
const defaultPreviews = require('./../../stories/preview/autoload').defaults;

const ObjectId = Schema.Types.ObjectId;

const schema = Schema({
    name: {
        en: {
            type: String,
            default: '',
        },
        ar: {
            type: String,
            default: '',
        },
    },
    ID: String,
    imageSrc: {
        type: ObjectId,
        ref: CONTENT_TYPES.PREVIEW,
        default: () => {
            return defaultPreviews[CONTENT_TYPES.BRANCH];
        },
    },
    archived: {
        type: Boolean,
        default: false,
    },
    topArchived: {
        type: Boolean,
        default: false,
    },
    manager: {
        type: ObjectId,
        ref: CONTENT_TYPES.PERSONNEL,
        default: null,
    },
    address: {
        en: {
            type: String,
            default: '',
        },
        ar: {
            type: String,
            default: '',
        },
    },
    linkToMap: {
        type: String,
        default: '',
    },
    subRegion: {
        type: ObjectId,
        ref: CONTENT_TYPES.DOMAIN,
        required: true,
    },
    retailSegment: {
        type: ObjectId,
        ref: CONTENT_TYPES.RETAILSEGMENT,
        required: true,
    },
    outlet: {
        type: ObjectId,
        ref: CONTENT_TYPES.OUTLET,
        required: true,
    },
    createdBy: {
        user: {
            type: ObjectId,
            ref: CONTENT_TYPES.PERSONNEL,
            default: null,
        },
        date: {
            type: Date,
            default: Date.now,
        },
    },
    editedBy: {
        user: {
            type: ObjectId,
            ref: CONTENT_TYPES.PERSONNEL,
            default: null,
        },
        date: {
            type: Date,
            default: Date.now,
        },
    },
}, {
    autoIndex: false,
    collection: `${CONTENT_TYPES.BRANCH}es`,
    versionKey: false,
});

function updateArraysInRetSegmentAndOutlet(next) {
    const outletId = this.outlet;
    const retailSegmentId = this.retailSegment;
    const subRegionId = this.subRegion;

    async.series([

        (cb) => {
            RetailSegmentModel.findByIdAndUpdate(retailSegmentId, {
                $addToSet: {
                    subRegions: subRegionId,
                },
            }, cb);
        },

        (cb) => {
            OutletModel.findByIdAndUpdate(outletId, {
                $addToSet: {
                    subRegions: subRegionId,
                    retailSegments: retailSegmentId,
                },
            }, cb);
        },

    ], (err) => {
        if (err) {
            return next(err);
        }

        next();
    });
}
function updateArray(next) {
    const outletId = this.getUpdate().$set.outlet;
    const retailSegmentId = this.getUpdate().$set.retailSegment;
    const subRegionId = this.getUpdate().$set.subRegion;

    async.series([

        (cb) => {
            RetailSegmentModel.findByIdAndUpdate(retailSegmentId, {
                $addToSet: {
                    subRegions: subRegionId,
                },
            }, cb);
        },

        (cb) => {
            OutletModel.findByIdAndUpdate(outletId, {
                $addToSet: {
                    subRegions: subRegionId,
                    retailSegments: retailSegmentId,
                },
            }, cb);
        },

    ], (err) => {
        if (err) {
            return next(err);
        }

        next();
    });
}

schema.pre('save', updateArraysInRetSegmentAndOutlet);
schema.pre('findOneAndUpdate', updateArray);

module.exports = schema;
