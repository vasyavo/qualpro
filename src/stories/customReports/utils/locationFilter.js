const ObjectId = require('mongoose').Types.ObjectId;
const _ = require('lodash');
const CONTENT_TYPES = require('./../../../public/js/constants/contentType');

const props = [CONTENT_TYPES.COUNTRY, CONTENT_TYPES.REGION, CONTENT_TYPES.SUBREGION, CONTENT_TYPES.BRANCH];


/**
 * @function
 * @param {Array} pipeline Current pipeline.
 * @param {Object} personnel Current user.
 * @param {Object} filter Filter from user.
 * @param {Object|Boolean} scopeFilter
 */

module.exports = (pipeline, personnel, filter, scopeFilter) => {
    const $locationMatch = {
        $and: [],
    };

    props.forEach(prop => {
        let items;

        if (scopeFilter) {
            if (personnel[prop] && personnel[prop].length) {
                items = personnel[prop].map(id => {
                    return _.isString(id) ? ObjectId(id) : id;
                });
            } else {
                items = null;
            }

            scopeFilter[prop] = items || null; // for filter current scope of this location
            filter[prop] = items || filter[prop]; // for filter under scope of this location
        } else if (personnel[prop] && personnel[prop].length) {
            items = personnel[prop].map(id => {
                return _.isString(id) ? ObjectId(id) : id;
            });
        } else {
            items = filter[prop];
        }


        if (items && items.length) {
            $locationMatch.$and.push({
                $or: [
                    {
                        [prop]: {
                            $in: items,
                        },
                    },
                    {
                        [prop]: { $eq: null },
                    },
                    {
                        [prop]: { $eq: [] },
                    },
                ],
            });
        }
    });

    if ($locationMatch.$and.length && pipeline) {
        pipeline.push({
            $match: $locationMatch,
        });
    }
};
