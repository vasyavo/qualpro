const PersonnelModel = require('../types/personnel/model');
const mongoose = require('mongoose');

const ObjectId = mongoose.Types.ObjectId;


module.exports = (req, res, next) => {
    const uid = req.session.uId;

    PersonnelModel.aggregate(
        [
            {
                $match: {
                    _id: ObjectId(uid),
                },
            },

            {
                $lookup: {
                    from: 'personnels',
                    localField: '_id',
                    foreignField: 'vacation.cover',
                    as: 'covers',
                },
            },
            {
                $project: {
                    country: 1,
                    branch: 1,
                    subRegion: 1,
                    region: 1,
                    covers: {
                        $filter: {
                            input: { $ifNull: ['$covers', []] },
                            as: 'item',
                            cond: { $eq: ['$$item.vacation.onLeave', true] },
                        },
                    },
                },
            },
            {
                $project: {
                    result: {
                        $reduce: {
                            input: '$covers',
                            initialValue: { country: '$country', branch: '$branch', subRegion: '$subRegion', region: '$region' },
                            in: {
                                country: { $cond: { if: { $eq: ['$$this.country', []] }, then: [], else: {$setUnion: ['$$value.country', '$$this.country']} } },
                                branch: { $cond: { if: { $eq: ['$$this.branch', []] }, then: [], else: {$setUnion: ['$$value.branch', '$$this.branch']} } },
                                subRegion: { $cond: { if: { $eq: ['$$this.subRegion', []] }, then: [], else: {$setUnion: ['$$value.subRegion', '$$this.subRegion']} } },
                                region: { $cond: { if: { $eq: ['$$this.region', []] }, then: [], else: {$setUnion: ['$$value.region', '$$this.region']} } },
                            },
                        },
                    },
                },
            },

            {
                $project: {
                    country: '$result.country',
                    branch: '$result.branch',
                    subRegion: '$result.subRegion',
                    region: '$result.region',
                },
            },

        ], (err, personnel) => {
        if (err) {
            return next(err);
        }

        if (personnel[0]) {
            req.personnelModel = personnel[0];
        }

        next();
    }
    );
};
