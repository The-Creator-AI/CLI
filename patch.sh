#!/bin/bash

## Trying to get the correct diff patch from gemini
# * Sending line numbers with the code so that it helps generate the diff
# * Using this command to apply the patch
git apply \
--reject \
--verbose \
--recount \
--ignore-space-change \
--ignore-whitespace \
--allow-empty \
--inaccurate-eof \
diff.patch
# * Still the diff that we get is wrong
#   * There's whitespace issue
#     * Which probably can be fixed with ```--ignore-space-change --ignore-whitespace```
#   * There's ```error: corrupt patch at line 90``` issue
#     * 