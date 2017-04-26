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
                        [filterName]: { $eq: [] },
                    },
                ],
            });
        }
    });

    return $generalMatch;
};
