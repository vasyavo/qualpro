const analyzeByMethods = {
    employee: require('./analyzeByEmployee'),
    country: require('./analyzeByCountry'),
    region: require('./analyzeByRegion'),
    subRegion: require('./analyzeBySubRegion'),
    branch: require('./analyzeByBanch'),
    position: require('./analyzeByPosition'),
};

module.exports = (pipeline, analyzeBy) => {
    if (analyzeByMethods[analyzeBy]) {
        return analyzeByMethods[analyzeBy](pipeline);
    }

    return analyzeByMethods.employee(pipeline);
};
