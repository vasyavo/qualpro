const _ = require('underscore');

module.exports = (resultObject, constants) => {
    return _.map(resultObject || [], function(element) {
        let constantsElement;

        if (element) {
            let name;
            if (_.isArray(constants)) {
                constantsElement = _.findWhere(constants, {_id : element});
            } else {
                constantsElement = constants[element] || constants[element.toUpperCase()];
            }
            if (constantsElement && constantsElement.name) {
                name = constantsElement.name && constantsElement.name.en ? constantsElement.name : {en : constantsElement.name};
            } else {
                name = {en : constantsElement};
            }

            element = {
                _id : element,
                name : name
            };
        }

        return element;
    });
};
