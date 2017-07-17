### A Qual Pro CMS

![Build status][ci-url]

[![Deploy](https://www.herokucdn.com/deploy/button.svg)][heroku-repo]

[heroku-repo]: https://heroku.com/deploy?template=https://github.com/rhinobuccaneers/qualpro.git
[ci-url]: https://codeship.com/projects/d26237f0-7138-0134-8443-66707d799ba6/status?branch=master

Project powered by Javascript & Node.js 6.5.0:
- ECMAScript 2015
- Backbone / Marionette, AMD
- Express 4
- MongoDB 3.4.1, Redis 3.2
- AWS S3, Twillio, SendGrid, PubNub

## Development process

Current project configured with continuous integration. *[Codeship](https://codeship.com/) is a fully customizable hosted CI platform.*
CI listens all branches and runs a test pipeline on each commit. After that it deploys code to [Heroku](https://www.heroku.com/).
An application pipeline on Heroku built with promotion system which upgrade dyno from development to staging and production environments.

#### Links:
 - Heroku app available [here](https://qualpro.herokuapp.com/)
 - [Join](https://foxtrappteam.slack.com) Slack team.
 - [Project items](https://drive.google.com/open?id=0Bx8qXOKRvi2adXJiT2ZwRUdVdXM)


#### To be discussed:
 - writing correct test results
 - generate code coverage report
 - code style guides

## How it works?

To run project, put in terminal:
```
$ npm install
$ cross-env NODE_ENV=YOUR_ENVIRONMENT npm start
```

In order to make conventional commit, use:
```
$ npm run commit
```

For generating api docs use:
```
$ npm run docs
```
Ensure 'update_docs.sh' have right access level
```
ls -al - check right
chmod 755 ./API_documentation/update_docs.sh - full access
```

## Database migrations

To create migration file:
```
$ node ./node_modules/mongodb-migrate -runmm create "optional-name-of-migration"
```

To run migration:
```
$ node ./node_modules/mongodb-migrate -runmm up
```

All parameters you can check [here](https://github.com/afloyd/mongo-migrate)


#### Node Inspector
Debugging with `node-inspector` do not works with node version higher than *6.3.1*
https://github.com/node-inspector/node-inspector/issues/907
You should edit `...\node_modules\node-inspector\lib\InjectorClient.js` file at line 111
`if(NM.length > 0) cb(error, NM[0].ref);`

#### Settings

All project settings are stored in `config` folder, the main config file is `index.js`.
Specific environment presets are stored in files like `.env.YOUR_ENVIRONMENT`.
Settings include `aws.json` which should contain AWS S3 credentials, but it ignored from repository.
Ask credentials in your administrator.

## Environment variables

##### General settings of instance:
 - `HOST`
 - `PORT`
 - `UPLOADER_TYPE` - Currently available only with AmazonS3.
 - `SCHEDULER_HOST`
 - `WEB_CONCURRENCY` - defaults to `1`.
 - `SESSION_AGE` - Session age, defaults to `86400000` (1 day).
 - `SESSION_MAX_AGE` - Max session age, defaults to `3153600000` (1 year).

##### Twilio:
 - `SMS_ACCOUNT_SID`
 - `SMS_AUTH_TOKEN`
 - `SMS_NUMBER`
 
##### SendGrid:
 - `SENDGRID_APIKEY`
 
##### AWS S3
 - `AWS_S3_BUCKET`
 - `AWS_ACCESS_KEY_ID`
 - `AWS_SECRET_ACCESS_KEY`
 - `AWS_S3_REGION` by default `eu-central-1`
 
##### Firebase Cloud Messaging
 - `FCM_API_KEY`
 
##### PubNub
 - `PUBNUB_PUBLISH_KEY`
 - `PUBNUB_SUBSCRIBE_KEY`

##### PhantomJS
 - `PHANTOM_WORKERS`
 - `PHANTOM_TIMEOUT`
 - `PHANTOM_PORT_LEFT`
 - `PHANTOM_PORT_RIGHT`
 - `PHANTOM_HOST`

##### Datastore:
 - `REDIS_URL` or `REDISGREEN_URL` Redis url

##### Database:
 - `MONGODB_URI` MongoDB url passed by mLab addon
 
##### Foxtrapp apps

 - `SCHEDULER_HOST`
