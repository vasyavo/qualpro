const ActivityLog = require('./../push-notifications/activityLog');
const UtilsPrototype = require('./UtilsPrototype');

const STATUS_DRAFT_REPORT = 'draft';
const STATUS_ACTIVE_REPORT = 'active';

class ReportUtils extends UtilsPrototype {

    constructor(props) {
        super(props);

        this.reportType = props.reportType;
    }

    isPublished() {
        const {
            previousState,
            nextState,
        } = this;

        return previousState.status === STATUS_DRAFT_REPORT &&
            nextState.status === STATUS_ACTIVE_REPORT;
    }

    publish() {
        const {
            state,
            nextState,
            reportType,
        } = this;
        const {
            actionOriginator,
            accessRoleLevel,
        } = state;

        const eventPayload = {
            actionOriginator,
            accessRoleLevel,
            body: nextState,
        };

        if (this.isPublished()) {
            ActivityLog.emit(`reporting:${reportType}:published`, eventPayload);
        } else {
            ActivityLog.emit(`reporting:${reportType}:updated`, eventPayload);
        }
    }

}

module.exports = ReportUtils;
