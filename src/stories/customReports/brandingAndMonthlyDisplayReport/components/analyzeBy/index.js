const analyzeByMethods = {
    country: require('./analyzeByCountry'),
    region: require('./analyzeByRegion'),
    subRegion: require('./analyzeBySubRegion'),
    branch: require('./analyzeByBranch'),
    employee: require('./analyzeByEmployee'),
    position: require('./analyzeByPosition'),
};

module.exports = (pipeline, analyzeBy) => {
    if (analyzeByMethods[analyzeBy]) {
        return analyzeByMethods[analyzeBy](pipeline);
    }

    return analyzeByMethods.employee(pipeline);
};
