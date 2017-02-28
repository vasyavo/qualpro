/*
 * Wednesday, 28 February, 2017
 * Feature "Comments"
 * */
const async = require('async');

require('mongodb');

const imageSrc = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAACWAQMAAAAGz+OhAAAABlBMVEXNy8v///83JiJ6AAABlUlEQVRIx+3UMWrEQAyFYQ0Dcekj+ApbpgjrK6XcbuZocxQfYUoXZhRJtmGfxhAIKUJYNbt8jX+EZXrNv5vEzKszltmQglpDi6zzMxuuTJ/pbdXGX7fvn9uIwlXzn7VQe4trb8PW29hiZxOHC8sXVpK3kZfZ28B1YobX6C3yOvI++bApsAbalNOINdBmOWzOicNh9bQyc/a2SOCD0KoESiXYOuj/CLZFuw2wFuw20rOxBOovmATqKsA0UFYBpoHJmQbOJYJp4FQDmAaOG4Fp4NDQ2DZICcw2mNFsg3kGs8DizAInNA1cnGmgs6KB3jSwepPAOjqTQG83Cfx09i6BN2cfEkjO7hLobZbAzjI3mtxeSuLOFgn0ViUQrY6rbhBt2HSDzppuEGyNrBtECyyBEWwjPc0A1ihpoDMLTM/GFKsGguX9isEKkQaCyW1pIJjdUYtg+x0FMN5vB63snxmwlR4aCMZsG3RmGzxt2s02uKDZBgt8YNk2mA8LO+1XjGOBnY0XNlxYvLCg5odzb4n6udNrXnPOF+LsukzuroMwAAAAAElFTkSuQmCC';

exports.up = function(db, next) {
    async.waterfall([

        (cb) => {
            async.parallel({

                position: (cb) => {
                    db.collection('positions').findOne({ 'name.en': 'Customer Success' }, cb);
                },

                accessRole: (cb) => {
                    db.collection('accessRoles').findOne({ level: 1 }, cb);
                },

            }, cb);
        },

        (options, cb) => {
            const {
                position,
                accessRole,
            } = options;

            if (!position || !accessRole) {
                return cb('There is not enough data for begin migration');
            }

            db.collection('personnels').insert({
                email: 'qualpro.admin@foxtrapp.com',
                phoneNumber: '',
                dateJoined: new Date(),
                lasMonthEvaluate: null,
                currentLanguage: 'en',
                status: 'login',
                temp: false,
                vacation: {
                    cover: null,
                    onLeave: false,
                },
                editedBy: {
                    date: new Date(),
                    user: null,
                },
                createdBy: {
                    date: new Date(),
                    user: null,
                },
                description: '',
                groups: {
                    group: [],
                    users: [],
                    owner: null,
                },
                whoCanRW: 'everyOne',
                archived: false,
                accessRole: accessRole._id,
                position: position._id,
                xlsManager: null,
                manager: null,
                super: false,
                branch: [

                ],
                subRegion: [

                ],
                region: [

                ],
                country: [

                ],
                lastName: {
                    ar: '',
                    en: 'USER',
                },
                firstName: {
                    ar: '',
                    en: 'DELETED',
                },
                imageSrc,
                confirmed: new Date(),
                pass: '$2a$10$grfvz6Guu2uc5QUxrJpcJOD6Z6Eqn3NvdxWj8WT.sEj/yFnR9A8pe',
                lastAccess: null,
                beforeAccess: null,
            }, cb);
        },

        (result, cb) => {
            db.collection('comments').update({
                'createdBy.user': null,
            }, {
                $set: {
                    'createdBy.user': result.ops[0]._id,
                },
            }, {
                multi: true,
            }, cb);
        },

    ], next);
};

exports.down = function(db, next) {
    next();
};
