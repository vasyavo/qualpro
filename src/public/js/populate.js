var $ = require('jQuery');
var _ = require('Underscore');
var Cookies = require('js-cookie');
var dataService = require('./dataService');
var contentTypes = require('./helpers/contentTypesHelper');
var selectTemplate = require('../templates/main/selectTemplate.html');
var CONTENT_TYPES = require('./constants/contentType');
var DropDownView = require('./views/filter/dropDownView');
var FilterCollection = require('./collections/filter/filterCollection');

var types = [
    CONTENT_TYPES.COUNTRY,
    CONTENT_TYPES.REGION,
    CONTENT_TYPES.SUBREGION,
    CONTENT_TYPES.RETAILSEGMENT,
    CONTENT_TYPES.OUTLET,
    CONTENT_TYPES.BRANCH
];

var get = function (id, url, data, field, context, isCreate, canBeEmpty, parrrentContentId) {
    dataService.getData(url, data, function (err, response) {
        context.responseObj[id] = [];
        if (canBeEmpty) {
            context.responseObj[id].push({_id: "", name: "Select"});
        }
        context.responseObj[id] = context.responseObj[id].concat(_.map(response, function (item) {
            return {_id: item._id, name: item[field], level: item.projectShortDesc || ""};
        }));

        if (isCreate) {
            $(id).text(context.responseObj[id][0].name).attr("data-id", context.responseObj[id][0]._id);
        }
        if (parrrentContentId && parrrentContentId.split("=").length === 2) {
            parrrentContentId = parrrentContentId.split("=")[1];
        }
        if (parrrentContentId) {
            var current = _.filter(response, function (item) {
                return item._id === parrrentContentId;
            });
            $(id).text(current[0][field]).attr("data-id", current[0]._id);
        }
    });
};

var getForDd = function (id, context, contentType, language, options) {
    dataService.getData('/' + contentType + '/getForDd', options || {}, function (err, response) {
        var name;

        context.responseObj[id] = _.map(response, function (item) {
            if (language) {
                name = (item.name && item.name[language]) ? item.name[language] : item.name.en;

                return {_id: item._id, name: name};
            }

            return {_id: item._id, name: item.name};
        });
    });
};

var getPersonnels = function (id, context) {
    var _id = context.parentId;
    var type = contentTypes.getPreviousType(context.contentType);
    var queryObject = {};

    queryObject[type] = _id;

    dataService.getData("/personnel/getForDd", queryObject, function (err, response) {
        context.responseObj[id] = _.map(response, function (item) {
            return {
                _id   : item._id,
                name  : item.fullName,
                mobile: item.phoneNumber,
                email : item.email
            };
        });
    });
};

var showSelect = function (e, prev, next, context, number) {
    e.stopPropagation();

    var targetEl = $(e.target);
    var attr = targetEl.attr("id") || targetEl.closest('td').data("content");
    var data = context.responseObj["#" + attr];
    var elementVisible;
    var targetParent = $(e.target).parent();
    var newSel;
    var template = _.template(selectTemplate);
    var parent;
    var currentPage = 1;
    var s;
    var start;
    var end;
    var allPages;

    elementVisible = number || 10;

    if (targetParent.prop('tagName') !== 'TR') {
        newSel = targetParent.find(".newSelectList");
    } else {
        newSel = targetParent.find(".emptySelector");
    }

    if (prev || next) {
        newSel = $(e.target).closest(".newSelectList");
        if (!data) {
            data = context.responseObj["#" + newSel.parent().find(".currentSelected").attr("id")];
        }
    }

    parent = newSel.length > 0 ? newSel.parent() : $(e.target).parent();

    if (parent.prop('tagName') === 'TR') {
        parent = $(e.target);
    }

    if (newSel.length && newSel.is(":visible") && !prev && !next) {
        newSel.hide();
        return;
    }

    $(".newSelectList").hide();

    if ((prev || next) && newSel.length) {
        currentPage = newSel.data("page");
        newSel.remove();
    } else if (newSel.length) {
        newSel.show();
        return;
    }

    if (prev) {
        currentPage--;
    }
    if (next) {
        currentPage++;
    }

    s = "<ul class='newSelectList' data-page='" + currentPage + "'>";
    start = (currentPage - 1) * elementVisible;
    end = Math.min(currentPage * elementVisible, data.length);
    allPages = Math.ceil(data.length / elementVisible);

    parent.append(template({
        collection    : data.slice(start, end),
        currentPage   : currentPage,
        allPages      : allPages,
        start         : start,
        end           : end,
        dataLength    : data.length,
        elementVisible: elementVisible
    }));

    return false;
};

contentTypes.setContentTypes(types);

var inputDropDown = function (options) {
    var $el = options.context.$el.find(options.selector);
    var currentLanguage = (App.currentUser && App.currentUser.currentLanguage) || Cookies.get('currentLanguage') || 'en';
    var anotherLanguage = (currentLanguage === 'en') ? 'ar' : 'en';
    var dropDownList = new FilterCollection();
    var dropDownView;
    var firstName;
    var lastName;
    var displayModel = options.displayModel;

    if (displayModel && !(displayModel instanceof Array)) {
        displayModel = [displayModel];
    }

    if (displayModel && displayModel.length) {
        displayModel.forEach(function (model) {
            if (options.contentType === "personnel") {
                firstName = model.firstName.currentLanguage || model.firstName[currentLanguage] ||
                    model.firstName[anotherLanguage] || model.firstName;

                lastName = model.lastName.currentLanguage || model.lastName[currentLanguage] ||
                    model.lastName[anotherLanguage] || model.lastName;

                model.name = firstName + ' ' + lastName;
            } /*else {
                model.name = model.name.currentLanguage || model.name[currentLanguage] ||
                    model.name[anotherLanguage] || model.name;
            }*/

            model._id = model._id || model.name;
        });
    }

    dropDownView = new DropDownView({
        dropDownList  : dropDownList,
        displayText   : options.displayText || options.contentType,
        selectedValues: displayModel,
        contentType   : options.contentType,
        dataProperty  : options.dataProperty,
        forPosition   : options.forPosition,
        singleUnselect: options.singleUnselect,
        multiSelect   : options.multiSelect,
        showSelectAll : options.showSelectAll
    });

    $el.replaceWith(dropDownView.el);

    dropDownView.on('changeItem', function (opts) {
        options.context.trigger('changeItem', opts);
    });

    if (options.collection) {
        dropDownView.collection.reset(options.collection);
        return;
    }

    dataService.getData('/' + options.contentType + '/getForDd', {}, function (err, response) {
        var list = _.map(response, function (item) {
            var id = item._id;
            var level = item.level;
            var name;

            if (options.contentType === 'personnel') {
                firstName = item.firstName[currentLanguage] || item.firstName[anotherLanguage];
                lastName = item.lastName[currentLanguage] || item.lastName[anotherLanguage];
                name = firstName + ' ' + lastName;

                return {
                    _id        : id,
                    name       : name,
                    phoneNumber: item.phoneNumber,
                    email      : item.email,
                    level: level
                };
            } else {
                name = item.name[currentLanguage] || item.name[anotherLanguage] || item.name;

                return {_id: id, name: name, level: level};
            }

        });

        dropDownView.collection.reset(list);
    });
};

module.exports = {
    get          : get,
    getForDd     : getForDd,
    showSelect   : showSelect,
    getPersonnels: getPersonnels,
    inputDropDown: inputDropDown
};
