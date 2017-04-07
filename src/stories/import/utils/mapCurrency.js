module.exports = (options) => {
    const collection = options.collection;
    const name = options.prop;

    if (!name) {
        return null;
    }

    const enNameParts = name
        .split(' ')
        .map((item) => {
            return item.toLowerCase();
        });

    for (let itemKey in collection) {
        const item = collection[itemKey];

        if (!item.name) {
            continue;
        }
        // if enName and _id are equals
        if (name.length === 3 && name === item._id) {
            return item._id;
        }

        // if enName and name.en are similar
        const itemNameParts = item.name
            .split(' ')
            .map((item) => {
                return item.toLowerCase();
            });

        let correctParts = 0;

        for (let it in enNameParts) {
            const enNamePart = enNameParts[it].toLowerCase();

            if (itemNameParts.includes(enNamePart)) {
                correctParts ++;
            }
        }

        if (enNameParts.length === correctParts) {
            return item._id;
        }
    }

    return null;
};
