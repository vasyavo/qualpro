const {
    ADD_ACTIVITY_LIST,
    CLEANUP_ACTIVITY_LIST,
} = require('./actionTypes');


const add = ({
    userId,
    // moduleId,
}) => ({
    type: ADD_ACTIVITY_LIST,
    payload: {
        address: `badges:${userId}`,
    },
});

const cleanup = ({ userId }) => ({
    type: CLEANUP_ACTIVITY_LIST,
    payload: {
        address: `badges:${userId}`,
    },
});

module.exports = {
    add,
    cleanup,
};
