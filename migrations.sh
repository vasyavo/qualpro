#!/usr/bin/env bash
if [ $1 == 'up' ]
    then
        node ./node_modules/mongodb-migrate -runmm -c ./ -dbc "{\"connectionString\": \"${MONGODB_URI}\"}" up
    fi

if [ $1 == 'down' ]
    then
        node ./node_modules/mongodb-migrate -runmm -c ./ -dbc "{\"connectionString\": \"${MONGODB_URI}\"}" down
    fi
