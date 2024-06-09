#!/bin/bash

# Pull the latest changes from the remote repository
git pull

# Install the npm dependencies
npm install

# Build the project
npm run build

# Now let's create the symbolic link
SCRIPT_PATH="$(dirname $0)/creator.sh"
ABSOLUTE_PATH=$(realpath $SCRIPT_PATH)
SCRIPT_NAME='creator-cli'

# Determine the correct path for the symbolic link based on the operating system
if [[ "$OSTYPE" == "msys" ]]; then
    LINK_PATH=$APPDATA/npm/$SCRIPT_NAME.cmd
else
    LINK_PATH=/usr/local/bin/$SCRIPT_NAME
fi

# Remove the existing link (if any)
rm -f $LINK_PATH

# Create the symbolic link
ln -s "$ABSOLUTE_PATH" $LINK_PATH

# Log the success message
echo "Symbolic link created successfully at $LINK_PATH"
ls -l /usr/local/bin/creator