#!/bin/bash

# the script to run with node is at ../src/index.js
# Now run the index.js with node, the path to script will be relative to this file
FOLDER="$(dirname "$(readlink -f "$0")")"
ABSOLUTE_FOLDER=$(realpath $FOLDER)
node $ABSOLUTE_FOLDER/dist/index.js $@