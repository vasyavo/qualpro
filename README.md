### A Qual Pro CMS

[ ![Codeship Status for rhinobuccaneers/master](https://codeship.com/projects/d26237f0-7138-0134-8443-66707d799ba6/status?branch=master)](https://github.com/rhinobuccaneers/qualpro)

Project powered by Javascript & Node.js 6.5.0:
- ECMAScript 5.1
- Backbone, AMD
- Express 4
- MongoDB 3.2, Redis
- AWS S3, Twillio, SendGrid

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

#### Settings

All project settings are stored in `config` folder, the main config file is `index.js`.
Specific environment presets are stored in files like `.env.YOUR_ENVIRONMENT`.
Settings include `aws.json` which should contain AWS S3 credentials, but it ignored from repository.
Ask credentials in your administrator.

## Environment variables

##### General settings of instance:
 - `HOST`
 - `PORT`
 - `NODE_APP_INSTANCE`

##### Database configurations:
 - `DB_USER`
 - `DB_PASS`
 - `DB_HOST`
 - `DB_PORT`
 - `DB_NAME`

##### Redis host :
 - `REDIS_HOST`

##### Socket connection settings:
 - `SOCKET_DB_HOST`
 - `SOCKET_DB_PORT`
 - `SOCKET_DB`

##### Twilio credentials are:
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

##### Heroku:
 - `REDIS_URL` Redis url which passed by Heroku Redis addon
 - `MONGODB_URI` MongoDB url passed by mLab addon
 - `MONGOHQ_URL` MongoDB url which passed by Compose.io addon
