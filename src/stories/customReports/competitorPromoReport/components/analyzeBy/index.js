const analyzeByMethods = {
    country: require('./analyzeByCountry'),
    region: require('./analyzeByRegion'),
    subRegion: require('./analyzeBySubRegion'),
    branch: require('./analyzeByBranch'),
    brand: require('./analyzeByBrand'),
    category: require('./analyzeByCategory'),
    position: require('./analyzeByPosition'),
    employee: require('./analyzeByEmployee'),
    promoType: require('./analyzeByPromoType'),
};

module.exports = (pipeline, analyzeBy) => {
    if (analyzeByMethods[analyzeBy]) {
        return analyzeByMethods[analyzeBy](pipeline);
    }

    return analyzeByMethods.employee(pipeline);
};
