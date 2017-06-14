const analyzeByMethods = {
    employee: require('./analyzeByEmployee'),
    publisher: require('./analyzeByPublisher'),
    position: require('./analyzeByPosition'),
    country: require('./analyzeByCountry'),
    region: require('./analyzeByRegion'),
    subRegion: require('./analyzeBySubRegion'),
    branch: require('./analyzeByBranch'),
};

module.exports = (pipeline, analyzeBy) => {
    if (analyzeByMethods[analyzeBy]) {
        return analyzeByMethods[analyzeBy](pipeline);
    }

    return analyzeByMethods.publisher(pipeline);
};
