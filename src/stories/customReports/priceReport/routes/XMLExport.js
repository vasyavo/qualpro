const conversion = require('html-to-xlsx')();
const mongoose = require('mongoose');
const async = require('async');
const Ajv = require('ajv');
const AccessManager = require('./../../../../helpers/access')();
const ItemHistoryModel = require('./../../../../types/itemHistory/model');
const CONTENT_TYPES = require('./../../../../public/js/constants/contentType');
const ACL_MODULES = require('./../../../../constants/aclModulesNames');
const moment = require('moment');

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
        const query = req.query;
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
            $group: {
                _id: '$date',
                ppt: { $avg: '$payload.ppt' },
            },
        });

        pipeline.push({
            $project: {
                _id: 0,
                date: '$_id',
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

        let htmlTable = '<table>';

        let thead = '<thead>';
        let tbody = '<tbody>';

        let headTr = '<tr>';

        headTr += '<th>Price</th>';
        headTr += '<th>Date</th>';

        headTr += '</tr>';

        result.forEach((item) => {
            let bodyTr = '<tr>';

            item.date = moment(item.date).format('MMMM, YYYY');

            bodyTr += `<td>${item.price}</td>`;
            bodyTr += `<td>${item.date}</td>`;

            bodyTr += '</tr>';

            tbody += bodyTr;
        });

        tbody += '</tbody>';

        thead += headTr;
        thead += '</thead>';

        htmlTable += thead + tbody;
        htmlTable += '</table>';

        conversion(htmlTable, (err, stream) => {
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
