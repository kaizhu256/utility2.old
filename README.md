[![Build Status](https://travis-ci.org/kaizhu256/utility2.png?branch=master)](https://travis-ci.org/kaizhu256/utility2)
[![Coverage Status](https://coveralls.io/repos/kaizhu256/utility2/badge.png?branch=master)](https://coveralls.io/r/kaizhu256/utility2?branch=master)
[![Selenium Test Status](https://saucelabs.com/browser-matrix/utility2.svg)](https://saucelabs.com/u/utility2)
# utility2.js
#### standalone, browser test and code coverage framework for nodejs

## demo usage
```
npm install utility2.js
cd node_modules/utility2
npm test
```

## build and code coverage status
* https://travis-ci.org/kaizhu256/utility2 (build status)
* https://coveralls.io/r/kaizhu256/utility2 (code coverage status)

## changelog
#### todo
* move npm uglify-js dependency to utility2-external
* add option to auto-remove test functions from module
* add post-rollup regular expression replacment handling
* auto-skip tests
* prevent phantomjs from crashing during test errors
* fix redundant debugFlag in ajax
* add timeout for deferCallback
* emulate localStorage
* add heroku dynamic config server
* integrate forever-webui

#### 2014.xx.xx

#### 2014.01.25
* change javascript mimetype to 'application/javascript; charset=utf-8' in EXPORTS.mimeLookup
* fix timeout not triggering in asyncPermute

#### 2014.01.23
* re-add xhr progress feature for browser ajax
* fix rollup minification utf8 bug

#### 2014.01.22
* add minified rollups and source map for utility2-external
* remove rollup cache for local tests
* add post processing for rollup files

#### 2014.01.21
* migrate rollup api to use asyncRemote instead of ioAggregate
* migrate ajaxMultiUrls to use asyncRemote instead of ioAggregate
* add implicit mult-callback error handling for asyncPermute
* migrate testLocal to use asyncRemote instead of ioAggregate
* revamp tryCatch with arguments handling
* merge moduleSocks5AjaxNodejs and moduleSocks5ServerNodejs into moduleSocks5Nodejs
* security - run large asyncPermute calls over several event-loop-cycles to prevent cpu lock
* modify testMock to use lists instead of dicts
* move npm cssmin dependency to utility2-external
* enable server to force https protocol using x-forwarded-proto

#### 2014.01.10
* revamp EXPORTS.testMock
* remove console.log hack
* utility2-external - remove public/assets/external.rollup.auto.css
* utility2-external - remove public/assets/external.rollup.auto.js
* utility2-external - add utility2-external.browser.css
* utility2-external - add shared npm module async
* remove bower dependency for utility2-external
* cleanup console.log and console.error messages
* remove npm mime dependency
* utility2-external - add utility2-external.nodejs.txt

#### 2014.01.08
* integrate ioAggregate with testModule
* add localhost testing for socks5
* integrate ioAggregate with moduleRollup
* modularize ajaxNodejs
* rewrite EXPORTS.ioAggregate and add moduleInstrumentScript

#### 2013.12.30-1
* add changelog
* add versioning for npm dependencies
