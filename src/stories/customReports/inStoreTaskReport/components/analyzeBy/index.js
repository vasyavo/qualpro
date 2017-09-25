const analyzeByMethods = {
    originator: require('./analyzeByOriginator'),
    assignee: require('./analyzeByAssignee'),
    country: require('./analyzeByCountry'),
    region: require('./analyzeByRegion'),
    subRegion: require('./analyzeBySubRegion'),
    branch: require('./analyzeByBranch'),
    position: require('./analyzeByPosition'),
    priority: require('./analyzeByPriority'),
};

module.exports = (pipeline, analyzeBy, queryFilter, personnel) => {
    if (analyzeByMethods[analyzeBy]) {
        return analyzeByMethods[analyzeBy](pipeline, queryFilter, personnel);
    }

    return analyzeByMethods.originator(pipeline, queryFilter, personnel);
};
