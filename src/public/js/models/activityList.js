var _ = require('underscore');
var moment = require('moment');
var locales = require('locales');
var parent = require('./parrent');
var CONTENT_TYPES = require('../constants/contentType');
var CONSTANTS = require('../constants/otherConstants');
var App = require('../appState');

var Model = parent.extend({
    defaults: {
        createdBy  : '',
        module     : null,
        itemType   : '',
        itemDetails: '',
        itemName   : '',
        country    : null
    },

    multilanguageFields: [
        'createdBy.user.firstName',
        'createdBy.user.lastName',
        'createdBy.user.accessRole.name',
        'itemName',
        'module.name',
        'country.name'
    ],

    urlRoot: function () {
        return CONTENT_TYPES.ACTIVITYLIST;
    },

    modelParse: function (model) {
        var currentLanguage = App && App.currentUser && App.currentUser.currentLanguage ? App.currentUser.currentLanguage : 'en';
        _.map(CONSTANTS.ACTIVITY_TYPES, function (type) {
            if (type._id === model.actionType) {
               return model.actionType = type;
            }
        });
        model.actionType.name.currentLanguage = model.actionType.name[currentLanguage];
        return model;
    }
});

Model.prototype.toJSON = function (option) {
    if (this.attributes.createdBy && this.attributes.createdBy.diffDate) {
        moment.locale(App.currentUser.currentLanguage, locales);
        this.attributes.createdBy.diffDate = moment.duration(this.attributes.createdBy.diffDate * -1).humanize(true);
    }
    return _.clone(this.attributes);

};

module.exports = Model;
