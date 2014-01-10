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
* auto-skip tests
* prevent phantomjs from crashing during test errors
* migrate from ioAggregate to mapAsync
* move npm cssmin dependency to utility2-external
* fix redundant debugFlag in ajax
* remove rollup cache for local tests
* add timeout for deferCallback
* emulate localStorage
* add heroku dynamic config server
* integrate forever-webui

#### 2014.01.10-1
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

#### 2014.01.08-1
* integrate ioAggregate with testModule
* add localhost testing for socks5
* integrate ioAggregate with moduleRollup
* modularize ajaxNodejs
* rewrite EXPORTS.ioAggregate and add moduleInstrumentScript

#### 2013.12.30-1
* add changelog
* add versioning for npm dependencies
