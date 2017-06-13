const CONTENT_TYPES = require('./../../../public/js/constants/contentType');

const locations = [CONTENT_TYPES.COUNTRY, CONTENT_TYPES.REGION, CONTENT_TYPES.SUBREGION, CONTENT_TYPES.BRANCH];

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

    if ($locationMatch.$and.length) {
        pipeline.push({
            $match: $locationMatch,
        });
    }
};
