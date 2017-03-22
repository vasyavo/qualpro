const async = require('async');
const extractBody = require('./../../../utils/extractBody');

const ACL_MODULES = require('./../../../constants/aclModulesNames');
const CONTENT_TYPES = require('./../../../public/js/constants/contentType');

const AccessManager = require('./../../../helpers/access')();
const bodyValidator = require('./../../../helpers/bodyValidator');
const createSubObjective = require('./../reusable-components/createSubObjective');

module.exports = (req, res, next) => {
    const session = req.session;
    const userId = session.uId;
    const accessRoleLevel = session.level;

    const queryRun = (body, callback) => {
        const files = req.files;
        const parentId = body.parentId;

        if (!body.assignedTo || !body.assignedTo.length) {
            const error = new Error('Should be at least one assignee.');

            error.status = 400;
            return callback(error);
        }

        if (!parentId) {
            const error = new Error('Parent ID is required.');

            error.status = 400;
            return callback(error);
        }

        const createdBy = {
            user: userId,
            date: new Date(),
        };
        const options = Object.assign({}, {
            parentId,
            assignedTo: body.assignedTo,
            createdBy,
            saveObjective: body.saveObjective,
            companyObjective: body.companyObjective,
            description: body.description,
            title: body.title,
            dateStart: body.dateStart,
            dateEnd: body.dateEnd,
            priority: body.priority,
            attachments: body.attachments,
            files,
            objectiveType: body.objectiveType,
            location: body.location,
            country: body.country,
            region: body.region,
            subRegion: body.subRegion,
            retailSegment: body.retailSegment,
            outlet: body.outlet,
            branch: body.branch,
            level: accessRoleLevel,
            formType: body.formType,
            form: body.form,
            isMobile: req.isMobile,
        });

        createSubObjective(options, callback);
    };

    async.waterfall([

        (cb) => {
            AccessManager.getWriteAccess(req, ACL_MODULES.OBJECTIVE, cb);
        },

        (personnel, allowed, cb) => {
            const body = extractBody(req.body);

            bodyValidator.validateBody(body, accessRoleLevel, CONTENT_TYPES.OBJECTIVES, 'createSubObjective', cb);
        },

        queryRun,

    ], (err, parent) => {
        if (err) {
            return next(err);
        }

        if (!parent) {
            return res.status(200).send();
        }

        res.status(200).send(parent);
    });
};
