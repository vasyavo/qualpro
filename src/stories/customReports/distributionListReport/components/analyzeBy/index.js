const analyzeByMethods = {
    country: require('./analyzeByCountry'),
    region: require('./analyzeByRegion'),
    subRegion: require('./analyzeBySubRegion'),
    branch: require('./analyzeByBranch'),
    product: require('./analyzeByProduct'),
    variant: require('./analyzeByVariant'),
    assigneePosition: require('./analyzeByAssigneePosition'),
    assignee: require('./analyzeByAssignee'),
};

module.exports = (pipeline, analyzeBy) => {
    if (analyzeByMethods[analyzeBy]) {
        return analyzeByMethods[analyzeBy](pipeline);
    }

    return analyzeByMethods.country(pipeline);
};
