#!/bin/bash

#https://github.com/danielgtaylor/aglio

#sudo npm install -g aglio

pwd=$(pwd)
cd $pwd/API_documentation
exec aglio -i qualPro_API.apib -o qualPro_API.html