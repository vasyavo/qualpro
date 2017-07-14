var _ = require('underscore');
var Backbone = require('backbone');
var listTemplate = require('../../../../templates/personnel/list/list.html');
var REGEXP = require('../../../constants/validation');
var STATUSES = require('../../../constants/personnelStatuses');
var CONTENT_TYPES = require('../../../constants/contentType');
var App = require('../../../appState');

module.exports = Backbone.View.extend({
    template: _.template(listTemplate),

    initialize: function (options) {
        this.translation = options.translation;
        this.collection = options.collection;
        this.startNumber = (options.page - 1) * options.itemsNumber;
        this.showCheckboxes = options.showCheckboxes;
    },

    composeDataForListView: function (collectionJSON) {
        var currentLanguage = (App && App.currentUser && App.currentUser.currentLanguage) ? App.currentUser.currentLanguage : 'en';
        collectionJSON = collectionJSON || this.collection.toJSON();

        function concatLocationArray(array) {
            var name;
            var resultString = '';

            array.forEach(function (element) {
                if (element) {
                    name = element.name.en;
                    if (resultString === '') {
                        resultString += name;
                    } else {
                        resultString += ', ' + name;
                    }
                }
            });

            return resultString;
        }

        collectionJSON = _.map(collectionJSON, function (element) {
            var phone = element.phoneNumber;
            var status = element.status;
            var message;
            var locations = [CONTENT_TYPES.COUNTRY];

            element.phoneNumber = phone ? phone.replace(REGEXP.DISPLAY_PHONE_REGEXP, '+$1($2)-$3-$4') : '';

            element.location = '';

            locations.forEach(function (key) {
                var locArray = element[key];
                var locString;

                if (locArray.length) {
                    locString = concatLocationArray(locArray);

                    if (element.location === '') {
                        element.location += locString;
                    } else {
                        element.location += ' > ' + locString;
                    }
                }
            });

            if (status === 'login') {
                message = STATUSES[status.toUpperCase()].name[currentLanguage] + ' ' + element.lastAccess;
            } else {
                message = STATUSES[status.toUpperCase()].name[currentLanguage];
            }

            element.status = {
                classCss: status,
                message : message
            };

            return element;
        });

        return collectionJSON;
    },

    render: function () {
        var collectionJSON = this.composeDataForListView();

        this.$el.append(this.template({
            personnelCollection: collectionJSON,
            startNumber        : this.startNumber,
            showCheckboxes     : this.showCheckboxes,
            translation        : this.translation
        }));
    }
});
