#!/usr/bin/env bash
# Install Bower components
bower install

curl https://s3.amazonaws.com/quotaguard/qgtunnel-latest.tar.gz | tar xz

# Generate API docs
npm i aglio
chmod 755 ./API_documentation/update_docs.sh
chmod +x ./API_documentation/update_docs.sh
npm run docs

# Get additional scripts
chmod +x ./get-scripts.sh
./get-scripts.sh

# Build Custom Reports
chmod +x ./build-custom-reports.sh
./build-custom-reports.sh

# Make database migration
if [ ! -z $CI ] ; then
    echo "Making database migration:"
    chmod +x ./migrations.sh
    ./migrations.sh up
fi