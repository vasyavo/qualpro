#!/bin/bash

#https://github.com/danielgtaylor/aglio

#sudo npm install -g aglio

pwd=$(pwd)
cd $pwd/API_documentation

# fixme Line 129: the resource '/contactUs/{id}' is already defined (warning code 2)
# exec aglio -i qualPro_API.apib -o qualPro_API.html