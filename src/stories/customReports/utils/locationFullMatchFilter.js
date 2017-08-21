const CONTENT_TYPES = require('./../../../public/js/constants/contentType');

const locations = [CONTENT_TYPES.COUNTRY, CONTENT_TYPES.REGION, CONTENT_TYPES.SUBREGION, CONTENT_TYPES.BRANCH];

/**
 * @function
 * @param {Array} pipeline - current pipeline.
 * @param {Object} personnel - current user .
 * @param {Object} filter - filter from user.
 */

module.exports = (pipeline, personnel, filter) => {
    const $locationMatch = {
        $and: [],
    };

    locations.forEach((location) => {
        const locationItems = personnel[location] && personnel[location].length ? personnel[location] : filter[location];

        if (locationItems && locationItems.length) {
            $locationMatch.$and.push({
                $or: [
                    {
                        [location]: {
                            $in: locationItems,
                        },
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
