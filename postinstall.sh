#!/usr/bin/env bash
# Install Bower components
bower install

# Generate API docs
npm i aglio
chmod 755 ./API_documentation/update_docs.sh
chmod +x ./API_documentation/update_docs.sh
npm run docs

# Get additional scripts
chmod +x ./get-scripts.sh
./get-scripts.sh

# Make database migration
if [ ! -z $CI ] ; then
    echo "Making database migration:"
    node ./node_modules/mongodb-migrate -runmm -c ./ -dbc "{\"connectionString\": \"${MONGODB_URI}\"}" up
fi