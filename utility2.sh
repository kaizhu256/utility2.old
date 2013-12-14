#!/bin/bash

## main loop
script="pwd"
nodeScript=${2-./utility2.js}
serverPort=${3-random}
timeoutDefault=${4-30000}
case $1 in
npmStart)
  script="$script; $nodeScript --repl --serverPort $serverPort"
  ;;
npmTest)
  script="$script; rm -r tmp/test_coverage 2>/dev/null"
  script="$script; istanbul cover --dir tmp/test_coverage -x **.min.** -x **.rollup.** -x **/git_modules/** -x **/tmp/** $nodeScript --"
  script="$script  --repl --serverPort $serverPort --test --timeoutDefault $timeoutDefault"
  script="$script; cat tmp/test_coverage/lcov.info | node_modules/coveralls/bin/coveralls.js"
  ;;
esac
echo $script
bash -c "$script"
