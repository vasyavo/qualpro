#!/usr/bin/env bash

curl="/usr/bin/curl"

# Get additional scripts
HEROKU_APP_ENV=${HEROKU_APP_ENV:="staging"}
TOKEN="d6e7978abd2d2f3cbea3d54216daf6b8f7bd156d"
OWNER="foxtrapplimited"
REPO="qualpro-scripts"
PATH="reproduce-${HEROKU_APP_ENV}-db.sh"
FILE="https://api.github.com/repos/$OWNER/$REPO/contents/$PATH"

$curl --header "Authorization: token ${TOKEN}" \
     --header "Accept: application/vnd.github.v3.raw" \
     --remote-name \
     --location $FILE