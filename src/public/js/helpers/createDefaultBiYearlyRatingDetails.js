var TableRating = require('../helpers/tableRating');

module.exports = function (translation) {
    return {
        planningAndOrganizationSkills: new TableRating(translation.planningAndOrganizationSkills, [[
            {
                id         : 'prepareObj',
                displayName: translation.prepareObj
            },
            {
                id         : 'preparePlan',
                displayName: translation.preparePlan
            },
            {
                id         : 'followPlan',
                displayName: translation.followPlan
            }
        ]]),

        sellingSkills: new TableRating(translation.sellingSkills, [[
            {
                id         : 'stockCheck',
                displayName: translation.stockCheck
            }, {
                id         : 'orderCalc',
                displayName: translation.orderCalc
            }, {
                id         : 'sellFeatures',
                displayName: translation.sellFeatures
            }, {
                id         : 'identifySign',
                displayName: translation.identifySign
            }, {
                id         : 'closingTech',
                displayName: translation.closingTech
            }, {
                id         : 'sellingAids',
                displayName: translation.sellingAids
            }, {
                id         : 'rotationAndCheck',
                displayName: translation.rotationAndCheck
            }, {
                id         : 'distribution',
                displayName: translation.distribution
            }, {
                id         : 'followIssues',
                displayName: translation.followIssues
            }
        ]]),

        reporting: new TableRating(translation.reporting, [[
            {
                id         : 'marketFeed',
                displayName: translation.marketFeed
            }, {
                id         : 'marketDev',
                displayName: translation.marketDev
            }, {
                id         : 'businessOpp',
                displayName: translation.businessOpp
            }, {
                id         : 'competAct',
                displayName: translation.competAct
            }, {
                id         : 'negSkill',
                displayName: translation.negSkill
            }, {
                id         : 'objections',
                displayName: translation.objections
            }
        ]]),

        performanceSummary: {
            title: translation.summaryOfPerformance,
            type : 'text'
        },

        personalSkills: new TableRating(translation.personnelSkills, [
            [
                {
                    id         : 'marketFeed',
                    displayName: translation.marketFeedSkills
                },
                {
                    id         : 'marketDev',
                    displayName: translation.marketDevSkills
                },
                {
                    id         : 'businessOpp',
                    displayName: translation.businessOppSkills
                },
                {
                    id         : 'persMot',
                    displayName: translation.persMot
                },
                {
                    id         : 'investOr',
                    displayName: translation.investOr
                },
                {
                    id         : 'listStyle',
                    displayName: translation.listStyle
                },
                {
                    id         : 'selfTimeMan',
                    displayName: translation.selfTimeMan
                },
                {
                    id         : 'energyLev',
                    displayName: translation.energyLev
                },
                {
                    id         : 'detailsAtt',
                    displayName: translation.detailsAtt
                },
                {
                    id         : 'problemSol',
                    displayName: translation.problemSol
                }
            ],
            [
                {
                    id         : 'customerAw',
                    displayName: translation.customerAw
                },
                {
                    id         : 'teamWork',
                    displayName: translation.teamWork
                },
                {
                    id         : 'cooperation',
                    displayName: translation.cooperation
                },
                {
                    id         : 'communication',
                    displayName: translation.communication
                },
                {
                    id         : 'computerSkills',
                    displayName: translation.computerSkills
                },
                {
                    id         : 'initiative',
                    displayName: translation.initiative
                },
                {
                    id         : 'appearance',
                    displayName: translation.appearance
                },
                {
                    id         : 'attitude',
                    displayName: translation.attitude
                },
                {
                    id         : 'attendance',
                    displayName: translation.attendance
                },
                {
                    id         : 'commitment',
                    displayName: translation.commitment
                }
            ]
        ]),

        overallPerformance: {
            title  : translation.overallPerformanceRating,
            type   : 'singleSelect',
            options: [{
                displayName: translation.exceptional,
                value      : 5
            }, {
                displayName: translation.superior,
                value      : 4
            }, {
                displayName: translation.standard,
                value      : 3
            }, {
                displayName: translation.belowStandard,
                value      : 2
            }, {
                displayName: translation.newRating,
                value      : 1
            }]
        },

        action: {
            title: translation.action,
            type : 'text'
        },

        objectives: {
            title: translation.objectives,
            type : 'text'
        }
    };
};
