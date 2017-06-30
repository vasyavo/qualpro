const conversion = require('./../../../../utils/conversionHtmlToXlsx');
const mongoose = require('mongoose');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const ItemHistoryModel = require('./../../../../types/itemHistory/model');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
const moment = require('moment');
const currency = require('../../utils/currency');

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

    const filterSchema = {
        type: 'object',
        properties: {
            [CONTENT_TYPES.ITEM]: {
                type: 'array',
                items: {
                    type: 'string',
                },
                minItems: 1,
                maxItems: 1,
            },
        },
        required: [
            CONTENT_TYPES.ITEM,
        ],
    };

    const queryRun = (personnel, callback) => {
        const query = req.body;
        const queryFilter = query.filter || {};
        const timeFilter = query.timeFilter;
        const pipeline = [];

        const queryFilterValidate = ajv.compile(filterSchema);
        const queryFilterValid = queryFilterValidate(queryFilter);

        if (!queryFilterValid) {
            const err = new Error(queryFilterValidate.errors[0].message);

            err.status = 400;

            return next(err);
        }

        if (timeFilter) {
            const timeFilterValidate = ajv.compile(timeFilterSchema);
            const timeFilterValid = timeFilterValidate({ timeFrames: timeFilter });

            if (!timeFilterValid) {
                const err = new Error(timeFilterValidate.errors[0].message);

                err.status = 400;

                return next(err);
            }
        }

        queryFilter[CONTENT_TYPES.ITEM] = queryFilter[CONTENT_TYPES.ITEM].map((item) => ObjectId(item));

        const $generalMatch = {
            'headers.itemId': { $in: queryFilter[CONTENT_TYPES.ITEM] },
            'headers.contentType': 'item',
            'headers.actionType': 'itemChanged',
        };

        $generalMatch.$or = [];

        if (timeFilter) {
            timeFilter.map((frame) => {
                $generalMatch.$or.push({
                    $and: [
                        {
                            'headers.date': { $gt: moment(frame.from, 'MM/DD/YYYY')._d },
                        },
                        {
                            'headers.date': { $lt: moment(frame.to, 'MM/DD/YYYY')._d },
                        },
                    ],
                });
                return frame;
            });
        }

        if (!$generalMatch.$or.length) {
            delete $generalMatch.$or;
        }

        pipeline.push({
            $match: $generalMatch,
        });

        pipeline.push({
            $project: {
                payload: 1,
                date: {
                    $dateToString: { format: '%Y-%m-%d', date: '$headers.date' },
                },
            },
        });

        pipeline.push({
            $addFields: {
                'payload.ppt': { $divide: ['$payload.ppt', 1000] },
            },
        });

        pipeline.push({
            $group: {
                _id: '$date',
                country: { $first: '$payload.country' },
                ppt: { $avg: '$payload.ppt' },
            },
        });

        pipeline.push({
            $project: {
                _id: 0,
                date: '$_id',
                country: '$country',
                price: '$ppt',
            },
        });

        ItemHistoryModel.aggregate(pipeline)
            .allowDiskUse(true)
            .exec(callback);
    };

    async.waterfall([
        (cb) => {
            AccessManager.getReadAccess(req, ACL_MODULES.ITEMS_AND_PRICES, cb);
        },
        (allowed, personnel, cb) => {
            queryRun(personnel, cb);
        },
    ], (err, result) => {
        if (err) {
            return next(err);
        }

        /*
         *   result example:
         *        [
         *            {
         *                "date": "2016-11-24",
         *                "price": 323
         *            }
         *        ]
         *
         *    htmlTable example:
         *       <table>
         *           <thead>
         *               <tr>
         *                   <th>Price</th>
         *                   <th>Date</th>
         *               </tr>
         *           </thead>
         *           <tbody>
         *               <tr>
         *                   <td>323</td>
         *                   <td>November, 2016</td>
         *               </tr>
         *           </tbody>
         *       </table>
         */

        /* eslint-disable */
        const verstka = `
            <table>
                <thead>
                    <tr>
                        <th>Price</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${result.map(item => {
                        const itemDate = moment(item.date).format('MMMM, YYYY');
                        const currentCountry = currency.defaultData.find((country) => {
                            return country._id.toString() === item.country.toString();
                        });
                        const itemPrice = parseFloat(item.price * currentCountry.currencyInUsd).toFixed(2);

                        return `
                            <tr>
                                <td>${itemPrice}</td>
                                <td>${itemDate}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
        /* eslint-enable */

        conversion(verstka, (err, stream) => {
            if (err) {
                return next(err);
            }

            const bufs = [];

            stream.on('data', (data) => {
                bufs.push(data);
            });

            stream.on('end', () => {
                const buf = Buffer.concat(bufs);

                res.set({
                    'Content-Type': 'application/vnd.ms-excel',
                    'Content-Disposition': `attachment; filename="priceReportExport_${new Date()}.xls"`,
                    'Content-Length': buf.length,
                }).status(200).send(buf);
            });
        });
    });
};
