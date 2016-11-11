#!/usr/bin/env bash

curl="/usr/bin/curl"

# Get additional scripts
TOKEN="52d4d7de06e3b8563f0aac24602e217c66395d6c"
OWNER="rhinobuccaneers"
REPO="qualpro-scripts"
PATH="restore-staging-db.sh"
FILE="https://api.github.com/repos/$OWNER/$REPO/contents/$PATH"

$curl --header "Authorization: token ${TOKEN}" \
     --header "Accept: application/vnd.github.v3.raw" \
     --remote-name \
     --location $FILE