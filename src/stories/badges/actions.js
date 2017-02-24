const add = ({
    userId,
    moduleId,
}) => ({
    type: `ADD_${moduleId}`,
    payload: {
        address: `badges:${userId}`,
    },
});

const cleanup = ({
    userId,
    moduleId,
}) => ({
    type: `CLEANUP_${moduleId}`,
    payload: {
        address: `badges:${userId}`,
    },
});

module.exports = {
    add,
    cleanup,
};
