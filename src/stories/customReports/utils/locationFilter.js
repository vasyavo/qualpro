const CONTENT_TYPES = require('./../../../public/js/constants/contentType');

const locations = [CONTENT_TYPES.COUNTRY, CONTENT_TYPES.REGION, CONTENT_TYPES.SUBREGION, CONTENT_TYPES.BRANCH];


/**
 * @function
 * @param {Array} pipeline - current pipeline.
 * @param {Object} personnel - current user .
 * @param {Object} filter - filter from user.
 * @param {Boolean} forFilter - condition is this function used for filter query or get docs query
 */

module.exports = (pipeline, personnel, filter, scopeFilter) => {
    const $locationMatch = {
        $and: [],
    };

    locations.forEach((location) => {

        let locationItems;

        if (scopeFilter) {
            locationItems = personnel[location] && personnel[location].length ? personnel[location] : null;

            scopeFilter[location] = locationItems || null; // for filter current scope of this location
            filter[location] = locationItems || filter[location]; // for filter under scope of this location
        } else {
            locationItems = personnel[location] && personnel[location].length ? personnel[location] : filter[location];
        }


        if (locationItems && locationItems.length) {
            $locationMatch.$and.push({
                $or: [
                    {
                        [location]: {
                            $in: locationItems,
                        },
                    },
                    {
                        [location]: { $eq: null },
                    },
                    {
                        [location]: { $eq: [] },
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
