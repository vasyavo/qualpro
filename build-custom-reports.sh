#!/usr/bin/env bash

GITHUB_BASIC_TOKEN="`cat ./.githubtoken`"

git clone "https://${GITHUB_BASIC_TOKEN}:x-oauth-basic@github.com/foxtrapplimited/qualpro-spa-custom-reports"
mkdir -p ./src/stories/customReports/frontend
cp -r ./qualpro-spa-custom-reports/build ./src/stories/customReports/frontend
