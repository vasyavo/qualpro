const analyzeByMethods = {
    country: require('./analyzeByCountry'),
    region: require('./analyzeByRegion'),
    subRegion: require('./analyzeBySubRegion'),
    branch: require('./analyzeByBranch'),
    category: require('./analyzeByCategory'),
    publisher: require('./analyzeByPublisher'),
    position: require('./analyzeByPosition'),
    personnel: require('./analyzeByPersonnel'),
};

module.exports = (pipeline, analyzeBy, queryFilter) => {
    if (analyzeByMethods[analyzeBy]) {
        return analyzeByMethods[analyzeBy](pipeline, queryFilter);
    }

    return analyzeByMethods.country(pipeline);
};
