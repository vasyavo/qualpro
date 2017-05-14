#!/usr/bin/env bash

GITHUB_BASIC_TOKEN="`cat ./.githubtoken`"
REPOSITORY_NAME="qualpro-spa-custom-reports"

git clone "https://${GITHUB_BASIC_TOKEN}:x-oauth-basic@github.com/foxtrapplimited/${REPOSITORY_NAME}"
cd "${REPOSITORY_NAME}/"
git checkout master
npm install
npm run build
cd ../
mkdir -p ./src/stories/customReports/frontend
cp -a "./${REPOSITORY_NAME}/build/." ./src/stories/customReports/frontend
rm -rf "./${REPOSITORY_NAME}"
echo "Done!"
