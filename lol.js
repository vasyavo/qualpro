db.personnels.aggregate([{ "$match": {} }, {
    "$lookup": {
        "from": "accessRoles",
        "localField": "accessRole",
        "foreignField": "_id",
        "as": "accessRole"
    }
}, {
    "$project": {
        "accessRole": {
            "$cond": {
                "if": { "$eq": ["$accessRole", []] },
                "then": null,
                "else": { "$arrayElemAt": ["$accessRole", 0] }
            }
        },
        "_id": 1,
        "position": 1,
        "avgRating": 1,
        "manager": 1,
        "lastAccess": 1,
        "firstName": 1,
        "lastName": 1,
        "email": 1,
        "phoneNumber": 1,
        "createdBy": 1,
        "editedBy": 1,
        "vacation": 1,
        "status": 1,
        "region": 1,
        "subRegion": 1,
        "retailSegment": 1,
        "outlet": 1,
        "branch": 1,
        "country": 1,
        "currentLanguage": 1,
        "super": 1,
        "archived": 1,
        "temp": 1,
        "confirmed": 1,
        "translated": 1,
        "dateJoined": 1,
        "beforeAccess": 1,
        "lasMonthEvaluate": 1,
        "covered": 1,
        "token": 1
    }
}, {
    "$project": {
        "accessRole": {
            "$cond": {
                "if": { "$eq": ["$accessRole", null] },
                "then": null,
                "else": { "_id": "$accessRole._id", "name": "$accessRole.name", "level": "$accessRole.level" }
            }
        },
        "_id": 1,
        "position": 1,
        "avgRating": 1,
        "manager": 1,
        "lastAccess": 1,
        "firstName": 1,
        "lastName": 1,
        "email": 1,
        "phoneNumber": 1,
        "createdBy": 1,
        "editedBy": 1,
        "vacation": 1,
        "status": 1,
        "region": 1,
        "subRegion": 1,
        "retailSegment": 1,
        "outlet": 1,
        "branch": 1,
        "country": 1,
        "currentLanguage": 1,
        "super": 1,
        "archived": 1,
        "temp": 1,
        "confirmed": 1,
        "translated": 1,
        "dateJoined": 1,
        "beforeAccess": 1,
        "lasMonthEvaluate": 1,
        "covered": 1,
        "token": 1
    }
}, { "$match": {} }, {
    "$match": {
        "$or": [{
            "archived": { "$in": [false] },
            "super": { "$ne": true }
        }, { "temp": true }]
    }
}, { "$match": {} }, {
    "$lookup": {
        "from": "positions",
        "localField": "position",
        "foreignField": "_id",
        "as": "position"
    }
}, {
    "$project": {
        "position": {
            "$cond": {
                "if": { "$eq": ["$position", []] },
                "then": null,
                "else": { "$arrayElemAt": ["$position", 0] }
            }
        },
        "_id": 1,
        "avgRating": 1,
        "manager": 1,
        "lastAccess": 1,
        "firstName": 1,
        "lastName": 1,
        "email": 1,
        "phoneNumber": 1,
        "accessRole": 1,
        "createdBy": 1,
        "editedBy": 1,
        "vacation": 1,
        "status": 1,
        "region": 1,
        "subRegion": 1,
        "retailSegment": 1,
        "outlet": 1,
        "branch": 1,
        "country": 1,
        "currentLanguage": 1,
        "super": 1,
        "archived": 1,
        "temp": 1,
        "confirmed": 1,
        "translated": 1,
        "dateJoined": 1,
        "beforeAccess": 1,
        "lasMonthEvaluate": 1,
        "covered": 1,
        "token": 1
    }
}, {
    "$project": {
        "position": {
            "$cond": {
                "if": { "$eq": ["$position", null] },
                "then": null,
                "else": { "_id": "$position._id", "name": "$position.name" }
            }
        },
        "_id": 1,
        "avgRating": 1,
        "manager": 1,
        "lastAccess": 1,
        "firstName": 1,
        "lastName": 1,
        "email": 1,
        "phoneNumber": 1,
        "accessRole": 1,
        "createdBy": 1,
        "editedBy": 1,
        "vacation": 1,
        "status": 1,
        "region": 1,
        "subRegion": 1,
        "retailSegment": 1,
        "outlet": 1,
        "branch": 1,
        "country": 1,
        "currentLanguage": 1,
        "super": 1,
        "archived": 1,
        "temp": 1,
        "confirmed": 1,
        "translated": 1,
        "dateJoined": 1,
        "beforeAccess": 1,
        "lasMonthEvaluate": 1,
        "covered": 1,
        "token": 1
    }
}, { "$match": {} }, {
    "$unwind": {
        "path": "$country",
        "preserveNullAndEmptyArrays": true
    }
}, { "$match": {} }, {
    "$lookup": {
        "from": "domains",
        "localField": "country",
        "foreignField": "_id",
        "as": "country"
    }
}, {
    "$project": {
        "country": {
            "$cond": {
                "if": { "$eq": ["$country", []] },
                "then": null,
                "else": { "$arrayElemAt": ["$country", 0] }
            }
        },
        "_id": 1,
        "position": 1,
        "avgRating": 1,
        "manager": 1,
        "lastAccess": 1,
        "firstName": 1,
        "lastName": 1,
        "email": 1,
        "phoneNumber": 1,
        "accessRole": 1,
        "createdBy": 1,
        "editedBy": 1,
        "vacation": 1,
        "status": 1,
        "region": 1,
        "subRegion": 1,
        "retailSegment": 1,
        "outlet": 1,
        "branch": 1,
        "currentLanguage": 1,
        "super": 1,
        "archived": 1,
        "temp": 1,
        "confirmed": 1,
        "translated": 1,
        "dateJoined": 1,
        "beforeAccess": 1,
        "lasMonthEvaluate": 1,
        "covered": 1,
        "token": 1
    }
}, {
    "$project": {
        "country": {
            "$cond": {
                "if": { "$eq": ["$country", null] },
                "then": null,
                "else": { "_id": "$country._id", "name": "$country.name" }
            }
        },
        "_id": 1,
        "position": 1,
        "avgRating": 1,
        "manager": 1,
        "lastAccess": 1,
        "firstName": 1,
        "lastName": 1,
        "email": 1,
        "phoneNumber": 1,
        "accessRole": 1,
        "createdBy": 1,
        "editedBy": 1,
        "vacation": 1,
        "status": 1,
        "region": 1,
        "subRegion": 1,
        "retailSegment": 1,
        "outlet": 1,
        "branch": 1,
        "currentLanguage": 1,
        "super": 1,
        "archived": 1,
        "temp": 1,
        "confirmed": 1,
        "translated": 1,
        "dateJoined": 1,
        "beforeAccess": 1,
        "lasMonthEvaluate": 1,
        "covered": 1,
        "token": 1
    }
}, { "$match": {} }, {
    "$group": {
        "_id": "$_id",
        "position": { "$first": "$position" },
        "avgRating": { "$first": "$avgRating" },
        "manager": { "$first": "$manager" },
        "lastAccess": { "$first": "$lastAccess" },
        "firstName": { "$first": "$firstName" },
        "lastName": { "$first": "$lastName" },
        "email": { "$first": "$email" },
        "phoneNumber": { "$first": "$phoneNumber" },
        "accessRole": { "$first": "$accessRole" },
        "createdBy": { "$first": "$createdBy" },
        "editedBy": { "$first": "$editedBy" },
        "vacation": { "$first": "$vacation" },
        "status": { "$first": "$status" },
        "region": { "$first": "$region" },
        "subRegion": { "$first": "$subRegion" },
        "retailSegment": { "$first": "$retailSegment" },
        "outlet": { "$first": "$outlet" },
        "branch": { "$first": "$branch" },
        "country": { "$addToSet": "$country" },
        "currentLanguage": { "$first": "$currentLanguage" },
        "super": { "$first": "$super" },
        "archived": { "$first": "$archived" },
        "temp": { "$first": "$temp" },
        "confirmed": { "$first": "$confirmed" },
        "translated": { "$first": "$translated" },
        "dateJoined": { "$first": "$dateJoined" },
        "beforeAccess": { "$first": "$beforeAccess" },
        "lasMonthEvaluate": { "$first": "$lasMonthEvaluate" },
        "covered": { "$first": "$covered" },
        "token": { "$first": "$token" }
    }
}, {
    "$project": {
        "country": {
            "$filter": {
                "input": "$country",
                "as": "oneItem",
                "cond": { "$ne": ["$$oneItem", null] }
            }
        },
        "_id": 1,
        "position": 1,
        "avgRating": 1,
        "manager": 1,
        "lastAccess": 1,
        "firstName": 1,
        "lastName": 1,
        "email": 1,
        "phoneNumber": 1,
        "accessRole": 1,
        "createdBy": 1,
        "editedBy": 1,
        "vacation": 1,
        "status": 1,
        "region": 1,
        "subRegion": 1,
        "retailSegment": 1,
        "outlet": 1,
        "branch": 1,
        "currentLanguage": 1,
        "super": 1,
        "archived": 1,
        "temp": 1,
        "confirmed": 1,
        "translated": 1,
        "dateJoined": 1,
        "beforeAccess": 1,
        "lasMonthEvaluate": 1,
        "covered": 1,
        "token": 1
    }
}, {
    "$unwind": {
        "path": "$region",
        "preserveNullAndEmptyArrays": true
    }
}, { "$match": {} }, {
    "$lookup": {
        "from": "domains",
        "localField": "region",
        "foreignField": "_id",
        "as": "region"
    }
}, {
    "$project": {
        "region": {
            "$cond": {
                "if": { "$eq": ["$region", []] },
                "then": null,
                "else": { "$arrayElemAt": ["$region", 0] }
            }
        },
        "_id": 1,
        "position": 1,
        "avgRating": 1,
        "manager": 1,
        "lastAccess": 1,
        "firstName": 1,
        "lastName": 1,
        "email": 1,
        "phoneNumber": 1,
        "accessRole": 1,
        "createdBy": 1,
        "editedBy": 1,
        "vacation": 1,
        "status": 1,
        "subRegion": 1,
        "retailSegment": 1,
        "outlet": 1,
        "branch": 1,
        "country": 1,
        "currentLanguage": 1,
        "super": 1,
        "archived": 1,
        "temp": 1,
        "confirmed": 1,
        "translated": 1,
        "dateJoined": 1,
        "beforeAccess": 1,
        "lasMonthEvaluate": 1,
        "covered": 1,
        "token": 1
    }
}, {
    "$project": {
        "region": {
            "$cond": {
                "if": { "$eq": ["$region", null] },
                "then": null,
                "else": { "_id": "$region._id", "name": "$region.name" }
            }
        },
        "_id": 1,
        "position": 1,
        "avgRating": 1,
        "manager": 1,
        "lastAccess": 1,
        "firstName": 1,
        "lastName": 1,
        "email": 1,
        "phoneNumber": 1,
        "accessRole": 1,
        "createdBy": 1,
        "editedBy": 1,
        "vacation": 1,
        "status": 1,
        "subRegion": 1,
        "retailSegment": 1,
        "outlet": 1,
        "branch": 1,
        "country": 1,
        "currentLanguage": 1,
        "super": 1,
        "archived": 1,
        "temp": 1,
        "confirmed": 1,
        "translated": 1,
        "dateJoined": 1,
        "beforeAccess": 1,
        "lasMonthEvaluate": 1,
        "covered": 1,
        "token": 1
    }
}, { "$match": {} }, {
    "$group": {
        "_id": "$_id",
        "position": { "$first": "$position" },
        "avgRating": { "$first": "$avgRating" },
        "manager": { "$first": "$manager" },
        "lastAccess": { "$first": "$lastAccess" },
        "firstName": { "$first": "$firstName" },
        "lastName": { "$first": "$lastName" },
        "email": { "$first": "$email" },
        "phoneNumber": { "$first": "$phoneNumber" },
        "accessRole": { "$first": "$accessRole" },
        "createdBy": { "$first": "$createdBy" },
        "editedBy": { "$first": "$editedBy" },
        "vacation": { "$first": "$vacation" },
        "status": { "$first": "$status" },
        "region": { "$addToSet": "$region" },
        "subRegion": { "$first": "$subRegion" },
        "retailSegment": { "$first": "$retailSegment" },
        "outlet": { "$first": "$outlet" },
        "branch": { "$first": "$branch" },
        "country": { "$first": "$country" },
        "currentLanguage": { "$first": "$currentLanguage" },
        "super": { "$first": "$super" },
        "archived": { "$first": "$archived" },
        "temp": { "$first": "$temp" },
        "confirmed": { "$first": "$confirmed" },
        "translated": { "$first": "$translated" },
        "dateJoined": { "$first": "$dateJoined" },
        "beforeAccess": { "$first": "$beforeAccess" },
        "lasMonthEvaluate": { "$first": "$lasMonthEvaluate" },
        "covered": { "$first": "$covered" },
        "token": { "$first": "$token" }
    }
}, {
    "$project": {
        "region": {
            "$filter": {
                "input": "$region",
                "as": "oneItem",
                "cond": { "$ne": ["$$oneItem", null] }
            }
        },
        "_id": 1,
        "position": 1,
        "avgRating": 1,
        "manager": 1,
        "lastAccess": 1,
        "firstName": 1,
        "lastName": 1,
        "email": 1,
        "phoneNumber": 1,
        "accessRole": 1,
        "createdBy": 1,
        "editedBy": 1,
        "vacation": 1,
        "status": 1,
        "subRegion": 1,
        "retailSegment": 1,
        "outlet": 1,
        "branch": 1,
        "country": 1,
        "currentLanguage": 1,
        "super": 1,
        "archived": 1,
        "temp": 1,
        "confirmed": 1,
        "translated": 1,
        "dateJoined": 1,
        "beforeAccess": 1,
        "lasMonthEvaluate": 1,
        "covered": 1,
        "token": 1
    }
}, {
    "$unwind": {
        "path": "$subRegion",
        "preserveNullAndEmptyArrays": true
    }
}, { "$match": {} }, {
    "$lookup": {
        "from": "domains",
        "localField": "subRegion",
        "foreignField": "_id",
        "as": "subRegion"
    }
}, {
    "$project": {
        "subRegion": {
            "$cond": {
                "if": { "$eq": ["$subRegion", []] },
                "then": null,
                "else": { "$arrayElemAt": ["$subRegion", 0] }
            }
        },
        "_id": 1,
        "position": 1,
        "avgRating": 1,
        "manager": 1,
        "lastAccess": 1,
        "firstName": 1,
        "lastName": 1,
        "email": 1,
        "phoneNumber": 1,
        "accessRole": 1,
        "createdBy": 1,
        "editedBy": 1,
        "vacation": 1,
        "status": 1,
        "region": 1,
        "retailSegment": 1,
        "outlet": 1,
        "branch": 1,
        "country": 1,
        "currentLanguage": 1,
        "super": 1,
        "archived": 1,
        "temp": 1,
        "confirmed": 1,
        "translated": 1,
        "dateJoined": 1,
        "beforeAccess": 1,
        "lasMonthEvaluate": 1,
        "covered": 1,
        "token": 1
    }
}, {
    "$project": {
        "subRegion": {
            "$cond": {
                "if": { "$eq": ["$subRegion", null] },
                "then": null,
                "else": { "_id": "$subRegion._id", "name": "$subRegion.name" }
            }
        },
        "_id": 1,
        "position": 1,
        "avgRating": 1,
        "manager": 1,
        "lastAccess": 1,
        "firstName": 1,
        "lastName": 1,
        "email": 1,
        "phoneNumber": 1,
        "accessRole": 1,
        "createdBy": 1,
        "editedBy": 1,
        "vacation": 1,
        "status": 1,
        "region": 1,
        "retailSegment": 1,
        "outlet": 1,
        "branch": 1,
        "country": 1,
        "currentLanguage": 1,
        "super": 1,
        "archived": 1,
        "temp": 1,
        "confirmed": 1,
        "translated": 1,
        "dateJoined": 1,
        "beforeAccess": 1,
        "lasMonthEvaluate": 1,
        "covered": 1,
        "token": 1
    }
}, { "$match": {} }, {
    "$group": {
        "_id": "$_id",
        "position": { "$first": "$position" },
        "avgRating": { "$first": "$avgRating" },
        "manager": { "$first": "$manager" },
        "lastAccess": { "$first": "$lastAccess" },
        "firstName": { "$first": "$firstName" },
        "lastName": { "$first": "$lastName" },
        "email": { "$first": "$email" },
        "phoneNumber": { "$first": "$phoneNumber" },
        "accessRole": { "$first": "$accessRole" },
        "createdBy": { "$first": "$createdBy" },
        "editedBy": { "$first": "$editedBy" },
        "vacation": { "$first": "$vacation" },
        "status": { "$first": "$status" },
        "region": { "$first": "$region" },
        "subRegion": { "$addToSet": "$subRegion" },
        "retailSegment": { "$first": "$retailSegment" },
        "outlet": { "$first": "$outlet" },
        "branch": { "$first": "$branch" },
        "country": { "$first": "$country" },
        "currentLanguage": { "$first": "$currentLanguage" },
        "super": { "$first": "$super" },
        "archived": { "$first": "$archived" },
        "temp": { "$first": "$temp" },
        "confirmed": { "$first": "$confirmed" },
        "translated": { "$first": "$translated" },
        "dateJoined": { "$first": "$dateJoined" },
        "beforeAccess": { "$first": "$beforeAccess" },
        "lasMonthEvaluate": { "$first": "$lasMonthEvaluate" },
        "covered": { "$first": "$covered" },
        "token": { "$first": "$token" }
    }
}, {
    "$project": {
        "subRegion": {
            "$filter": {
                "input": "$subRegion",
                "as": "oneItem",
                "cond": { "$ne": ["$$oneItem", null] }
            }
        },
        "_id": 1,
        "position": 1,
        "avgRating": 1,
        "manager": 1,
        "lastAccess": 1,
        "firstName": 1,
        "lastName": 1,
        "email": 1,
        "phoneNumber": 1,
        "accessRole": 1,
        "createdBy": 1,
        "editedBy": 1,
        "vacation": 1,
        "status": 1,
        "region": 1,
        "retailSegment": 1,
        "outlet": 1,
        "branch": 1,
        "country": 1,
        "currentLanguage": 1,
        "super": 1,
        "archived": 1,
        "temp": 1,
        "confirmed": 1,
        "translated": 1,
        "dateJoined": 1,
        "beforeAccess": 1,
        "lasMonthEvaluate": 1,
        "covered": 1,
        "token": 1
    }
}, {
    "$unwind": {
        "path": "$branch",
        "preserveNullAndEmptyArrays": true
    }
}, { "$match": {} }, {
    "$lookup": {
        "from": "branches",
        "localField": "branch",
        "foreignField": "_id",
        "as": "branch"
    }
}, {
    "$project": {
        "branch": {
            "$cond": {
                "if": { "$eq": ["$branch", []] },
                "then": null,
                "else": { "$arrayElemAt": ["$branch", 0] }
            }
        },
        "_id": 1,
        "position": 1,
        "avgRating": 1,
        "manager": 1,
        "lastAccess": 1,
        "firstName": 1,
        "lastName": 1,
        "email": 1,
        "phoneNumber": 1,
        "accessRole": 1,
        "createdBy": 1,
        "editedBy": 1,
        "vacation": 1,
        "status": 1,
        "region": 1,
        "subRegion": 1,
        "retailSegment": 1,
        "outlet": 1,
        "country": 1,
        "currentLanguage": 1,
        "super": 1,
        "archived": 1,
        "temp": 1,
        "confirmed": 1,
        "translated": 1,
        "dateJoined": 1,
        "beforeAccess": 1,
        "lasMonthEvaluate": 1,
        "covered": 1,
        "token": 1
    }
}, {
    "$project": {
        "branch": {
            "$cond": {
                "if": { "$eq": ["$branch", null] },
                "then": null,
                "else": { "_id": "$branch._id", "name": "$branch.name" }
            }
        },
        "retailSegment": "$branch.retailSegment",
        "outlet": "$branch.outlet",
        "_id": 1,
        "position": 1,
        "avgRating": 1,
        "manager": 1,
        "lastAccess": 1,
        "firstName": 1,
        "lastName": 1,
        "email": 1,
        "phoneNumber": 1,
        "accessRole": 1,
        "createdBy": 1,
        "editedBy": 1,
        "vacation": 1,
        "status": 1,
        "region": 1,
        "subRegion": 1,
        "country": 1,
        "currentLanguage": 1,
        "super": 1,
        "archived": 1,
        "temp": 1,
        "confirmed": 1,
        "translated": 1,
        "dateJoined": 1,
        "beforeAccess": 1,
        "lasMonthEvaluate": 1,
        "covered": 1,
        "token": 1
    }
}, { "$match": {} }, {
    "$group": {
        "_id": "$_id",
        "position": { "$first": "$position" },
        "avgRating": { "$first": "$avgRating" },
        "manager": { "$first": "$manager" },
        "lastAccess": { "$first": "$lastAccess" },
        "firstName": { "$first": "$firstName" },
        "lastName": { "$first": "$lastName" },
        "email": { "$first": "$email" },
        "phoneNumber": { "$first": "$phoneNumber" },
        "accessRole": { "$first": "$accessRole" },
        "createdBy": { "$first": "$createdBy" },
        "editedBy": { "$first": "$editedBy" },
        "vacation": { "$first": "$vacation" },
        "status": { "$first": "$status" },
        "region": { "$first": "$region" },
        "subRegion": { "$first": "$subRegion" },
        "retailSegment": { "$addToSet": "$retailSegment" },
        "outlet": { "$addToSet": "$outlet" },
        "branch": { "$addToSet": "$branch" },
        "country": { "$first": "$country" },
        "currentLanguage": { "$first": "$currentLanguage" },
        "super": { "$first": "$super" },
        "archived": { "$first": "$archived" },
        "temp": { "$first": "$temp" },
        "confirmed": { "$first": "$confirmed" },
        "translated": { "$first": "$translated" },
        "dateJoined": { "$first": "$dateJoined" },
        "beforeAccess": { "$first": "$beforeAccess" },
        "lasMonthEvaluate": { "$first": "$lasMonthEvaluate" },
        "covered": { "$first": "$covered" },
        "token": { "$first": "$token" }
    }
}, {
    "$project": {
        "branch": {
            "$filter": {
                "input": "$branch",
                "as": "oneItem",
                "cond": { "$ne": ["$$oneItem", null] }
            }
        },
        "_id": 1,
        "position": 1,
        "avgRating": 1,
        "manager": 1,
        "lastAccess": 1,
        "firstName": 1,
        "lastName": 1,
        "email": 1,
        "phoneNumber": 1,
        "accessRole": 1,
        "createdBy": 1,
        "editedBy": 1,
        "vacation": 1,
        "status": 1,
        "region": 1,
        "subRegion": 1,
        "retailSegment": 1,
        "outlet": 1,
        "country": 1,
        "currentLanguage": 1,
        "super": 1,
        "archived": 1,
        "temp": 1,
        "confirmed": 1,
        "translated": 1,
        "dateJoined": 1,
        "beforeAccess": 1,
        "lasMonthEvaluate": 1,
        "covered": 1,
        "token": 1
    }
}, { "$match": {} }, {
    "$unwind": {
        "path": "$retailSegment",
        "preserveNullAndEmptyArrays": true
    }
}, { "$match": {} }, {
    "$lookup": {
        "from": "retailSegments",
        "localField": "retailSegment",
        "foreignField": "_id",
        "as": "retailSegment"
    }
}, {
    "$project": {
        "retailSegment": {
            "$cond": {
                "if": { "$eq": ["$retailSegment", []] },
                "then": null,
                "else": { "$arrayElemAt": ["$retailSegment", 0] }
            }
        },
        "_id": 1,
        "position": 1,
        "avgRating": 1,
        "manager": 1,
        "lastAccess": 1,
        "firstName": 1,
        "lastName": 1,
        "email": 1,
        "phoneNumber": 1,
        "accessRole": 1,
        "createdBy": 1,
        "editedBy": 1,
        "vacation": 1,
        "status": 1,
        "region": 1,
        "subRegion": 1,
        "outlet": 1,
        "branch": 1,
        "country": 1,
        "currentLanguage": 1,
        "super": 1,
        "archived": 1,
        "temp": 1,
        "confirmed": 1,
        "translated": 1,
        "dateJoined": 1,
        "beforeAccess": 1,
        "lasMonthEvaluate": 1,
        "covered": 1,
        "token": 1
    }
}, {
    "$project": {
        "retailSegment": {
            "$cond": {
                "if": { "$eq": ["$retailSegment", null] },
                "then": null,
                "else": { "_id": "$retailSegment._id", "name": "$retailSegment.name" }
            }
        },
        "_id": 1,
        "position": 1,
        "avgRating": 1,
        "manager": 1,
        "lastAccess": 1,
        "firstName": 1,
        "lastName": 1,
        "email": 1,
        "phoneNumber": 1,
        "accessRole": 1,
        "createdBy": 1,
        "editedBy": 1,
        "vacation": 1,
        "status": 1,
        "region": 1,
        "subRegion": 1,
        "outlet": 1,
        "branch": 1,
        "country": 1,
        "currentLanguage": 1,
        "super": 1,
        "archived": 1,
        "temp": 1,
        "confirmed": 1,
        "translated": 1,
        "dateJoined": 1,
        "beforeAccess": 1,
        "lasMonthEvaluate": 1,
        "covered": 1,
        "token": 1
    }
}, { "$match": {} }, {
    "$group": {
        "_id": "$_id",
        "position": { "$first": "$position" },
        "avgRating": { "$first": "$avgRating" },
        "manager": { "$first": "$manager" },
        "lastAccess": { "$first": "$lastAccess" },
        "firstName": { "$first": "$firstName" },
        "lastName": { "$first": "$lastName" },
        "email": { "$first": "$email" },
        "phoneNumber": { "$first": "$phoneNumber" },
        "accessRole": { "$first": "$accessRole" },
        "createdBy": { "$first": "$createdBy" },
        "editedBy": { "$first": "$editedBy" },
        "vacation": { "$first": "$vacation" },
        "status": { "$first": "$status" },
        "region": { "$first": "$region" },
        "subRegion": { "$first": "$subRegion" },
        "retailSegment": { "$addToSet": "$retailSegment" },
        "outlet": { "$first": "$outlet" },
        "branch": { "$first": "$branch" },
        "country": { "$first": "$country" },
        "currentLanguage": { "$first": "$currentLanguage" },
        "super": { "$first": "$super" },
        "archived": { "$first": "$archived" },
        "temp": { "$first": "$temp" },
        "confirmed": { "$first": "$confirmed" },
        "translated": { "$first": "$translated" },
        "dateJoined": { "$first": "$dateJoined" },
        "beforeAccess": { "$first": "$beforeAccess" },
        "lasMonthEvaluate": { "$first": "$lasMonthEvaluate" },
        "covered": { "$first": "$covered" },
        "token": { "$first": "$token" }
    }
}, {
    "$project": {
        "retailSegment": {
            "$filter": {
                "input": "$retailSegment",
                "as": "oneItem",
                "cond": { "$ne": ["$$oneItem", null] }
            }
        },
        "_id": 1,
        "position": 1,
        "avgRating": 1,
        "manager": 1,
        "lastAccess": 1,
        "firstName": 1,
        "lastName": 1,
        "email": 1,
        "phoneNumber": 1,
        "accessRole": 1,
        "createdBy": 1,
        "editedBy": 1,
        "vacation": 1,
        "status": 1,
        "region": 1,
        "subRegion": 1,
        "outlet": 1,
        "branch": 1,
        "country": 1,
        "currentLanguage": 1,
        "super": 1,
        "archived": 1,
        "temp": 1,
        "confirmed": 1,
        "translated": 1,
        "dateJoined": 1,
        "beforeAccess": 1,
        "lasMonthEvaluate": 1,
        "covered": 1,
        "token": 1
    }
}, {
    "$unwind": {
        "path": "$outlet",
        "preserveNullAndEmptyArrays": true
    }
}, { "$match": {} }, {
    "$lookup": {
        "from": "outlets",
        "localField": "outlet",
        "foreignField": "_id",
        "as": "outlet"
    }
}, {
    "$project": {
        "outlet": {
            "$cond": {
                "if": { "$eq": ["$outlet", []] },
                "then": null,
                "else": { "$arrayElemAt": ["$outlet", 0] }
            }
        },
        "_id": 1,
        "position": 1,
        "avgRating": 1,
        "manager": 1,
        "lastAccess": 1,
        "firstName": 1,
        "lastName": 1,
        "email": 1,
        "phoneNumber": 1,
        "accessRole": 1,
        "createdBy": 1,
        "editedBy": 1,
        "vacation": 1,
        "status": 1,
        "region": 1,
        "subRegion": 1,
        "retailSegment": 1,
        "branch": 1,
        "country": 1,
        "currentLanguage": 1,
        "super": 1,
        "archived": 1,
        "temp": 1,
        "confirmed": 1,
        "translated": 1,
        "dateJoined": 1,
        "beforeAccess": 1,
        "lasMonthEvaluate": 1,
        "covered": 1,
        "token": 1
    }
}, {
    "$project": {
        "outlet": {
            "$cond": {
                "if": { "$eq": ["$outlet", null] },
                "then": null,
                "else": { "_id": "$outlet._id", "name": "$outlet.name" }
            }
        },
        "_id": 1,
        "position": 1,
        "avgRating": 1,
        "manager": 1,
        "lastAccess": 1,
        "firstName": 1,
        "lastName": 1,
        "email": 1,
        "phoneNumber": 1,
        "accessRole": 1,
        "createdBy": 1,
        "editedBy": 1,
        "vacation": 1,
        "status": 1,
        "region": 1,
        "subRegion": 1,
        "retailSegment": 1,
        "branch": 1,
        "country": 1,
        "currentLanguage": 1,
        "super": 1,
        "archived": 1,
        "temp": 1,
        "confirmed": 1,
        "translated": 1,
        "dateJoined": 1,
        "beforeAccess": 1,
        "lasMonthEvaluate": 1,
        "covered": 1,
        "token": 1
    }
}, { "$match": {} }, {
    "$group": {
        "_id": "$_id",
        "position": { "$first": "$position" },
        "avgRating": { "$first": "$avgRating" },
        "manager": { "$first": "$manager" },
        "lastAccess": { "$first": "$lastAccess" },
        "firstName": { "$first": "$firstName" },
        "lastName": { "$first": "$lastName" },
        "email": { "$first": "$email" },
        "phoneNumber": { "$first": "$phoneNumber" },
        "accessRole": { "$first": "$accessRole" },
        "createdBy": { "$first": "$createdBy" },
        "editedBy": { "$first": "$editedBy" },
        "vacation": { "$first": "$vacation" },
        "status": { "$first": "$status" },
        "region": { "$first": "$region" },
        "subRegion": { "$first": "$subRegion" },
        "retailSegment": { "$first": "$retailSegment" },
        "outlet": { "$addToSet": "$outlet" },
        "branch": { "$first": "$branch" },
        "country": { "$first": "$country" },
        "currentLanguage": { "$first": "$currentLanguage" },
        "super": { "$first": "$super" },
        "archived": { "$first": "$archived" },
        "temp": { "$first": "$temp" },
        "confirmed": { "$first": "$confirmed" },
        "translated": { "$first": "$translated" },
        "dateJoined": { "$first": "$dateJoined" },
        "beforeAccess": { "$first": "$beforeAccess" },
        "lasMonthEvaluate": { "$first": "$lasMonthEvaluate" },
        "covered": { "$first": "$covered" },
        "token": { "$first": "$token" }
    }
}, {
    "$project": {
        "outlet": {
            "$filter": {
                "input": "$outlet",
                "as": "oneItem",
                "cond": { "$ne": ["$$oneItem", null] }
            }
        },
        "_id": 1,
        "position": 1,
        "avgRating": 1,
        "manager": 1,
        "lastAccess": 1,
        "firstName": 1,
        "lastName": 1,
        "email": 1,
        "phoneNumber": 1,
        "accessRole": 1,
        "createdBy": 1,
        "editedBy": 1,
        "vacation": 1,
        "status": 1,
        "region": 1,
        "subRegion": 1,
        "retailSegment": 1,
        "branch": 1,
        "country": 1,
        "currentLanguage": 1,
        "super": 1,
        "archived": 1,
        "temp": 1,
        "confirmed": 1,
        "translated": 1,
        "dateJoined": 1,
        "beforeAccess": 1,
        "lasMonthEvaluate": 1,
        "covered": 1,
        "token": 1
    }
}, { "$match": {} }, {
    "$lookup": {
        "from": "personnels",
        "localField": "createdBy.user",
        "foreignField": "_id",
        "as": "createdBy.user"
    }
}, {
    "$project": {
        "createdBy": {
            "user": {
                "$cond": {
                    "if": { "$eq": ["$createdBy.user", []] },
                    "then": null,
                    "else": { "$arrayElemAt": ["$createdBy.user", 0] }
                }
            }, "date": 1
        },
        "_id": 1,
        "position": 1,
        "avgRating": 1,
        "manager": 1,
        "lastAccess": 1,
        "firstName": 1,
        "lastName": 1,
        "email": 1,
        "phoneNumber": 1,
        "accessRole": 1,
        "editedBy": 1,
        "vacation": 1,
        "status": 1,
        "region": 1,
        "subRegion": 1,
        "retailSegment": 1,
        "outlet": 1,
        "branch": 1,
        "country": 1,
        "currentLanguage": 1,
        "super": 1,
        "archived": 1,
        "temp": 1,
        "confirmed": 1,
        "translated": 1,
        "dateJoined": 1,
        "beforeAccess": 1,
        "lasMonthEvaluate": 1,
        "covered": 1,
        "token": 1
    }
}, {
    "$project": {
        "createdBy": {
            "user": {
                "$cond": {
                    "if": { "$eq": ["$createdBy.user", null] },
                    "then": null,
                    "else": {
                        "_id": "$createdBy.user._id",
                        "name": "$createdBy.user.name",
                        "firstName": "$createdBy.user.firstName",
                        "lastName": "$createdBy.user.lastName",
                        "position": "$createdBy.user.position",
                        "accessRole": "$createdBy.user.accessRole"
                    }
                }
            }, "date": 1
        },
        "_id": 1,
        "position": 1,
        "avgRating": 1,
        "manager": 1,
        "lastAccess": 1,
        "firstName": 1,
        "lastName": 1,
        "email": 1,
        "phoneNumber": 1,
        "accessRole": 1,
        "editedBy": 1,
        "vacation": 1,
        "status": 1,
        "region": 1,
        "subRegion": 1,
        "retailSegment": 1,
        "outlet": 1,
        "branch": 1,
        "country": 1,
        "currentLanguage": 1,
        "super": 1,
        "archived": 1,
        "temp": 1,
        "confirmed": 1,
        "translated": 1,
        "dateJoined": 1,
        "beforeAccess": 1,
        "lasMonthEvaluate": 1,
        "covered": 1,
        "token": 1
    }
}, { "$match": {} }, { "$match": {} }, {
    "$lookup": {
        "from": "personnels",
        "localField": "editedBy.user",
        "foreignField": "_id",
        "as": "editedBy.user"
    }
}, {
    "$project": {
        "editedBy": {
            "user": {
                "$cond": {
                    "if": { "$eq": ["$editedBy.user", []] },
                    "then": null,
                    "else": { "$arrayElemAt": ["$editedBy.user", 0] }
                }
            }, "date": 1
        },
        "_id": 1,
        "position": 1,
        "avgRating": 1,
        "manager": 1,
        "lastAccess": 1,
        "firstName": 1,
        "lastName": 1,
        "email": 1,
        "phoneNumber": 1,
        "accessRole": 1,
        "createdBy": 1,
        "vacation": 1,
        "status": 1,
        "region": 1,
        "subRegion": 1,
        "retailSegment": 1,
        "outlet": 1,
        "branch": 1,
        "country": 1,
        "currentLanguage": 1,
        "super": 1,
        "archived": 1,
        "temp": 1,
        "confirmed": 1,
        "translated": 1,
        "dateJoined": 1,
        "beforeAccess": 1,
        "lasMonthEvaluate": 1,
        "covered": 1,
        "token": 1
    }
}, {
    "$project": {
        "editedBy": {
            "user": {
                "$cond": {
                    "if": { "$eq": ["$editedBy.user", null] },
                    "then": null,
                    "else": {
                        "_id": "$editedBy.user._id",
                        "name": "$editedBy.user.name",
                        "firstName": "$editedBy.user.firstName",
                        "lastName": "$editedBy.user.lastName",
                        "position": "$editedBy.user.position",
                        "accessRole": "$editedBy.user.accessRole"
                    }
                }
            }, "date": 1
        },
        "_id": 1,
        "position": 1,
        "avgRating": 1,
        "manager": 1,
        "lastAccess": 1,
        "firstName": 1,
        "lastName": 1,
        "email": 1,
        "phoneNumber": 1,
        "accessRole": 1,
        "createdBy": 1,
        "vacation": 1,
        "status": 1,
        "region": 1,
        "subRegion": 1,
        "retailSegment": 1,
        "outlet": 1,
        "branch": 1,
        "country": 1,
        "currentLanguage": 1,
        "super": 1,
        "archived": 1,
        "temp": 1,
        "confirmed": 1,
        "translated": 1,
        "dateJoined": 1,
        "beforeAccess": 1,
        "lasMonthEvaluate": 1,
        "covered": 1,
        "token": 1
    }
}, { "$match": {} }, { "$match": {} }, {
    "$lookup": {
        "from": "accessRoles",
        "localField": "createdBy.user.accessRole",
        "foreignField": "_id",
        "as": "createdBy.user.accessRole"
    }
}, {
    "$project": {
        "createdBy": {
            "user": {
                "accessRole": {
                    "$cond": {
                        "if": { "$eq": ["$createdBy.user.accessRole", []] },
                        "then": null,
                        "else": { "$arrayElemAt": ["$createdBy.user.accessRole", 0] }
                    }
                }, "_id": 1, "position": 1, "firstName": 1, "lastName": 1
            }, "date": 1
        },
        "_id": 1,
        "position": 1,
        "avgRating": 1,
        "manager": 1,
        "lastAccess": 1,
        "firstName": 1,
        "lastName": 1,
        "email": 1,
        "phoneNumber": 1,
        "accessRole": 1,
        "editedBy": 1,
        "vacation": 1,
        "status": 1,
        "region": 1,
        "subRegion": 1,
        "retailSegment": 1,
        "outlet": 1,
        "branch": 1,
        "country": 1,
        "currentLanguage": 1,
        "super": 1,
        "archived": 1,
        "temp": 1,
        "confirmed": 1,
        "translated": 1,
        "dateJoined": 1,
        "beforeAccess": 1,
        "lasMonthEvaluate": 1,
        "covered": 1,
        "token": 1
    }
}, {
    "$project": {
        "createdBy": {
            "user": {
                "accessRole": {
                    "$cond": {
                        "if": { "$eq": ["$createdBy.user.accessRole", null] },
                        "then": null,
                        "else": {
                            "_id": "$createdBy.user.accessRole._id",
                            "name": "$createdBy.user.accessRole.name",
                            "level": "$createdBy.user.accessRole.level"
                        }
                    }
                }, "_id": 1, "position": 1, "firstName": 1, "lastName": 1
            }, "date": 1
        },
        "_id": 1,
        "position": 1,
        "avgRating": 1,
        "manager": 1,
        "lastAccess": 1,
        "firstName": 1,
        "lastName": 1,
        "email": 1,
        "phoneNumber": 1,
        "accessRole": 1,
        "editedBy": 1,
        "vacation": 1,
        "status": 1,
        "region": 1,
        "subRegion": 1,
        "retailSegment": 1,
        "outlet": 1,
        "branch": 1,
        "country": 1,
        "currentLanguage": 1,
        "super": 1,
        "archived": 1,
        "temp": 1,
        "confirmed": 1,
        "translated": 1,
        "dateJoined": 1,
        "beforeAccess": 1,
        "lasMonthEvaluate": 1,
        "covered": 1,
        "token": 1
    }
}, { "$match": {} }, { "$match": {} }, {
    "$lookup": {
        "from": "positions",
        "localField": "createdBy.user.position",
        "foreignField": "_id",
        "as": "createdBy.user.position"
    }
}, {
    "$project": {
        "createdBy": {
            "user": {
                "position": {
                    "$cond": {
                        "if": { "$eq": ["$createdBy.user.position", []] },
                        "then": null,
                        "else": { "$arrayElemAt": ["$createdBy.user.position", 0] }
                    }
                }, "_id": 1, "accessRole": 1, "firstName": 1, "lastName": 1
            }, "date": 1
        },
        "_id": 1,
        "position": 1,
        "avgRating": 1,
        "manager": 1,
        "lastAccess": 1,
        "firstName": 1,
        "lastName": 1,
        "email": 1,
        "phoneNumber": 1,
        "accessRole": 1,
        "editedBy": 1,
        "vacation": 1,
        "status": 1,
        "region": 1,
        "subRegion": 1,
        "retailSegment": 1,
        "outlet": 1,
        "branch": 1,
        "country": 1,
        "currentLanguage": 1,
        "super": 1,
        "archived": 1,
        "temp": 1,
        "confirmed": 1,
        "translated": 1,
        "dateJoined": 1,
        "beforeAccess": 1,
        "lasMonthEvaluate": 1,
        "covered": 1,
        "token": 1
    }
}, {
    "$project": {
        "createdBy": {
            "user": {
                "position": {
                    "$cond": {
                        "if": { "$eq": ["$createdBy.user.position", null] },
                        "then": null,
                        "else": { "_id": "$createdBy.user.position._id", "name": "$createdBy.user.position.name" }
                    }
                }, "_id": 1, "accessRole": 1, "firstName": 1, "lastName": 1
            }, "date": 1
        },
        "_id": 1,
        "position": 1,
        "avgRating": 1,
        "manager": 1,
        "lastAccess": 1,
        "firstName": 1,
        "lastName": 1,
        "email": 1,
        "phoneNumber": 1,
        "accessRole": 1,
        "editedBy": 1,
        "vacation": 1,
        "status": 1,
        "region": 1,
        "subRegion": 1,
        "retailSegment": 1,
        "outlet": 1,
        "branch": 1,
        "country": 1,
        "currentLanguage": 1,
        "super": 1,
        "archived": 1,
        "temp": 1,
        "confirmed": 1,
        "translated": 1,
        "dateJoined": 1,
        "beforeAccess": 1,
        "lasMonthEvaluate": 1,
        "covered": 1,
        "token": 1
    }
}, { "$match": {} }, { "$match": {} }, {
    "$lookup": {
        "from": "accessRoles",
        "localField": "editedBy.user.accessRole",
        "foreignField": "_id",
        "as": "editedBy.user.accessRole"
    }
}, {
    "$project": {
        "editedBy": {
            "user": {
                "accessRole": {
                    "$cond": {
                        "if": { "$eq": ["$editedBy.user.accessRole", []] },
                        "then": null,
                        "else": { "$arrayElemAt": ["$editedBy.user.accessRole", 0] }
                    }
                }, "_id": 1, "position": 1, "firstName": 1, "lastName": 1
            }, "date": 1
        },
        "_id": 1,
        "position": 1,
        "avgRating": 1,
        "manager": 1,
        "lastAccess": 1,
        "firstName": 1,
        "lastName": 1,
        "email": 1,
        "phoneNumber": 1,
        "accessRole": 1,
        "createdBy": 1,
        "vacation": 1,
        "status": 1,
        "region": 1,
        "subRegion": 1,
        "retailSegment": 1,
        "outlet": 1,
        "branch": 1,
        "country": 1,
        "currentLanguage": 1,
        "super": 1,
        "archived": 1,
        "temp": 1,
        "confirmed": 1,
        "translated": 1,
        "dateJoined": 1,
        "beforeAccess": 1,
        "lasMonthEvaluate": 1,
        "covered": 1,
        "token": 1
    }
}, {
    "$project": {
        "editedBy": {
            "user": {
                "accessRole": {
                    "$cond": {
                        "if": { "$eq": ["$editedBy.user.accessRole", null] },
                        "then": null,
                        "else": {
                            "_id": "$editedBy.user.accessRole._id",
                            "name": "$editedBy.user.accessRole.name",
                            "level": "$editedBy.user.accessRole.level"
                        }
                    }
                }, "_id": 1, "position": 1, "firstName": 1, "lastName": 1
            }, "date": 1
        },
        "_id": 1,
        "position": 1,
        "avgRating": 1,
        "manager": 1,
        "lastAccess": 1,
        "firstName": 1,
        "lastName": 1,
        "email": 1,
        "phoneNumber": 1,
        "accessRole": 1,
        "createdBy": 1,
        "vacation": 1,
        "status": 1,
        "region": 1,
        "subRegion": 1,
        "retailSegment": 1,
        "outlet": 1,
        "branch": 1,
        "country": 1,
        "currentLanguage": 1,
        "super": 1,
        "archived": 1,
        "temp": 1,
        "confirmed": 1,
        "translated": 1,
        "dateJoined": 1,
        "beforeAccess": 1,
        "lasMonthEvaluate": 1,
        "covered": 1,
        "token": 1
    }
}, { "$match": {} }, { "$match": {} }, {
    "$lookup": {
        "from": "positions",
        "localField": "editedBy.user.position",
        "foreignField": "_id",
        "as": "editedBy.user.position"
    }
}, {
    "$project": {
        "editedBy": {
            "user": {
                "position": {
                    "$cond": {
                        "if": { "$eq": ["$editedBy.user.position", []] },
                        "then": null,
                        "else": { "$arrayElemAt": ["$editedBy.user.position", 0] }
                    }
                }, "_id": 1, "accessRole": 1, "firstName": 1, "lastName": 1
            }, "date": 1
        },
        "_id": 1,
        "position": 1,
        "avgRating": 1,
        "manager": 1,
        "lastAccess": 1,
        "firstName": 1,
        "lastName": 1,
        "email": 1,
        "phoneNumber": 1,
        "accessRole": 1,
        "createdBy": 1,
        "vacation": 1,
        "status": 1,
        "region": 1,
        "subRegion": 1,
        "retailSegment": 1,
        "outlet": 1,
        "branch": 1,
        "country": 1,
        "currentLanguage": 1,
        "super": 1,
        "archived": 1,
        "temp": 1,
        "confirmed": 1,
        "translated": 1,
        "dateJoined": 1,
        "beforeAccess": 1,
        "lasMonthEvaluate": 1,
        "covered": 1,
        "token": 1
    }
}, {
    "$project": {
        "editedBy": {
            "user": {
                "position": {
                    "$cond": {
                        "if": { "$eq": ["$editedBy.user.position", null] },
                        "then": null,
                        "else": { "_id": "$editedBy.user.position._id", "name": "$editedBy.user.position.name" }
                    }
                }, "_id": 1, "accessRole": 1, "firstName": 1, "lastName": 1
            }, "date": 1
        },
        "_id": 1,
        "position": 1,
        "avgRating": 1,
        "manager": 1,
        "lastAccess": 1,
        "firstName": 1,
        "lastName": 1,
        "email": 1,
        "phoneNumber": 1,
        "accessRole": 1,
        "createdBy": 1,
        "vacation": 1,
        "status": 1,
        "region": 1,
        "subRegion": 1,
        "retailSegment": 1,
        "outlet": 1,
        "branch": 1,
        "country": 1,
        "currentLanguage": 1,
        "super": 1,
        "archived": 1,
        "temp": 1,
        "confirmed": 1,
        "translated": 1,
        "dateJoined": 1,
        "beforeAccess": 1,
        "lasMonthEvaluate": 1,
        "covered": 1,
        "token": 1
    }
}, { "$match": {} }, {
    "$project": {
        "avgRating": {
            "monthly": {
                "$let": {
                    "vars": { "valAdjusted": { "$add": ["$avgRating.monthly", { "$cond": [{ "$gte": ["$avgRating.monthly", 0] }, 0.5, -0.5] }] } },
                    "in": { "$subtract": ["$$valAdjusted", { "$mod": ["$$valAdjusted", 1] }] }
                }
            }
        },
        "_id": 1,
        "position": 1,
        "manager": 1,
        "lastAccess": 1,
        "firstName": 1,
        "lastName": 1,
        "email": 1,
        "phoneNumber": 1,
        "accessRole": 1,
        "createdBy": 1,
        "editedBy": 1,
        "vacation": 1,
        "status": 1,
        "region": 1,
        "subRegion": 1,
        "retailSegment": 1,
        "outlet": 1,
        "branch": 1,
        "country": 1,
        "currentLanguage": 1,
        "super": 1,
        "archived": 1,
        "temp": 1,
        "confirmed": 1,
        "translated": 1,
        "dateJoined": 1,
        "beforeAccess": 1,
        "lasMonthEvaluate": 1,
        "covered": 1,
        "token": 1
    }
}, {
    "$lookup": {
        "from": "personnels",
        "localField": "manager",
        "foreignField": "_id",
        "as": "manager"
    }
}, {
    "$project": {
        "manager": { "$arrayElemAt": ["$manager", 0] },
        "_id": 1,
        "position": 1,
        "avgRating": 1,
        "lastAccess": 1,
        "firstName": 1,
        "lastName": 1,
        "email": 1,
        "phoneNumber": 1,
        "accessRole": 1,
        "createdBy": 1,
        "editedBy": 1,
        "vacation": 1,
        "status": 1,
        "region": 1,
        "subRegion": 1,
        "retailSegment": 1,
        "outlet": 1,
        "branch": 1,
        "country": 1,
        "currentLanguage": 1,
        "super": 1,
        "archived": 1,
        "temp": 1,
        "confirmed": 1,
        "translated": 1,
        "dateJoined": 1,
        "beforeAccess": 1,
        "lasMonthEvaluate": 1,
        "covered": 1,
        "token": 1
    }
}, {
    "$project": {
        "manager": {
            "_id": "$manager._id",
            "firstName": "$manager.firstName",
            "lastName": "$manager.lastName"
        },
        "_id": 1,
        "position": 1,
        "avgRating": 1,
        "lastAccess": 1,
        "firstName": 1,
        "lastName": 1,
        "email": 1,
        "phoneNumber": 1,
        "accessRole": 1,
        "createdBy": 1,
        "editedBy": 1,
        "vacation": 1,
        "status": 1,
        "region": 1,
        "subRegion": 1,
        "retailSegment": 1,
        "outlet": 1,
        "branch": 1,
        "country": 1,
        "currentLanguage": 1,
        "super": 1,
        "archived": 1,
        "temp": 1,
        "confirmed": 1,
        "translated": 1,
        "dateJoined": 1,
        "beforeAccess": 1,
        "lasMonthEvaluate": 1,
        "covered": 1,
        "token": 1
    }
}, {
    "$lookup": {
        "from": "personnels",
        "localField": "vacation.cover",
        "foreignField": "_id",
        "as": "vacation.cover"
    }
}, {
    "$project": {
        "vacation": { "cover": { "$arrayElemAt": ["$vacation.cover", 0] }, "onLeave": 1 },
        "_id": 1,
        "position": 1,
        "avgRating": 1,
        "manager": 1,
        "lastAccess": 1,
        "firstName": 1,
        "lastName": 1,
        "email": 1,
        "phoneNumber": 1,
        "accessRole": 1,
        "createdBy": 1,
        "editedBy": 1,
        "status": 1,
        "region": 1,
        "subRegion": 1,
        "retailSegment": 1,
        "outlet": 1,
        "branch": 1,
        "country": 1,
        "currentLanguage": 1,
        "super": 1,
        "archived": 1,
        "temp": 1,
        "confirmed": 1,
        "translated": 1,
        "dateJoined": 1,
        "beforeAccess": 1,
        "lasMonthEvaluate": 1,
        "covered": 1,
        "token": 1
    }
}, {
    "$project": {
        "vacation": {
            "cover": {
                "_id": "$vacation.cover._id",
                "firstName": "$vacation.cover.firstName",
                "lastName": "$vacation.cover.lastName"
            }, "onLeave": 1
        },
        "lastDate": { "$ifNull": ["$editedBy.date", "$createdBy.date"] },
        "_id": 1,
        "position": 1,
        "avgRating": 1,
        "manager": 1,
        "lastAccess": 1,
        "firstName": 1,
        "lastName": 1,
        "email": 1,
        "phoneNumber": 1,
        "accessRole": 1,
        "createdBy": 1,
        "editedBy": 1,
        "status": 1,
        "region": 1,
        "subRegion": 1,
        "retailSegment": 1,
        "outlet": 1,
        "branch": 1,
        "country": 1,
        "currentLanguage": 1,
        "super": 1,
        "archived": 1,
        "temp": 1,
        "confirmed": 1,
        "translated": 1,
        "dateJoined": 1,
        "beforeAccess": 1,
        "lasMonthEvaluate": 1,
        "covered": 1,
        "token": 1
    }
}, { "$unwind": { "path": "$country", "preserveNullAndEmptyArrays": true } }, {
    "$group": {
        "_id": "$_id",
        "position": { "$first": "$position" },
        "avgRating": { "$first": "$avgRating" },
        "manager": { "$first": "$manager" },
        "lastAccess": { "$first": "$lastAccess" },
        "beforeAccess": { "$first": "$beforeAccess" },
        "firstName": { "$first": "$firstName" },
        "lastName": { "$first": "$lastName" },
        "email": { "$first": "$email" },
        "phoneNumber": { "$first": "$phoneNumber" },
        "accessRole": { "$first": "$accessRole" },
        "dateJoined": { "$first": "$dateJoined" },
        "createdBy": { "$first": "$createdBy" },
        "editedBy": { "$first": "$editedBy" },
        "vacation": { "$first": "$vacation" },
        "status": { "$first": "$status" },
        "region": { "$first": "$region" },
        "subRegion": { "$first": "$subRegion" },
        "retailSegment": { "$first": "$retailSegment" },
        "outlet": { "$first": "$outlet" },
        "branch": { "$first": "$branch" },
        "country": { "$addToSet": "$country" },
        "currentLanguage": { "$first": "$currentLanguage" },
        "super": { "$first": "$super" },
        "archived": { "$first": "$archived" },
        "temp": { "$first": "$temp" },
        "confirmed": { "$first": "$confirmed" },
        "translated": { "$first": "$translated" },
        "covered": { "$first": "$covered" }
    }
}, { "$sort": { "lastDate": -1 } }, {
    "$group": {
        "_id": null,
        "total": { "$sum": 1 },
        "data": { "$push": "$$ROOT" }
    }
}, { "$unwind": { "path": "$data", "preserveNullAndEmptyArrays": true } }, {
    "$project": {
        "_id": "$data._id",
        "position": "$data.position",
        "avgRating": "$data.avgRating",
        "manager": "$data.manager",
        "lastAccess": "$data.lastAccess",
        "firstName": "$data.firstName",
        "lastName": "$data.lastName",
        "email": "$data.email",
        "phoneNumber": "$data.phoneNumber",
        "accessRole": "$data.accessRole",
        "createdBy": "$data.createdBy",
        "editedBy": "$data.editedBy",
        "vacation": "$data.vacation",
        "status": "$data.status",
        "region": "$data.region",
        "subRegion": "$data.subRegion",
        "retailSegment": "$data.retailSegment",
        "outlet": "$data.outlet",
        "branch": "$data.branch",
        "country": "$data.country",
        "currentLanguage": "$data.currentLanguage",
        "super": "$data.super",
        "archived": "$data.archived",
        "temp": "$data.temp",
        "confirmed": "$data.confirmed",
        "translated": "$data.translated",
        "dateJoined": "$data.dateJoined",
        "beforeAccess": "$data.beforeAccess",
        "lasMonthEvaluate": "$data.lasMonthEvaluate",
        "covered": "$data.covered",
        "token": "$data.token",
        "total": 1
    }
}, { "$skip": 0 }, { "$limit": 25 }, {
    "$group": {
        "_id": "$total",
        "data": { "$push": "$$ROOT" }
    }
}, { "$project": { "_id": 0, "total": "$_id", "data": 1 } }])