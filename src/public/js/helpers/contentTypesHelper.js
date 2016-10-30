(function () {
    var createContentTypesHelper = function (CONTENT_TYPES) {
        var defContentTypes = [CONTENT_TYPES.COUNTRY,
            CONTENT_TYPES.REGION,
            CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.RETAILSEGMENT,
            CONTENT_TYPES.OUTLET,
            CONTENT_TYPES.BRANCH];

        var contentTypes = defContentTypes;

        var setContentTypes = function (types) {
            if (!Array.isArray(types)) {
                throw new Error('First argument must be array');
            }

            contentTypes = types;
        };

        var getNextAfterAll = function (types) {
            var lastType = getLastFrom(types);

            return getNextType(lastType);
        };

        var getNextType = function (type) {
            var i = contentTypes.indexOf(type);

            return contentTypes[i + 1];
        };

        var getPreviousType = function (type) {
            var i = contentTypes.indexOf(type);
            return contentTypes[i - 1];
        };

        var getAllAfter = function (type) {
            var i = contentTypes.indexOf(type);
            return contentTypes.slice(i + 1);
        };

        var getAllBefore = function (type) {
            var i = contentTypes.indexOf(type);
            return contentTypes.slice(0, i);
        };

        var moreThan = function (comparable, comparative) {
            if (!comparable || !comparative) {
                return false;
            }

            var i = contentTypes.indexOf(comparable);
            var j = contentTypes.indexOf(comparative);
            return i > j;
        };

        var forEachType = function (iterator) {
            contentTypes.forEach(function (value, index, array) {
                iterator(value, index, array);
            });
        };

        var first = function () {
            return contentTypes[0];
        };

        var getLastFrom = function (types) {
            var length = types.length;
            var lastType = types[length - 1];
            var lastIndex = contentTypes.indexOf(lastType);
            var index;

            for (var i = types.length - 1;
                 i >= 0;
                 i--) {
                if ((index = contentTypes.indexOf(types[i])) > lastIndex) {
                    lastIndex = index;
                    lastType = types[i];
                }
            }

            return lastType;
        };

        var getDisplayName = function (contentType) {
            switch (contentType) {
                case CONTENT_TYPES.COUNTRY:
                    return CONTENT_TYPES.DISPLAY_NAMES.COUNTRY;
                case CONTENT_TYPES.REGION:
                    return CONTENT_TYPES.DISPLAY_NAMES.REGION;
                case CONTENT_TYPES.SUBREGION:
                    return CONTENT_TYPES.DISPLAY_NAMES.SUB_REGION;
                case CONTENT_TYPES.RETAILSEGMENT:
                    return CONTENT_TYPES.DISPLAY_NAMES.RETAIL_SEGMENT;
                case CONTENT_TYPES.OUTLET:
                    return CONTENT_TYPES.DISPLAY_NAMES.OUTLET;
                case CONTENT_TYPES.BRANCH:
                    return CONTENT_TYPES.DISPLAY_NAMES.BRANCH;
            }
        };

        var getCreationType = function (contentType) {
            switch (contentType) {
                case CONTENT_TYPES.COUNTRY:
                case CONTENT_TYPES.REGION:
                case CONTENT_TYPES.BRANCH:
                case CONTENT_TYPES.SUBREGION:
                    return contentType;
                case CONTENT_TYPES.RETAILSEGMENT:
                case CONTENT_TYPES.OUTLET:
                    return CONTENT_TYPES.BRANCH;
            }
        };

        var resetContentTypes = function () {
            contentTypes = defContentTypes;
        };

        return {
            setContentTypes  : setContentTypes,
            getNextType      : getNextType,
            getPreviousType  : getPreviousType,
            getAllAfter      : getAllAfter,
            getAllBefore     : getAllBefore,
            moreThan         : moreThan,
            forEachType      : forEachType,
            first            : first,
            getLastFrom      : getLastFrom,
            getDisplayName   : getDisplayName,
            getCreationType  : getCreationType,
            getNextAfterAll  : getNextAfterAll,
            resetContentTypes: resetContentTypes,
            country          : CONTENT_TYPES.COUNTRY,
            region           : CONTENT_TYPES.REGION,
            subRegion        : CONTENT_TYPES.SUBREGION,
            retailSegment    : CONTENT_TYPES.RETAILSEGMENT,
            outlet           : CONTENT_TYPES.OUTLET,
            branch           : CONTENT_TYPES.BRANCH
        };
    };

    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            module.exports = createContentTypesHelper(require('../constants/contentType.js'));
        }
    } else if (typeof define !== 'undefined' && define.amd) {
        define(['constants/contentType'], function (CONTENT_TYPES) {
            return createContentTypesHelper(CONTENT_TYPES);
        });
    } else {
        throw new Error('Not implemented');
    }
}());
