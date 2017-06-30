db.competitorBranding.aggregate([{"$match": {"$and": [{"$or": [{"country": {"$in": [ObjectId("583720173a90064c13696622")]}}, {"country": {"$eq": null}}, {"country": {"$eq": []}}]}]}}, {"$match": {"$and": [{"$or": [{"category": {"$in": [ObjectId("5837200a3a90064c13696187")]}}, {"category": {"$eq": null}}, {"category": {"$eq": []}}]}]}}, {"$match": {"$or": [{"$and": [{"createdBy.date": {"$gt": Date("2017-05-31T20:00:00.000Z")}}, {"createdBy.date": {"$lt": Date("2017-06-30T20:00:00.000Z")}}]}, {"$and": [{"createdBy.date": {"$gt": Date("2016-06-30T20:00:00.000Z")}}, {"createdBy.date": {"$lt": Date("2017-06-30T20:00:00.000Z")}}]}]}}, {
    "$lookup": {
        "from": "personnels",
        "localField": "createdBy.user",
        "foreignField": "_id",
        "as": "createdBy.user"
    }
}, {
    "$addFields": {
        "createdBy": {
            "user": {
                "$let": {
                    "vars": {"user": {"$arrayElemAt": ["$createdBy.user", 0]}},
                    "in": {
                        "_id": "$$user._id",
                        "name": {
                            "en": {"$concat": ["$$user.firstName.en", " ", "$$user.lastName.en"]},
                            "ar": {"$concat": ["$$user.firstName.ar", " ", "$$user.lastName.ar"]}
                        },
                        "position": "$$user.position"
                    }
                }
            }, "date": "$createdBy.date"
        }
    }
}, {"$unwind": "$category"}, {
    "$group": {
        "_id": {"country": "$country", "region": "$region", "category": "$category"},
        "subRegion": {"$addToSet": "$subRegion"},
        "retailSegment": {"$addToSet": "$retailSegment"},
        "outlet": {"$addToSet": "$outlet"},
        "branch": {"$addToSet": "$branch"},
        "count": {"$sum": 1}
    }
}, {
    "$lookup": {
        "from": "domains",
        "localField": "_id.country",
        "foreignField": "_id",
        "as": "country"
    }
}, {
    "$lookup": {
        "from": "domains",
        "localField": "_id.region",
        "foreignField": "_id",
        "as": "region"
    }
}, {
    "$lookup": {
        "from": "categories",
        "localField": "_id.category",
        "foreignField": "_id",
        "as": "category"
    }
}, {
    "$project": {
        "_id": 1,
        "count": 1,
        "subRegion": 1,
        "retailSegment": 1,
        "outlet": 1,
        "branch": 1,
        "country": {
            "$let": {
                "vars": {"country": {"$arrayElemAt": ["$country", 0]}},
                "in": {"_id": "$$country._id", "name": "$$country.name"}
            }
        },
        "region": {
            "$let": {
                "vars": {"region": {"$arrayElemAt": ["$region", 0]}},
                "in": {"_id": "$$region._id", "name": "$$region.name"}
            }
        },
        "category": {
            "$let": {
                "vars": {"category": {"$arrayElemAt": ["$category", 0]}},
                "in": {"_id": "$$category._id", "name": "$$category.name"}
            }
        }
    }
}, {"$sort": {"country._id": 1, "category._id": 1, "region._id": 1}}, {
    "$group": {
        "_id": {
            "country": "$country._id",
            "category": "$category._id"
        },
        "country": {"$first": "$country"},
        "subRegion": {"$push": "$subRegion"},
        "retailSegment": {"$push": "$retailSegment"},
        "outlet": {"$push": "$outlet"},
        "branch": {"$push": "$branch"},
        "category": {"$first": "$category"},
        "data": {"$push": "$count"},
        "labels": {"$push": "$region.name"}
    }
}, {
    "$project": {
        "subRegion": {
            "$reduce": {
                "input": "$subRegion",
                "initialValue": [],
                "in": {
                    "$cond": {
                        "if": {"$and": [{"$ne": ["$$this", []]}, {"$ne": ["$$this", null]}]},
                        "then": {"$setUnion": ["$$value", "$$this"]},
                        "else": "$$value"
                    }
                }
            }
        },
        "retailSegment": {
            "$reduce": {
                "input": "$retailSegment",
                "initialValue": [],
                "in": {
                    "$cond": {
                        "if": {"$and": [{"$ne": ["$$this", []]}, {"$ne": ["$$this", null]}]},
                        "then": {"$setUnion": ["$$value", "$$this"]},
                        "else": "$$value"
                    }
                }
            }
        },
        "outlet": {
            "$reduce": {
                "input": "$outlet",
                "initialValue": [],
                "in": {
                    "$cond": {
                        "if": {"$and": [{"$ne": ["$$this", []]}, {"$ne": ["$$this", null]}]},
                        "then": {"$setUnion": ["$$value", "$$this"]},
                        "else": "$$value"
                    }
                }
            }
        },
        "branch": {
            "$reduce": {
                "input": "$branch",
                "initialValue": [],
                "in": {
                    "$cond": {
                        "if": {"$and": [{"$ne": ["$$this", []]}, {"$ne": ["$$this", null]}]},
                        "then": {"$setUnion": ["$$value", "$$this"]},
                        "else": "$$value"
                    }
                }
            }
        },
        "country": 1,
        "category": 1,
        "datasets": [{"data": "$data"}],
        "labels": "$labels"
    }
}, {
    "$lookup": {
        "from": "domains",
        "localField": "subRegion",
        "foreignField": "_id",
        "as": "subRegion"
    }
}, {
    "$lookup": {
        "from": "retailSegments",
        "localField": "retailSegment",
        "foreignField": "_id",
        "as": "retailSegment"
    }
}, {
    "$lookup": {
        "from": "outlets",
        "localField": "outlet",
        "foreignField": "_id",
        "as": "outlet"
    }
}, {
    "$lookup": {
        "from": "branches",
        "localField": "branch",
        "foreignField": "_id",
        "as": "branch"
    }
}, {
    "$project": {
        "subRegion": {"_id": 1, "name": 1},
        "retailSegment": {"_id": 1, "name": 1},
        "outlet": {"_id": 1, "name": 1},
        "branch": {"_id": 1, "name": 1},
        "country": 1,
        "category": 1,
        "datasets": 1,
        "labels": 1
    }
}, {
    "$group": {
        "_id": null,
        "charts": {
            "$push": {
                "category": "$category",
                "country": "$country",
                "subRegion": "$subRegion",
                "retailSegment": "$retailSegment",
                "outlet": "$outlet",
                "branch": "$branch",
                "datasets": "$datasets",
                "labels": "$labels"
            }
        }
    }
}])