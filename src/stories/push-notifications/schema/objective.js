module.exports = {
    objective: {
        draftCreated: {
            onlyOriginator: true,
        },
        published: {
            originator: true,
            assignee: true,
            supervisor: true,
            adminOnBase: true,
        },
        edited: {
            originator: true,
            assignee: true,
            supervisor: true,
            adminOnBase: true,
        },
        statusHadBeenChanged: {
            originator: true,
            assignee: true,
            supervisor: true,
            adminOnBase: true,
            /*
            * @prop: betweenLowAssignees
            * @scenario:
            *   IF SM and MC assigned to same objective
            *   AND SM was updated status
            *   THEN MC should receive notification as well as other mentioned above
            * */
            betweenLowAssignees: true,
        },
        commentWasAdded: {
            originator: true,
            assignee: true,
            supervisor: true,
            adminOnBase: true,
        },
        attachmentWasAdded: {
            originator: true,
            assignee: true,
            supervisor: true,
            adminOnBase: true,
        },
        assignedTo: {
            ifHeSupervisorAndAssignedToHisSubordinate: true,
        },
        assignedToEmployeeOnLeave: {
            originator: true,
            assignee: true,
            supervisor: true,
        },
        distributionFormWasUpdated: {
            originator: true,
            assignee: true,
            supervisor: true,
            adminOnBase: true,
            betweenLowAssignees: true,
        },
        visibilityFormWasUpdated: {
            originator: true,
            assignee: true,
            supervisor: true,
            adminOnBase: true,
            betweenLowAssignees: true,
        },
    },
};
