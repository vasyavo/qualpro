module.exports = function () {
    return {
        activityList: {
            views: {
                list: require('./views/activityList/list/listView'),
                topBarView: require('./views/activityList/topBarView'),
            },
            collection: require('./collections/activityList/collection'),
            model: require('./models/activityList'),
            translation: {
                en: require('./translations/en/activityList'),
                ar: require('./translations/ar/activityList'),
            },
        },
        achievementForm: {
            views: {
                list: require('./views/achievementForm/list/listView'),
                preview: require('./views/achievementForm/preView/preView'),
                topBarView: require('./views/achievementForm/topBarView'),
            },
            collection: require('./collections/achievementForm/collection'),
            model: require('./models/achievementForm'),
            translation: {
                en: require('./translations/en/achievementForm'),
                ar: require('./translations/ar/achievementForm'),
            },
        },
        brandingAndMonthlyDisplay: {
            views: {
                list: require('./views/brandingAndMonthlyDisplay/list/listView'),
                preview: require('./views/brandingAndMonthlyDisplay/preView/preView'),
                topBarView: require('./views/brandingAndMonthlyDisplay/topBarView'),
            },
            collection: require('./collections/brandingAndMonthlyDisplay/collection'),
            model: require('./models/brandingAndMonthlyDisplay'),
            translation: {
                en: require('./translations/en/brandingAndMonthlyDisplay'),
                ar: require('./translations/ar/brandingAndMonthlyDisplay'),
            },
        },
        competitorBranding: {
            views: {
                list: require('./views/competitorBranding/list/listView'),
                preview: require('./views/competitorBranding/preView/preView'),
                topBarView: require('./views/competitorBranding/topBarView'),
            },
            collection: require('./collections/competitorBranding/collection'),
            model: require('./models/competitorBranding'),
            translation: {
                en: require('./translations/en/competitorBranding'),
                ar: require('./translations/ar/competitorBranding'),
            },
        },
        competitorPromotion: {
            views: {
                list: require('./views/competitorPromotion/list/listView'),
                preview: require('./views/competitorPromotion/preView/preView'),
                topBarView: require('./views/competitorPromotion/topBarView'),
            },
            collection: require('./collections/competitorPromotion/collection'),
            model: require('./models/competitorPromotion'),
            translation: {
                en: require('./translations/en/competitorPromotion'),
                ar: require('./translations/ar/competitorPromotion'),
            },
        },
        competitorsList: {
            views: {
                list: require('./views/competitorsList/list/listView'),
                topBarView: require('./views/competitorsList/topBarView'),
            },
            collection: require('./collections/competitorsList/collection'),
            model: require('./models/competitorsList'),
            translation: {
                en: require('./translations/en/competitorsList'),
                ar: require('./translations/ar/competitorsList'),
            },
        },
        consumersSurvey: {
            views: {
                list: require('./views/consumersSurvey/list/listView'),
                preview: require('./views/consumersSurvey/preView/preView'),
                topBarView: require('./views/consumersSurvey/topBarView'),
            },
            collection: require('./collections/consumersSurvey/collection'),
            model: require('./models/consumersSurvey'),
            translation: {
                en: require('./translations/en/consumersSurvey'),
                ar: require('./translations/ar/consumersSurvey'),
            },
        },
        contactUs: {
            views: {
                list: require('./views/contactUs/list/listView'),
                preview: require('./views/contactUs/preView/preView'),
                topBarView: require('./views/contactUs/topBarView'),
            },
            collection: require('./collections/contactUs/collection'),
            model: require('./models/contactUs'),
            translation: {
                en: require('./translations/en/contactUs'),
                ar: require('./translations/ar/contactUs'),
            },
        },
        contractsSecondary: {
            views: {
                list: require('./views/contractsSecondary/list/listView'),
                preview: require('./views/contractsSecondary/preView/preView'),
                topBarView: require('./views/contractsSecondary/topBarView'),
            },
            collection: require('./collections/contractsSecondary/collection'),
            model: require('./models/contractsSecondary'),
            translation: {
                en: require('./translations/en/contractsSecondary'),
                ar: require('./translations/ar/contractsSecondary'),
            },
        },
        contractsYearly: {
            views: {
                list: require('./views/contractsYearly/list/listView'),
                preview: require('./views/contractsYearly/preView/preView'),
                topBarView: require('./views/contractsYearly/topBarView'),
            },
            collection: require('./collections/contractsYearly/collection'),
            model: require('./models/contractsYearly'),
            translation: {
                en: require('./translations/en/contractsYearly'),
                ar: require('./translations/ar/contractsYearly'),
            },
        },
        inStoreTasks: {
            views: {
                list: require('./views/inStoreTasks/list/listView'),
                preview: require('./views/inStoreTasks/preView/preView'),
                topBarView: require('./views/inStoreTasks/topBarView'),
            },
            collection: require('./collections/inStoreTasks/collection'),
            model: require('./models/inStoreTasks'),
            taskFlowModel: require('./models/taskFlow'),
            translation: {
                en: require('./translations/en/inStoreTasks'),
                ar: require('./translations/ar/inStoreTasks'),
            },
        },
        itemsPrices: {
            views: {
                list: require('./views/itemsPrices/list/listView'),
                topBarView: require('./views/itemsPrices/topBarView'),
            },
            collection: require('./collections/itemsPrices/collection'),
            model: require('./models/itemsPrices'),
            templates: {
                create: {
                    categoryAndVariant: {
                        header: require('../templates/itemsPrices/create/categoryAndVariant/header.html'),
                        list: require('../templates/itemsPrices/create/categoryAndVariant/list.html'),
                        newRow: require('../templates/itemsPrices/create/categoryAndVariant/newRow.html'),
                    },
                    item: {
                        header: require('../templates/itemsPrices/create/item/header.html'),
                        list: require('../templates/itemsPrices/create/item/list.html'),
                        newRow: require('../templates/itemsPrices/create/item/newRow.html'),
                    },
                },
            },
            translation: {
                en: require('./translations/en/itemsPrices'),
                ar: require('./translations/ar/itemsPrices'),
            },
        },
        marketingCampaign: {
            views: {
                list: require('./views/marketingCampaign/list/listView'),
                preview: require('./views/marketingCampaign/preView/preView'),
                topBarView: require('./views/marketingCampaign/topBarView'),
            },
            collection: require('./collections/marketingCampaign/collection'),
            model: require('./models/marketingCampaign'),
            translation: {
                en: require('./translations/en/marketingCampaign'),
                ar: require('./translations/ar/marketingCampaign'),
            },
        },
        newProductLaunch: {
            views: {
                list: require('./views/newProductLaunch/list/listView'),
                preview: require('./views/newProductLaunch/preView/preView'),
                topBarView: require('./views/newProductLaunch/topBarView'),
            },
            collection: require('./collections/newProductLaunch/collection'),
            model: require('./models/newProductLaunch'),
            translation: {
                en: require('./translations/en/newProductLaunch'),
                ar: require('./translations/ar/newProductLaunch'),
            },
        },
        notes: {
            views: {
                list: require('./views/notes/list/listView'),
                preview: require('./views/notes/preView/preView'),
                topBarView: require('./views/notes/topBarView'),
            },
            collection: require('./collections/notes/collection'),
            model: require('./models/notes'),
            translation: {
                en: require('./translations/en/notes'),
                ar: require('./translations/en/notes'),
            },
        },
        notifications: {
            views: {
                list: require('./views/notifications/list/listView'),
                preview: require('./views/notifications/preView/preView'),
                topBarView: require('./views/notifications/topBarView'),
            },
            collection: require('./collections/notifications/collection'),
            model: require('./models/notifications'),
            translation: {
                en: require('./translations/en/notifications'),
                ar: require('./translations/ar/notifications'),
            },
        },
        objectives: {
            views: {
                list: require('./views/objectives/list/listView'),
                preview: require('./views/objectives/preView/preView'),
                topBarView: require('./views/objectives/topBarView'),
            },
            collection: require('./collections/objectives/collection'),
            model: require('./models/objectives'),
            translation: {
                en: require('./translations/en/objectives'),
                ar: require('./translations/ar/objectives'),
            },
        },
        personnel: {
            views: {
                list: require('./views/personnel/list/listView'),
                thumbnails: require('./views/personnel/thumbnails/thumbnailsView'),
                preview: require('./views/personnel/preView/preView'),
                topBarView: require('./views/personnel/topBarView'),
            },
            collection: require('./collections/personnel/collection'),
            model: require('./models/personnel'),
            translation: {
                en: require('./translations/en/personnel'),
                ar: require('./translations/ar/personnel'),
            },
        },
        planogram: {
            views: {
                list: require('./views/planogram/thumbnails/thumbnailsView'),
                preview: require('./views/planogram/preView/preView'),
                topBarView: require('./views/planogram/topBarView'),
            },
            collection: require('./collections/planogram/collection'),
            model: require('./models/planogram'),
            translation: {
                en: require('./translations/en/planogram'),
                ar: require('./translations/ar/planogram'),
            },
        },
        priceSurvey: {
            views: {
                list: require('./views/priceSurvey/list/listView'),
                topBarView: require('./views/priceSurvey/topBarView'),
            },
            collection: require('./collections/priceSurvey/collection'),
            model: require('./models/priceSurvey'),
            translation: {
                en: require('./translations/en/priceSurvey'),
                ar: require('./translations/ar/priceSurvey'),
            },
        },
        promotions: {
            views: {
                list: require('./views/promotions/list/listView'),
                preview: require('./views/promotions/preView/preView'),
                topBarView: require('./views/promotions/topBarView'),
            },
            collection: require('./collections/promotions/collection'),
            model: require('./models/promotions'),
            translation: {
                en: require('./translations/en/promotions'),
                ar: require('./translations/ar/promotions'),
            },
        },
        questionnary: {
            views: {
                list: require('./views/questionnary/list/listView'),
                preview: require('./views/questionnary/preView/preView'),
                topBarView: require('./views/questionnary/topBarView'),
            },
            collection: require('./collections/questionnary/collection'),
            model: require('./models/questionnary'),
            translation: {
                en: require('./translations/en/questionnary'),
                ar: require('./translations/ar/questionnary'),
            },
        },
        shelfShares: {
            views: {
                list: require('./views/shelfShares/list/listView'),
                topBarView: require('./views/shelfShares/topBarView'),
            },
            collection: require('./collections/shelfShares/collection'),
            model: require('./models/shelfShares'),
            translation: {
                en: require('./translations/en/shelfShares'),
                ar: require('./translations/ar/shelfShares'),
            },
        },
        domain: {
            views: {
                list: require('./views/domain/list'),
                thumbnails: require('./views/domain/thumbnails'),
                topBarView: require('./views/domain/topBarView'),
            },
        },
        country: {
            views: {
                list: require('./views/country/list/listView'),
                thumbnails: require('./views/country/thumbnails/thumbnailsView'),
                topBarView: require('./views/country/topBarView'),
            },
            collection: require('./collections/country/collection'),
            model: require('./models/country'),
            translation: {
                en: require('./translations/en/country'),
                ar: require('./translations/ar/country'),
            },
        },
        region: {
            views: {
                list: require('./views/region/list/listView'),
                thumbnails: require('./views/region/thumbnails/thumbnailsView'),
                topBarView: require('./views/region/topBarView'),
            },
            collection: require('./collections/region/collection'),
            model: require('./models/region'),
            translation: {
                en: require('./translations/en/region'),
                ar: require('./translations/ar/region'),
            },
        },
        subRegion: {
            views: {
                list: require('./views/subRegion/list/listView'),
                thumbnails: require('./views/subRegion/thumbnails/thumbnailsView'),
                topBarView: require('./views/subRegion/topBarView'),
            },
            collection: require('./collections/subRegion/collection'),
            model: require('./models/subRegion'),
            translation: {
                en: require('./translations/en/subRegion'),
                ar: require('./translations/ar/subRegion'),
            },
        },
        branch: {
            views: {
                list: require('./views/branch/list/listView'),
                thumbnails: require('./views/branch/thumbnails/thumbnailsView'),
                topBarView: require('./views/branch/topBarView'),
            },
            collection: require('./collections/branch/collection'),
            model: require('./models/branch'),
            translation: {
                en: require('./translations/en/branch'),
                ar: require('./translations/ar/branch'),
            },
        },
        outlet: {
            views: {
                list: require('./views/outlet/list/listView'),
                thumbnails: require('./views/outlet/thumbnails/thumbnailsView'),
                topBarView: require('./views/outlet/topBarView'),
            },
            collection: require('./collections/outlet/collection'),
            model: require('./models/outlet'),
            translation: {
                en: require('./translations/en/outlet'),
                ar: require('./translations/ar/outlet'),
            },
        },
        retailSegment: {
            views: {
                list: require('./views/retailSegment/list/listView'),
                thumbnails: require('./views/retailSegment/thumbnails/thumbnailsView'),
                topBarView: require('./views/retailSegment/topBarView'),
            },
            collection: require('./collections/retailSegment/collection'),
            model: require('./models/retailSegment'),
            translation: {
                en: require('./translations/en/retailSegment'),
                ar: require('./translations/ar/retailSegment'),
            },
        },
        category: {
            collection: require('./collections/category/collection'),
        },
        variant: {
            collection: require('./collections/variant/collection'),
        },
        item: {
            collection: require('./collections/item/collection'),
        },
        previewButtons: {
            duplicate: require('../templates/objectives/preview/duplicateButton.html'),
            edit: require('../templates/objectives/preview/editButton.html'),
            viewSubObjective: require('../templates/objectives/preview/viewSubObjectives.html'),
            subObjective: require('../templates/objectives/preview/subObjective.html'),
            assign: require('../templates/objectives/preview/assignBtn.html'),
            goTo: require('../templates/objectives/preview/goToBtn.html'),
            table: require('../templates/objectives/preview/tableBtn.html'),
            delete: require('../templates/objectives/preview/deleteButton.html'),
        }
    };
};
