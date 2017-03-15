const {
    dispatch,
} = require('../../../stories/badges/store');

const cleanupBadges = require('../../../stories/badges/actions').cleanup;
const PubNubClient = require('../../../stories/push-notifications/utils/pubnub');
const ACL_MODULES = require('../../../constants/aclModulesNames');
const access = require('../../../helpers/access')();
const async = require('async');

module.exports = (req, res, next) => {
    const userId = req.session.uId;
    const moduleId = req.body.moduleId;

    async.waterfall([

        (cb) => {
            access.getReadAccess(req, ACL_MODULES.ACTIVITY_LIST, cb);
        },

        (allowed, personnel, cb) => {
            dispatch(cleanupBadges({
                userId,
                moduleId,
            }), cb);
        },

        (state, cb) => {
            PubNubClient.publish({
                channel: userId,
                message: {
                    badgesState: state,
                },
            }, cb);
        },

    ], (err) => {
        if (err) {
            return next(err);
        }

        res.status(200).send({
            message: 'OK Delete',
        });
    });
};
