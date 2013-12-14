#!/bin/bash

## main loop
script="pwd"
nodeScript=${2-./utility2.js}
serverPort=${3-random}
timeoutDefault=${4-8000}
case $1 in
npmStart)
  script="$script; $nodeScript --repl --serverPort $serverPort"
  ;;
npmTest)
  script="$script; rm -r tmp/test_coverage 2>/dev/null"
  script="$script; istanbul cover --dir ./tmp/test_coverage -x **.min.** -x **.rollup.** -x **/git_modules/** -x **/tmp/** $nodeScript --"
  script="$script  --repl --serverPort $serverPort --test --timeoutDefault $timeoutDefault"
  ;;
esac
echo $script
bash -c "$script"
