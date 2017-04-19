#!/usr/bin/env bash

curl="/usr/bin/curl"

# Get additional scripts
HEROKU_APP_ENV=${HEROKU_APP_ENV:="staging"}
GITHUB_BASIC_TOKEN="`cat ./.githubtoken`"
OWNER="foxtrapplimited"
REPO="qualpro-scripts"
PATH="reproduce-${HEROKU_APP_ENV}-db.sh"
FILE="https://api.github.com/repos/$OWNER/$REPO/contents/$PATH"

$curl --header "Authorization: token ${GITHUB_BASIC_TOKEN}" \
     --header "Accept: application/vnd.github.v3.raw" \
     --remote-name \
     --location $FILE