const analyzeByMethods = {
    country: require('./analyzeByCountry'),
    region: require('./analyzeByRegion'),
    subRegion: require('./analyzeBySubRegion'),
    branch: require('./analyzeByBranch'),
    publisher: require('./analyzeByPublisher'),
    assignee: require('./analyzeByAssignee'),
    assigneePosition: require('./analyzeByAssigneePosition'),
};

module.exports = (pipeline, analyzeBy, queryFilter) => {
    if (analyzeByMethods[analyzeBy]) {
        return analyzeByMethods[analyzeBy](pipeline, queryFilter);
    }

    return analyzeByMethods.publisher(pipeline);
};
