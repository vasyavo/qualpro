const analyzeByMethods = {
    country: require('./analyzeByCountry'),
    region: require('./analyzeByRegion'),
    subRegion: require('./analyzeBySubRegion'),
    branch: require('./analyzeByBranch'),
    position: require('./analyzeByPosition'),
    employee: require('./analyzeByEmployee'),
    publisher: require('./analyzeByPublisher'),
};

module.exports = (pipeline, analyzeBy, queryFilter) => {
    if (analyzeByMethods[analyzeBy]) {
        return analyzeByMethods[analyzeBy](pipeline, queryFilter);
    }

    return analyzeByMethods.country(pipeline, queryFilter);
};
