module.exports = (pipeline) => {
    pipeline.push({
        $group: {
            _id: '$createdBy.user._id',
            achievementCount: { $sum: 1 },
            label: { $first: '$createdBy.user.name' },
        },
    });
};
