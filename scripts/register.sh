#!/bin/bash

# Now let's create the symbolic link
SCRIPT_PATH=$(dirname $0)/context-ai.sh
ABSOLUTE_PATH=$(realpath $SCRIPT_PATH)
SCRIPT_NAME='context-ai'

# Determine the correct path for the symbolic link based on the operating system
if [[ "$OSTYPE" == "msys" ]]; then
    LINK_PATH=$APPDATA/npm/$SCRIPT_NAME.cmd
else
    LINK_PATH=/usr/local/bin/$SCRIPT_NAME
fi

# Create the symbolic link
ln -s $ABSOLUTE_PATH $LINK_PATH

# Log the success message
echo "Symbolic link created successfully at $LINK_PATH"
ls -l /usr/local/bin/context-ai