module.exports = {
    country: {
        created: {
            rolesWithinLocation: [
                'tm',
            ],
        },
        edited: {
            everyoneWithinLocation: true,
        },
        archived: {
            everyoneWithinLocation: true,
        },
    },
    region: {
        created: {
            rolesWithinLocation: [
                'ma',
                'ca',
                'tm',
            ],
        },
        edited: {
            everyoneWithinLocation: true,
        },
        archived: {
            everyoneWithinLocation: true,
        },
    },
    subRegion: {
        created: {
            rolesWithinLocation: [
                'ma',
                'ca',
                'am',
                'tm',
            ],
        },
        edited: {
            everyoneWithinLocation: true,
        },
        archived: {
            everyoneWithinLocation: true,
        },
    },
    // trade channel as retail segment
    retailSegment: {
        created: {
            everyAdmin: true,
        },
        edited: {
            everyAdmin: true,
            everyColleagueIndirectly: true,
        },
        archived: {
            everyAdmin: true,
            everyColleagueIndirectly: true,
        },
    },
    // customer as outlet
    outlet: {
        created: {
            everyAdmin: true,
        },
        edited: {
            everyAdmin: true,
            everyColleagueIndirectly: true,
        },
        archived: {
            everyAdmin: true,
            everyColleagueIndirectly: true,
        },
    },
    branch: {
        created: {
            everyAdminIndirectly: true,
        },
        edited: {
            everyAdminIndirectly: true,
            everyColleagueIndirectly: true,
        },
        archived: {
            everyAdminIndirectly: true,
            everyColleagueIndirectly: true,
        },
    },
};
