const mongoose = require('mongoose');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../../helpers/access')();
const PromotionModel = require('./../../../../../types/promotion/model');
const ACL_MODULES = require('./../../../../../constants/aclModulesNames');
const CONTENT_TYPES = require('./../../../../../public/js/constants/contentType');
const sanitizeHtml = require('../../../utils/sanitizeHtml');
const filtersWithoutLocation = require('./filtersWithoutLocation');
const filtersLocation = require('./filtersLocation');

const ajv = new Ajv();
const ObjectId = mongoose.Types.ObjectId;

module.exports = (req, res, next) => {
    const timeFilterSchema = {
        type: 'object',
        properties: {
            timeFrames: {
                type: 'array',
                items: {
                    from: {
                        type: 'string',
                    },
                    to: {
                        type: 'string',
                    },
                    required: ['from', 'to'],
                },
            },
        },
    };

    const queryRun = (personnel, callback) => {
        const query = req.query;
        const queryFilter = query.filter || {};
        const timeFilter = query.timeFilter;
        const filters = [
            CONTENT_TYPES.COUNTRY, CONTENT_TYPES.REGION, CONTENT_TYPES.SUBREGION,
            CONTENT_TYPES.RETAILSEGMENT, CONTENT_TYPES.BRANCH,
            CONTENT_TYPES.CATEGORY, 'displayType',
            'status', 'publisher', CONTENT_TYPES.POSITION, CONTENT_TYPES.PERSONNEL,
        ];

        if (timeFilter) {
            const timeFilterValidate = ajv.compile(timeFilterSchema);
            const timeFilterValid = timeFilterValidate({ timeFrames: timeFilter });

            if (!timeFilterValid) {
                const err = new Error(timeFilterValidate.errors[0].message);

                err.status = 400;

                return next(err);
            }
        }

        filters.forEach((filterName) => {
            if (queryFilter[filterName] && queryFilter[filterName][0] && filterName !== 'status') {
                queryFilter[filterName] = queryFilter[filterName].map((item) => {
                    return ObjectId(item);
                });
            }
        });

        const pipeline = [];

        pipeline.push({
            $facet: {
                locationsFilter: filtersLocation(queryFilter, personnel),
                otherFilters: filtersWithoutLocation(queryFilter, timeFilter, personnel),
            },
        });

        PromotionModel.aggregate(pipeline)
            .allowDiskUse(true)
            .exec(callback);
    };

    async.waterfall([
        (cb) => {
            AccessManager.getReadAccess(req, ACL_MODULES.AL_ALALI_PROMO_EVALUATION, cb);
        },
        (allowed, personnel, cb) => {
            queryRun(personnel, cb);
        },
    ], (err, result) => {
        if (err) {
            return next(err);
        }

        let response = result[0];

        if (response && response.locationsFilter && response.locationsFilter.length && response.otherFilters && response.otherFilters.length) {
            response = {
                countries: response.locationsFilter[0].countries,
                regions: response.locationsFilter[0].regions,
                subRegions: response.locationsFilter[0].subRegions,
                retailSegments: response.locationsFilter[0].retailSegments,
                branches: response.locationsFilter[0].branches,
                displayTypes: response.otherFilters[0].displayTypes,
                categories: response.otherFilters[0].categories,
                statuses: response.otherFilters[0].statuses,
                publishers: response.otherFilters[0].publishers,
                positions: response.otherFilters[0].positions,
                personnels: response.otherFilters[0].personnels,
                promotionTypes: response.otherFilters[0].promotionTypes,
            };
        } else {
            response = {
                countries: [],
                regions: [],
                subRegions: [],
                retailSegments: [],
                branches: [],
                displayTypes: [],
                categories: [],
                statuses: [],
                publishers: [],
                positions: [],
                personnels: [],
                promotionTypes: [],
            };
        }

        response.promotionTypes = response.promotionTypes.map(item => {
            return {
                _id: item.en, // like ID
                name: {
                    en: sanitizeHtml(item.en),
                    ar: sanitizeHtml(item.ar),
                },
            };
        });

        response.analyzeBy = [
            {
                name: {
                    en: 'Country',
                    ar: '',
                },
                value: 'country',
            },
            {
                name: {
                    en: 'Region',
                    ar: '',
                },
                value: 'region',
            },
            {
                name: {
                    en: 'Sub Region',
                    ar: '',
                },
                value: 'subRegion',
            },
            {
                name: {
                    en: 'Branch',
                    ar: '',
                },
                value: 'branch',
            },
            {
                name: {
                    en: 'Category',
                    ar: '',
                },
                value: 'category',
            },
            {
                name: {
                    en: 'Publisher',
                    ar: '',
                },
                value: 'publisher',
            },
            {
                name: {
                    en: 'Position',
                    ar: '',
                },
                value: 'position',
            },
            {
                name: {
                    en: 'Personnel',
                    ar: '',
                },
                value: 'personnel',
            },
            {
                name: {
                    en: 'Promotion Type',
                    ar: '',
                },
                value: 'promotionType',
            },
        ];

        res.status(200).send(response);
    });
};
