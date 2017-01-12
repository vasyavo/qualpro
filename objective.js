module.exports = [
    {
        headers: {
            contentType: 'Objective',
            type: 'Snapshot',
            version: 33,
        },
        payload: {
            title: 'some title',
            status: 'ongoing',
            createdBy: {
                user: '12345'
            }
        }
    },
    {
        headers: {
            contentType: 'Objective',
            type: 'Changes',
            version: 33,
        },
        payload: {
            status: 'completed'
        }
    },
    {
        headers: {
            contentType: 'Objective',
            type: 'Snapshot',
            version: 34,
        },
        payload: {
            title: 'some title',
            status: 'completed',
            createdBy: {
                user: '12345'
            }
        }
    },
    {
        headers: {
            contentType: 'Objective',
            type: 'Changed',
            version: 34,
        },
        payload: {
            title: 'another title'
        }
    }
];