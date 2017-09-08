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

module.exports = (pipeline, analyzeBy) => {
    if (analyzeByMethods[analyzeBy]) {
        return analyzeByMethods[analyzeBy](pipeline);
    }

    return analyzeByMethods.originator(pipeline);
};
