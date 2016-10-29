'use strict';

module.exports = (function () {
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    var location = new mongoose.Schema({
        country      : {type: ObjectId, ref: CONTENT_TYPES.DOMAIN},
        retailSegment: {type: ObjectId, ref: CONTENT_TYPES.RETAILSEGMENT},
        outlet       : {type: ObjectId, ref: CONTENT_TYPES.OUTLET}
    }, {
        _id: false
    });

    var schema = new mongoose.Schema({
        name: {
            en: {type: String, default: '', index: {unique: true, sparse: true}},
            ar: {type: String, default: '', index: {unique: true, sparse: true}}
        },

        barCode: {type: String, default: ''},
        packing: {type: String, default: ''},
        ppt    : {type: Number, min: 0, default: 0}, //TODO: review field PPT (product item model)
        pptPerCase : {type: Number, min: 0, default: 0},
        rspMin : {type: Number, min: 0, default: 0},
        rspMax : {type: Number, min: 0, default: 0},
        origin : [{type: ObjectId, ref: CONTENT_TYPES.ORIGIN}],

        category: {type: ObjectId, ref: CONTENT_TYPES.CATEGORY},
        variant : {type: ObjectId, ref: CONTENT_TYPES.VARIANT},

        country: {type: ObjectId, ref: CONTENT_TYPES.DOMAIN},

        location: [location],

        archived: {
            type   : Boolean,
            default: false
        },

        topArchived: {type: Boolean, default: false},
        createdBy  : {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {
                type   : Date,
                default: new Date()
            }
        },

        editedBy: {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {
                type   : Date,
                default: new Date()
            }
        }
    }, {collection: 'items'});

    schema.pre('save', function (next) {
        this.ppt = Math.round(this.ppt * 100);
        this.pptPerCase = Math.round(this.pptPerCase * 100);
        this.rspMin = Math.round(this.rspMin * 100);
        this.rspMax = Math.round(this.rspMax * 100);
        next();
    });

    schema.pre('update', function (next) {
        var item;
        var price;
        var createdBy;
        var pricePerCase;
        var rspMin;
        var rspMax;
        var ItemHistoryModel;

        if (this._update.$set && this._update.$set.ppt) {
            item = this._conditions._id;
            price = this._update.$set.ppt;
            pricePerCase = this._update.$set.pptPerCase;
            rspMin = this._update.$set.rspMin;
            rspMax = this._update.$set.rspMax;
            createdBy = this._update.$set.editedBy;
            ItemHistoryModel = this.model.db.model(CONTENT_TYPES.ITEMHISTORY, mongoose.Schemas[CONTENT_TYPES.ITEMHISTORY]);

            this.update({}, {
                $set: {
                    ppt: Math.round(price * 100),
                    pptPerCase: Math.round(pricePerCase * 100),
                    rspMin: Math.round(rspMin * 100),
                    rspMax: Math.round(rspMax * 100)
                }
            });

            ItemHistoryModel.create({
                item     : item,
                ppt      : price,
                createdBy: createdBy
            }, function (err) {
                if (err) {
                    return next(err);
                }

                next();
            });
        } else {
            next();
        }
    });

    schema.post('findOne', function (model) {
        var price = model.get('ppt');
        var pricePerCase = model.get('pptPerCase');
        var rspMin = model.get('rspMin');
        var rspMax = model.get('rspMax');

        model.set('ppt', price / 100);
        model.set('pptPerCase', pricePerCase / 100);
        model.set('rspMin', rspMin / 100);
        model.set('rspMax', rspMax / 100);
    });

    mongoose.model(CONTENT_TYPES.ITEM, schema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas[CONTENT_TYPES.ITEM] = schema;
})();
