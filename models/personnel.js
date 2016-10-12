'use strict';

module.exports = (function () {
    var CONTENT_TYPES = require('../public/js/constants/contentType.js');
    var mongoose = require('mongoose');
    var ObjectId = mongoose.Schema.Types.ObjectId;

    /**
     * @constructor PersonnelModel
     * @type {*|Schema}
     *
     * @property {String} pass
     * @property {Date} lastAccess last access of personnel
     * @property {String} imageSrc ___base64___ representation of avatar
     * @property {Object} firstName _First name_ of _Personnel_
     * @property {String} firstName.en
     * @property {String} firstName.ar
     * @property {Object} lastName _Last name_ of _Personnel_
     * @property {String} lastName.en
     * @property {String} lastName.ar
     * @property {Array} country ___reference___ to {@link DomainModel}
     * @property {Array} region ___reference___ to {@link DomainModel}
     * @property {Array} subRegion ___reference___ to {@link DomainModel}
     * @property {Array} branch ___reference___ to {@link BranchModel}
     * @property {String} email _Email_ address of _Personnel_. __Required__
     * @property {String} phoneNumber _phone number_ of _Personnel_
     * @property {Bool} super is super admin
     * @property {String} manager ___reference___ to {@link PersonnelModel}
     * @property {String} position ___reference___ to PositionModel
     * @property {String} accessRole ___reference___ to RoleModel
     * @property {Date} dateJoined _date_ when _Personnel_ joined
     * @property {Date} confirmed _date_ is _Personnel_ confirmed
     * @property {String} token _Token_ _Personnel_ token
     * @property {Bool} archived _flag_ if _Personnel_ is archived or active
     * @property {String} whoCanRW _enum ['owner', 'group', 'everyOne']_ who can read and write
     * @property {Object} groups
     * @property {String} groups.owner ___reference___ to {@link PersonnelModel}
     * @property {Array} groups.users ___reference___ to {@link PersonnelModel}
     * @property {Array} groups.group ___reference___ to {@link OutletModel}
     * @property {String} description _description_ of _Personnel_
     * @property {Object} createdBy
     * @property {String} createdBy.user ___reference___ to {@link PersonnelModel}
     * @property {Date} createdBy.date
     * @property {Object} editedBy
     * @property {String} editedBy.user ___reference___ to {@link PersonnelModel}
     * @property {Date} editedBy.date
     * @property {String} forgotToken _Token_ _Personnel_ token
     * @property {Object} vacation
     * @property {Bool} vacation.onLeave
     * @property {String} vacation.cover ___reference___ to {@link PersonnelModel}
     * @property {Bool} temp
     * @property {String} status _personnel status enum: ['login', 'archived', 'sendPass', 'neverLogin', 'onLeave', 'temp', 'inactive']_
     * @property {Object} avgRating
     * @property {Number} avgRating.monthly _min: 1 max: 5_
     * @property {Number} avgRating.biYearly _min: 1 max: 5_
     * @property {String} currentLanguage _enum ['en', 'ar']_

     */

    var personnelSchema = new mongoose.Schema({
        ID          : String,
        pass        : {type: String, default: ''},
        beforeAccess: Date,
        lastAccess  : Date,

        imageSrc: {
            type   : String,
            default: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAACWAQMAAAAGz+OhAAAABlBMVEXNy8v///83JiJ6AAABlUlEQVRIx+3UMWrEQAyFYQ0Dcekj+ApbpgjrK6XcbuZocxQfYUoXZhRJtmGfxhAIKUJYNbt8jX+EZXrNv5vEzKszltmQglpDi6zzMxuuTJ/pbdXGX7fvn9uIwlXzn7VQe4trb8PW29hiZxOHC8sXVpK3kZfZ28B1YobX6C3yOvI++bApsAbalNOINdBmOWzOicNh9bQyc/a2SOCD0KoESiXYOuj/CLZFuw2wFuw20rOxBOovmATqKsA0UFYBpoHJmQbOJYJp4FQDmAaOG4Fp4NDQ2DZICcw2mNFsg3kGs8DizAInNA1cnGmgs6KB3jSwepPAOjqTQG83Cfx09i6BN2cfEkjO7hLobZbAzjI3mtxeSuLOFgn0ViUQrY6rbhBt2HSDzppuEGyNrBtECyyBEWwjPc0A1ihpoDMLTM/GFKsGguX9isEKkQaCyW1pIJjdUYtg+x0FMN5vB63snxmwlR4aCMZsG3RmGzxt2s02uKDZBgt8YNk2mA8LO+1XjGOBnY0XNlxYvLCg5odzb4n6udNrXnPOF+LsukzuroMwAAAAAElFTkSuQmCC'
        },

        firstName: {
            en: {type: String, default: ''},
            ar: {type: String, default: ''}
        },

        lastName: {
            en: {type: String, default: ''},
            ar: {type: String, default: ''}
        },

        country  : [{type: ObjectId, ref: CONTENT_TYPES.DOMAIN}],
        region   : [{type: ObjectId, ref: CONTENT_TYPES.DOMAIN}],
        subRegion: [{type: ObjectId, ref: CONTENT_TYPES.DOMAIN}],
        branch   : [{type: ObjectId, ref: CONTENT_TYPES.BRANCH}],

        email           : {type: String/*, index: {unique: true, sparse: true}*/},
        phoneNumber     : {type: String, index: {unique: true, sparse: true}},
        super           : {type: Boolean, default: false},
        manager         : {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
        position        : {type: ObjectId, ref: CONTENT_TYPES.POSITION, default: null},
        accessRole      : {type: ObjectId, ref: CONTENT_TYPES.ROLE, default: null},
        dateJoined      : Date,
        confirmed       : Date,
        token           : String,
        archived        : {type: Boolean, default: false},
        whoCanRW        : {type: String, enum: ['owner', 'group', 'everyOne'], default: 'everyOne'},
        groups          : {
            owner: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            users: [{type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null}],
            group: [{type: ObjectId, ref: CONTENT_TYPES.OUTLET, default: null}]
        },
        description     : {type: String, default: ''},
        createdBy       : {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {type: Date, default: new Date()}
        },
        editedBy        : {
            user: {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null},
            date: {type: Date, default: new Date()}
        },
        forgotToken     : {type: String},
        vacation        : {
            onLeave: {type: Boolean, default: false},
            cover  : {type: ObjectId, ref: CONTENT_TYPES.PERSONNEL, default: null}
        },
        temp            : {type: Boolean, default: false},
        status          : {
            type   : String,
            enum   : ['login', 'archived', 'sendPass', 'neverLogin', 'onLeave', 'temp', 'inactive'],
            default: 'sendPass'
        },
        avgRating       : {
            monthly : {type: Number, min: 1, max: 5},
            biYearly: {type: Number, min: 1, max: 5}
        },
        currentLanguage : {type: String, enum: ['en', 'ar'], default: 'en'},
        lasMonthEvaluate: {type: String, default: null}
    }, {collection: 'personnels', versionKey: false});

    personnelSchema.virtual('fullName').get(function () {
        return this.firstName.en + ' ' + this.lastName.en;
    });

    personnelSchema.set('toJSON', {virtuals: true});

    // personnelSchema.index({email: 1, phoneNumber: 1}, {unique: true});

    mongoose.model(CONTENT_TYPES.PERSONNEL, personnelSchema);

    if (!mongoose.Schemas) {
        mongoose.Schemas = {};
    }

    mongoose.Schemas[CONTENT_TYPES.PERSONNEL] = personnelSchema;
})();
