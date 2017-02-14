#!/usr/bin/env bash

curl="/usr/bin/curl"

# Get additional scripts
HEROKU_APP_ENV=${HEROKU_APP_ENV:="staging"}
TOKEN="52d4d7de06e3b8563f0aac24602e217c66395d6c"
OWNER="rhinobuccaneers"
REPO="qualpro-scripts"
PATH="reproduce-${HEROKU_APP_ENV}-db.sh"
FILE="https://api.github.com/repos/$OWNER/$REPO/contents/$PATH"

$curl --header "Authorization: token ${TOKEN}" \
     --header "Accept: application/vnd.github.v3.raw" \
     --remote-name \
     --location $FILE