module.exports = (filterNames, queryFilter, personnel) => {
    const $generalMatch = {
        $and: [],
    };

    filterNames.forEach((filterName) => {
        const filterItems = queryFilter[filterName];

        if (filterItems && filterItems.length) {
            $generalMatch.$and.push({
                $or: [
                    {
                        [filterName]: {
                            $in: filterItems,
                        },
                    },
                    {
                        [filterName]: { $eq: null },
                    },
                    {
                        'createdBy.user': { $eq: personnel._id },
                    },
                ],
            });
        }
    });

    return $generalMatch;
};
