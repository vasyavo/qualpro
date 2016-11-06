#!/usr/bin/env bash
# Install Bower components
bower install

# Generate API docs
npm i aglio
chmod 755 ./API_documentation/update_docs.sh
chmod +x ./API_documentation/update_docs.sh
npm run docs