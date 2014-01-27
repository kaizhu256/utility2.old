#!/usr/bin/env node
/*jslint browser: true, indent: 2, maxerr: 8, node: true, nomen: true, regexp: true, todo: true, unparam: true*/
/*global global, required, state, utility2, $*/
/*
utility2.js
standalone, browser test and code coverage framework for nodejs",
*/



(function moduleInitShared() {
  /*
    this shared module inits utility2
  */
  'use strict';
  var local;
  local = {

    _name: 'utility2.moduleInitShared',

    _init: function () {
      /* export global objects */
      if (typeof window === 'object') {
        window.global = window.global || window;
      }
      global.module = global.module || undefined;
      global.required = global.required || {};
      global.state = global.state || {};
      global.utility2 = global.utility2 || {};
      required.utility2 = utility2;
      /* debug print */
      global[['debug', 'Print'].join('')] = utility2._zxqjDp = function () {
        /*
          this global function is used purely for temporary debugging,
          and jslint will nag you to remove it
        */
        console.log('\n\n\n\ndebug' + 'Print');
        console.log.apply(console, arguments);
        console.log();
      };
      /* javascript platform */
      state.javascriptPlatform = 'unknown';
      if (global.process && process.versions) {
        state.javascriptPlatform = 'nodejs';
        /* javascript platform nodejs */
        if (process.versions.node) {
          state.isNodejs = true;
          utility2.require = utility2.require || require;
        }
        /* javascript platform node-webkit */
        state.isNodeWebkit = process.versions['node-webkit'];
      }
      /* javascript platform phantomjs */
      if (global.phantom) {
        state.javascriptPlatform = 'phantomjs';
        state.isPhantomjs = true;
      /* javascript platform browser */
      } else if (global.document) {
        state.javascriptPlatform = 'browser';
        state.isBrowser = true;
      }
      /* init module */
      local.initModule(module, local);
    },

    _initOnce: function () {
      /* exports */
      utility2.errorIgnore = utility2.errorIgnore || new Error();
      state.timeoutDefault = state.timeoutDefault || 30 * 1000;
      /* debug */
      global.onEventError = utility2.onEventErrorDefault;
      local._initOnceNodejs();
    },

    _initOnceNodejs: function () {
      if (!state.isNodejs) {
        return;
      }
      utility2.requireModules(['graceful-fs', 'utility2-external', 'vm']);
      /* override required.fs with required.graceful_fs */
      required.fs = required.graceful_fs;
      /* require utility2-external.shared.js */
      utility2.evalFileOnEventError(required.utility2_external.__dirname
        + '/public/utility2-external.shared.js',
        utility2.onEventErrorDefault);
    },

    initModule: function (module, local2) {
      /*
        this function inits the module with the local2 object
      */
      var exports;
      /* assert local2._name */
      if (utility2.assert) {
        utility2.assert(local2._name, local2._name);
      }
      /* module.exports */
      exports = local2._name.split('.');
      exports = required[exports[0]] = required[exports[0]] || {};
      Object.keys(local2).forEach(function (key) {
        var match;
        /* ignore test items */
        if (key.slice(-5) === '_test') {
          return;
        }
        /* set dict items to state object*/
        match = (/(.+Dict)_(.*)/).exec(key);
        if (match) {
          state[match[1]] = state[match[1]] || {};
          state[match[1]][match[2]] = local2[key];
          return;
        }
        /* set prototype items to object's prototype*/
        match = (/(.+)_prototype_(.+)/).exec(key);
        if (match) {
          local2[match[1]].prototype[match[2]] = local2[key];
          return;
        }
        /* set remaining items to exports */
        if (key[0] !== '_') {
          exports[key] = local2[key];
        }
      });
      /* immediately init critical modules */
      if ((/^utility2\.module(?:Fs|Init)/).test(local2._name)) {
        local._initModuleResume(module, local2, exports);
      } else {
        /* defer init of non-critical modules*/
        utility2.deferCallback('untilJqueryReady', 'defer', function () {
          local._initModuleResume(module, local2, exports);
        });
        /* env browser - defer init of module until jquery.ready */
        if (state.isBrowser) {
          /* require jquery */
          utility2.assert(global.jQuery, 'utility2.js requires jquery');
          global.jQuery(function () {
            utility2.deferCallback('untilJqueryReady', 'resume');
          });
        /* env non-browser - defer init of module until next event-loop-cycle */
        } else {
          setTimeout(function () {
            utility2.deferCallback('untilJqueryReady', 'resume');
          });
        }
      }
    },

    _initModuleOnceNodejs: function (module, local2, exports) {
      /*
        this function inits the nodejs module with extra nodejs code
      */
      /* init nodejs module once */
      if (!state.isNodejs
          || exports.__filename
          || !(module && module.filename)
          || !utility2.fsWatch) {
        return;
      }
      exports.__filename = exports.__filename || module.filename;
      exports.__dirname = exports.__dirname || utility2.fsDirname(exports.__filename);
      module.exports = exports;
      /* watch module */
      utility2.fsWatch({ action: ['lint', function (file, content, content2) {
        exports._fileContent = content2;
        exports._fileContentBrowser = global.__coverage__ ? content2
          : (content2 + '\n(function moduleNodejs() {\n}());\n')
            .replace((/\n\(function module\w*Nodejs\([\S\s]*/), '').trim();
      }, 'eval'], name: exports.__filename });
    },

    _initModuleResume: function (module, local2, exports) {
      /*
        this function resumes init of the module
      */
      /* init module once */
      state.initOnceDict = state.initOnceDict || {};
      if (!state.initOnceDict[local2._name]) {
        state.initOnceDict[local2._name] = true;
        /* init module._initOnce */
        if (local2._initOnce) {
          local2._initOnce();
        }
        /* init extra nodejs code */
        local._initModuleOnceNodejs(module, local2, exports);
      }
      /* run tests */
      setTimeout(function () {
        utility2.deferCallback(state.isBrowser ? 'untilJqueryReady' : 'untilServerReady',
          'defer',
          local2._initTest || function () {
            utility2.testLocal(local2);
          });
      });
    },

    assert: function (passed, message) {
      /*
        this function throws an error if the assertion fails
      */
      if (!passed) {
        throw new Error(message ? 'assertion error - ' + message : 'assertion error');
      }
    },

    _assert_default_test: function (onEventError) {
      /*
        this function tests assert's default handling behavior
      */
      utility2.assert(true);
      utility2.tryCatch(function () {
        utility2.assert(false);
      }, function (error) {
        utility2.assert(error instanceof Error);
        onEventError();
      });
    },

    deferCallback: function (key, mode, callback) {
      /*
        this function defers the callback until the key is ready
      */
      var self;
      self = state.deferCallbackDict = state.deferCallbackDict || {};
      self = self[key] = self[key] || { callbackList: [], pause: true };
      switch (mode) {
      case 'delete':
        delete state.deferCallbackDict[key];
        break;
      case 'defer':
        self.callbackList.push(callback);
        if (!self.pause) {
          local._deferCallbackResume(self);
        }
        break;
      case 'error':
        self.error = callback;
        local._deferCallbackResume(self);
        break;
      case 'pause':
        self.pause = !self.error;
        break;
      /* pause defer object and reset its error state */
      case 'reset':
        self.error = null;
        self.pause = true;
        break;
      case 'resume':
        local._deferCallbackResume(self);
        break;
      default:
        throw new Error('deferCallback - unknown mode ' + mode);
      }
    },

    _deferCallbackResume: function (self) {
      /*
        this function resumes all callbacks in the defer object
      */
      self.pause = false;
      while (self.callbackList.length) {
        self.callbackList.shift()(self.error);
      }
    },

    _deferCallback_default_test: function (onEventError) {
      /*
        this function tests deferCallback's default handling behavior
      */
      var defer, key;
      key = utility2.uuid4();
      utility2.deferCallback(key, 'pause');
      defer = state.deferCallbackDict[key];
      utility2.assert(defer.pause === true);
      utility2.deferCallback(key, 'resume');
      utility2.assert(defer.pause === false);
      utility2.deferCallback(key, 'defer', function (error) {
        utility2.deferCallback(key, 'delete');
        utility2.assert(state.deferCallbackDict[key] === undefined);
        utility2.assert(!error);
        onEventError();
      });
    },

    _deferCallback_error_test: function (onEventError) {
      /*
        this function tests deferCallback's error handling behavior
      */
      var defer, error, key;
      error = new Error();
      key = utility2.uuid4();
      utility2.deferCallback(key, 'resume');
      defer = state.deferCallbackDict[key];
      utility2.assert(defer.pause === false);
      utility2.deferCallback(key, 'error', error);
      utility2.assert(defer.error === error);
      utility2.deferCallback(key, 'reset');
      utility2.assert(defer.error === null);
      utility2.deferCallback(key, 'error', error);
      utility2.assert(defer.error === error);
      utility2.deferCallback(key, 'defer', function (error) {
        utility2.deferCallback(key, 'delete');
        utility2.assert(state.deferCallbackDict[key] === undefined);
        utility2.assert(error instanceof Error);
        onEventError();
      });
    },

    _deferCallback_unknownMode_test: function (onEventError) {
      /*
        this function tests deferCallback's unknown mode handling behavior
      */
      var key;
      key = utility2.uuid4();
      utility2.tryCatch(function () {
        utility2.deferCallback(key, 'unknown mode');
      }, function (error) {
        utility2.deferCallback(key, 'delete');
        utility2.assert(error instanceof Error);
        onEventError();
      });
    },

    base64Decode: function (text) {
      /*
        this function base64 decodes the text that was encoded in a uri-friendly format
      */
      return global.atob(text.replace((/-/g), '+').replace((/_/g), '/'));
    },

    _base64Decode_default_test: function (onEventError) {
      /*
        this function tests base64Decode's default handling behavior
      */
      utility2.assert(utility2.base64Decode('') === '');
      utility2.assert(utility2.base64Decode('AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUm'
        + 'JygpKissLS4vMDEyMzQ1Njc4OTo7PD0-P0BBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWltcXV5fYGFiY2Rl'
        + 'ZmdoaWprbG1ub3BxcnN0dXZ3eHl6e3x9fn8') === utility2.stringAscii);
      onEventError();
    },

    base64Encode: function (text) {
      /*
        this function base64 encodes the text in a uri-friendly format
      */
      return global.btoa(text).replace((/\+/g), '-').replace((/\//g), '_')
        .replace((/\=+/g), ''); /**/
    },

    _base64Encode_default_test: function (onEventError) {
      /*
        this function tests base64Encode's default handling behavior
      */
      utility2.assert(utility2.base64Encode('') === '');
      utility2.assert(utility2.base64Encode(utility2.stringAscii) === 'AAECAwQFBgcICQoLDA0ODxAREhM'
        + 'UFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0-P0BBQkNERUZHSElKS0xNTk9QUVJ'
        + 'TVFVWV1hZWltcXV5fYGFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6e3x9fn8');
      onEventError();
    },

    callArg0: function (callback) {
      /*
        this function calls the callback in arg position 0
      */
      callback();
    },

    callArg1: function (_, callback) {
      /*
        this function calls the callback in arg position 1
      */
      callback();
    },

    callArg2: function (_, __, callback) {
      /*
        this function calls the callback in arg position 2
      */
      callback();
    },

    createUtc: function (arg) {
      /*
        this function parses the arg into a date object, assuming UTC timezone
      */
      var time;
      time = arg;
      /* no arg */
      if (!arg) {
        return new Date();
      }
      /* ISO format */
      if ((/^\d\d\d\d\D\d\d\D\d\d(?:\D|$)/).test(time)) {
        time = time.split(/\D/);
        return new Date(time[0] + '-' + time[1] + '-' + time[2] + 'T' + (time[3] || '00')
          + ':' + (time[4] || '00') + ':' + (time[5] || '00') + '.' + (time[6] || '000') + 'Z');
      }
      /* arbitrary format */
      time = new Date(time);
      if (time.getTime()) {
        /* subtract timezone offset to get UTC time */
        time.setMinutes(time.getMinutes() - time.getTimezoneOffset());
      }
      return time;
    },

    _createUtc_default_test: function (onEventError) {
      /*
        this function tests createUtc's default handling behavior
      */
      utility2.assert(utility2.createUtc().toISOString().slice(0, 19)
        === new Date().toISOString().slice(0, 19));
      utility2.assert(utility2.createUtc('oct 10 2010').toISOString().slice(0, 19)
        === '2010-10-10T00:00:00');
      utility2.assert(utility2.createUtc('2010-10-10').toISOString().slice(0, 19)
        === '2010-10-10T00:00:00');
      utility2.assert(utility2.createUtc('2010-10-10 00:00:00').toISOString().slice(0, 19)
        === '2010-10-10T00:00:00');
      utility2.assert(utility2.createUtc('2010-10-10T00:00:00Z').toISOString().slice(0, 19)
        === '2010-10-10T00:00:00');
      onEventError();
    },

    dateAndSalt: function () {
      /*
        this function generates a unique date counter with a random salt
      */
      if (!local._dateAndSaltCounter || local._dateAndSaltCounter >= 9999) {
        local._dateAndSaltCounter = 1000;
      }
      /* timestamp field */
      local._dateAndSaltCounter += 1;
      return (new Date().toISOString().slice(0, 20)
        /* counter field */
        + local._dateAndSaltCounter
        /* random number field */
        + Math.random().toString().slice(2))
        /* bug - phantomjs can only parse dates less than 30 characters long */
        .slice(0, 29);
    },

    _dateAndSalt_default_test: function (onEventError) {
      /*
        this function tests dateAndSalt's default handling behavior
      */
      /* assert each call returns incrementing result */
      utility2.assert(utility2.dateAndSalt(1) < utility2.dateAndSalt(2));
      /* assert call can be converted to date */
      utility2.assert(new Date(utility2.dateAndSalt()).getTime());
      onEventError();
    },

    _debug_print_default_test: function (onEventError) {
      /*
        this function tests debug print's default handling behavior
      */
      utility2.testMock(onEventError, [
        [console, { log: utility2.nop }]
      ], function (onEventError) {
        utility2._zxqjDp('hello world');
        onEventError();
      });
    },

    echo: function (arg) {
      return arg;
    },

    _echo_default_test: function (onEventError) {
      /*
      this function tests echo's default behavior
      */
      utility2.assert(utility2.echo('hello world') === 'hello world');
      onEventError();
    },

    evalFileOnEventError: function (file, onEventError) {
      /*
        this function synchronously evals the file with error handling
      */
      /*jslint stupid: true*/
      utility2.tryCatch(function () {
        utility2.evalOnEventError(file, required.fs.readFileSync(file, 'utf8'), onEventError);
      }, onEventError);
    },

    evalOnEventError: function (file, script, onEventError) {
      /*
        this function evals the script in a try-catch block with error handling
      */
      /*jslint evil: true*/
      utility2.tryCatch(function () {
        onEventError(null, state.isNodejs
          ? required.vm.runInThisContext(script, file)
          : eval(script));
      }, onEventError);
    },

    _evalOnEventError_default_test: function (onEventError) {
      /*
        this function tests evalOnEventError's default handling behavior
      */
      utility2.evalOnEventError('test.js', '"hello world"', function (error, data) {
        utility2.assert(data === 'hello world');
        onEventError();
      });
    },

    _evalOnEventError_syntaxError_test: function (onEventError) {
      /*
        this function tests evalOnEventError's syntax error handling behavior
      */
      utility2.evalOnEventError('error.js', 'syntax error', function (error) {
        utility2.assert(error instanceof Error);
        onEventError();
      });
    },

    fsDirname: function (file) {
      /*
        this function returns the file's parent dir
      */
      return file.replace((/\/[^\/]+\/*$/), '');
    },

    fsExtname: function (file) {
      /*
        this function returns the file's ext name
      */
      var match;
      match = (/\.[^\.]*$/).exec(file);
      return match ? match[0] : '';
    },

    jsonCopy: function (object) {
      /*
        this function deep copies the json object using JSON.parse(JSON.stringify(object))
      */
      return JSON.parse(JSON.stringify(object));
    },

    jsonLog: function (argList) {
      /*
        this function uses JSON.stringify to give a consistent print format across browsers
      */
      console.log(argList.map(function (arg) {
        return typeof arg === 'string' ? arg : utility2.jsonStringifyCircular(arg);
      }).join(', ').replace((/, \n, /g), ',\n'));
    },

    jsonParseOrError: function (data) {
      /*
        this function returns JSON.parse(data) or an error
      */
      try {
        return JSON.parse(data);
      } catch (error) {
        return error;
      }
    },

    _jsonParseOrError_syntaxError_test: function (onEventError) {
      /*
        this function tests jsonParseOrError's syntax error handling behavior
      */
      utility2.assert(utility2.jsonParseOrError('syntax error') instanceof Error);
      onEventError();
    },

    jsonStringifyCircular: function (value, replacer, space) {
      /*
        this function JSON.stringify's the value, ignoring circular references
      */
      return JSON.stringify(local._jsonStringifyCircularRecurse(value, []), replacer, space);
    },

    _jsonStringifyCircular_default_test: function (onEventError) {
      /*
        this function tests jsonStringifyCircular's default handling behavior
      */
      var circular;
      console.assert(utility2.jsonStringifyCircular() === undefined);
      circular = {};
      circular.circular = circular;
      circular = {'aa': [1, circular, 2], 'bb': utility2.nop };
      console.assert(utility2.jsonStringifyCircular(circular) === '{"aa":[1,{},2]}');
      utility2.jsonStringifyCircular('syntax error');
      onEventError();
    },

    _jsonStringifyCircularRecurse: function (value, circularList) {
      /*
        this function recurses the value looking for circular objects
      */
      var result;
      /* return the value if its falsey */
      if (!value) {
        return value;
      }
      /* return undefined if the value is circular */
      if (circularList.indexOf(value) >= 0) {
        return;
      }
      /* return the value if JSON.stringify succeeds */
      utility2.tryCatch(function () {
        result = JSON.stringify(value);
      }, utility2.nop);
      if (result) {
        return value;
      }
      /* fallback code if JSON.stringify fails */
      /* add the value to circularList */
      circularList.push(value);
      /* the value is a function */
      if (typeof value === 'function') {
        return;
      }
      /* the value is an array */
      if (Array.isArray(value)) {
        return value.map(function (element) {
          return local._jsonStringifyCircularRecurse(element, circularList);
        });
      }
      /* the value is an object */
      result = {};
      Object.keys(value).forEach(function (key) {
        result[key] = local._jsonStringifyCircularRecurse(value[key], circularList);
      });
      return result;
    },

    mimeLookup: function (file) {
      /*
        this function returns the file's mime-type
      */
      switch (utility2.fsExtname(file)) {
      case '.css':
        return 'text/css';
      case '.html':
        return 'text/html';
      case '.js':
        return 'application/javascript; charset=utf-8';
      case '.json':
        return 'application/json';
      case '.txt':
        return 'text/plain';
      default:
        return (state.mimeTypesDict && state.mimeTypesDict[file]) || 'application/octet-stream';
      }
    },

    _mimeLookup_default_test: function (onEventError) {
      /*
        this function tests mimeLookup's default handling behavior
      */
      utility2.assert(utility2.mimeLookup('foo.css') === 'text/css');
      utility2.assert(utility2.mimeLookup('foo.html') === 'text/html');
      utility2.assert(utility2.mimeLookup('foo.js') === 'application/javascript; charset=utf-8');
      utility2.assert(utility2.mimeLookup('foo.json') === 'application/json');
      utility2.assert(utility2.mimeLookup('foo.txt') === 'text/plain');
      utility2.assert(utility2.mimeLookup('foo') === 'application/octet-stream');
      onEventError();
    },

    nop: function () {
      /*
        this function runs no operation (nop)
      */
      return;
    },

    _nop_default_test: function (onEventError) {
      /*
        this function tests nop's default handling behavior
      */
      utility2.nop();
      onEventError();
    },

    onEventErrorDefault: function (error, data) {
      /*
        this function gives a default, error and data handling callback.
        if an error is given, it will print the error stack, else it will print the data.
      */
      if (error) {
        if (error !== utility2.errorIgnore) {
          /* debug error */
          state.error = error;
          console.error('\nonEventErrorDefault - error\n'
            + (error.stack || error.message || error)
            + '\n');
        }
      } else if (data !== undefined && data !== '') {
        /* debug data */
        state.data = data;
        console.log('\nonEventErrorDefault - data\n' + String(data) + '\n');
      }
    },

    _onEventErrorDefault_error_test: function (onEventError) {
      /*
        this function tests onEventErrorDefault's error handling behavior
      */
      utility2.testMock(onEventError, [
        [console, { error: utility2.nop }]
      ], function (onEventError) {
        utility2.onEventErrorDefault(new Error());
        onEventError();
      });
    },

    _onEventErrorDefault_default_test: function (onEventError) {
      /*
        this function tests onEventErrorDefault's default handling behavior
      */
      utility2.testMock(onEventError, [
        [console, { log: utility2.nop }]
      ], function (onEventError) {
        utility2.onEventErrorDefault(null, 'hello world');
        onEventError();
      });
    },

    requireModules: function (moduleList) {
      /*
        this function requires the modules in the list,
        and caches them in the global.required object
      */
      moduleList.forEach(function (module) {
        var key;
        key = module.replace((/\W/g), '_');
        utility2.tryCatch(function () {
          required[key] = required[key] || require(module);
        }, function (error) {
          utility2.jsonLog(['requireModules - cannot load module', module]);
        });
      });
    },

    _requireModules_error_test: function (onEventError) {
      /*
        this function tests requireModules's error handling behavior
      */
      utility2.testMock(onEventError, [
        [console, { log: utility2.nop }]
      ], function (onEventError) {
        utility2.requireModules(['invalid module ' + utility2.uuid4()]);
        onEventError();
      });
    },

    serverPortRandom: function () {
      /*
        this function generates a random port number from 32768-65535
      */
      /*jslint bitwise: true*/
      return (Math.random() * 0xffff) | 0x8000;
    },

    stateDefault: function (options, defaults) {
      /*
        this function recursively walks through the defaults object,
        and uses it to set default values for unset leaf nodes in the options object
      */
      Object.keys(defaults || {}).forEach(function (key) {
        var defaults2, options2;
        defaults2 = defaults[key];
        options2 = options[key];
        /* set default value */
        if (options2 === undefined) {
          options[key] = defaults2;
          return;
        }
        /* recurse if options2 and defaults2 are both objects */
        if (defaults2
            && typeof defaults2 === 'object'
            && options2
            && typeof options2 === 'object'
            && !Array.isArray(options2)) {
          local.stateDefault(options2, defaults2);
        }
      });
      return options;
    },

    _stateDefault_default_test: function (onEventError) {
      /*
        this function tests stateDefault's default handling behavior
      */
      var options;
      options = utility2.stateDefault(
        { aa: 1, bb: {}, cc: [] },
        { aa: 2, bb: { cc: 2 }, cc: [1, 2] }
      );
      utility2.assert(options.aa === 1);
      utility2.assert(options.bb.cc === 2);
      utility2.assert(JSON.stringify(options.cc) === '[]');
      onEventError();
    },

    stateOverride: function (state, override, backup, depth) {
      /*
        this function recursively overrides the state object with the override object,
        and optionally saves the original state object to the backup object,
        and optionally accepts the depth recursion limit
      */
      if (!(depth <= 0)) {
        local._stateOverrideRecurse(state, override, backup || {}, depth);
      }
      return state;
    },

    _stateOverrideRecurse: function (state, override, backup, depth) {
      /*
        this function
        1. save the state item to the backup object
        2. set the override item to the state object
        3. recurse the override object
      */
      var state2, override2;
      Object.keys(override).forEach(function (key) {
        state2 = state[key];
        override2 = backup[key] = override[key];
        if (depth <= 1
            /* override2 is not a plain object */
            || !(override2 && typeof override2 === 'object' && !Array.isArray(override2))
            /* state2 is not a plain object */
            || !(state2 && typeof state2 === 'object' && !Array.isArray(state2))) {
          /* 1. save the state item to the backup object */
          backup[key] = state2;
          /* 2. set the override item to the state object */
          state[key] = override2;
          return;
        }
        /* 3. recurse the override object */
        local._stateOverrideRecurse(state2, override2, override2 || {}, depth - 1);
      });
    },

    _stateOverride_default_test: function (onEventError) {
      /*
        this function tests stateOverride's default handling behavior
      */
      var backup, state;
      backup = {};
      /* test override */
      state = utility2.stateOverride(
        { aa: 1, bb: { cc: 2 }, dd: [3, 4], ee: { ff: { gg: 5, hh: 6 } } },
        { aa: 2, bb: { dd: 3 }, dd: [4, 5], ee: { ff: { gg: 6 } } },
        backup,
        2
      );
      utility2.assert(state.aa === 2);
      utility2.assert(state.bb.cc === 2);
      utility2.assert(state.bb.dd === 3);
      utility2.assert(JSON.stringify(state.dd) === '[4,5]');
      utility2.assert(state.ee.ff.gg === 6);
      utility2.assert(state.ee.ff.hh === undefined);
      /* test backup */
      utility2.assert(backup.aa === 1);
      utility2.assert(backup.bb.cc === undefined);
      utility2.assert(backup.bb.dd === undefined);
      utility2.assert(JSON.stringify(backup.dd) === '[3,4]');
      utility2.assert(backup.ee.ff.gg === 5);
      utility2.assert(backup.ee.ff.hh === 6);
      /* test restore */
      utility2.stateOverride(state, backup);
      utility2.assert(state.aa === 1);
      utility2.assert(state.bb.cc === 2);
      utility2.assert(state.bb.dd === undefined);
      utility2.assert(JSON.stringify(state.dd) === '[3,4]');
      utility2.assert(state.ee.ff.gg === 5);
      utility2.assert(state.ee.ff.hh === 6);
      onEventError();
    },

    stringAscii: '\x00\x01\x02\x03\x04\x05\x06\x07\b\t\n\x0b\f\r\x0e\x0f'
      + '\x10\x11\x12\x13\x14\x15\x16\x17\x18\x19\x1a\x1b\x1c\x1d\x1e\x1f'
      + ' !"#$%&\'()*+,-./0123456789:;<=>?'
      + '@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_'
      + '`abcdefghijklmnopqrstuvwxyz{|}~\x7f',

    stringToCamelCase: function (text) {
      /*
        this function converts dashed names to camel case
      */
      return text.replace((/-[a-z]/g), function (match) {
        return match[1].toUpperCase();
      });
    },

    _stringToCamelCase_default_test: function (onEventError) {
      utility2.assert(utility2.stringToCamelCase('') === '');
      utility2.assert(utility2.stringToCamelCase('aa-bb-cc') === 'aaBbCc');
      onEventError();
    },

    templateFormat: function (template, dict) {
      /*
        this function templates the template with the dict
      */
      return template.replace((/\{\{\w+\}\}/g), function (key) {
        var value;
        value = dict[key.slice(2, -2)];
        return typeof value === 'string' ? value : key;
      });
    },

    _templateFormat_default_test: function (onEventError) {
      /*
        this function tests templateFormat's default handling behavior
      */
      utility2.assert(utility2.templateFormat('{{aa}}', { aa: 1 }) === '{{aa}}');
      utility2.assert(utility2.templateFormat('{{aa}}', { aa: 'bb' }) === 'bb');
      onEventError();
    },

    throwError: function () {
      /*
        this function throws a new Error for testing purposes
      */
      throw new Error('throwError');
    },

    _throwError_default_test: function (onEventError) {
      /*
        this function tests throwError's default handling behavior
      */
      utility2.tryCatch(utility2.throwError, function (error) {
        utility2.assert(error instanceof Error);
        onEventError();
      });
    },

    tryCatch: function (callback, onEventError) {
      /*
        this function helps achieve 100% code coverage
      */
      try {
        callback();
      } catch (error) {
        onEventError(error);
      }
    },

    urlDecodeOrError: function (text) {
      /*
        this function returns an error if the text cannot be decoded
      */
      try {
        return decodeURIComponent(text || '');
      } catch (error) {
        return error;
      }
    },

    _urlDecodeOrError_error_test: function (onEventError) {
      /*
        this function tests urlDecodeOrError's error handling behavior
      */
      utility2.assert(utility2.urlDecodeOrError(utility2.stringAscii) instanceof Error);
      onEventError();
    },

    urlPathNormalizeOrError: function (url) {
      /*
        this function normalizes the url or returns an error
      */
      if (url.length <= 4096) {
        url = (/[^#&?]*/).exec(encodeURI(url))[0];
        if (url && url.length <= 256 && !(/\.\/|\.$/).test(url)) {
          return url.replace((/\/\/+/), '/').replace((/\/$/), '');
        }
      }
      return new Error('urlPathNormalizeOrError - invalid url ' + url);
    },

    _urlPathNormalizeOrError_error_test: function (onEventError) {
      /*
        this function tests urlPathNormalizeOrError's error handling behavior
      */
      utility2.assert(utility2.urlPathNormalizeOrError('../') instanceof Error);
      onEventError();
    },

    uuid4: function () {
      /*
        this function returns a uuid4 string of form xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      */
      /*jslint bitwise: true*/
      var id, ii;
      id = '';
      for (ii = 0; ii < 32; ii += 1) {
        switch (ii) {
        case 8:
        case 20:
          id += '-';
          id += (Math.random() * 16 | 0).toString(16);
          break;
        case 12:
          id += '-';
          id += '4';
          break;
        case 16:
          id += '-';
          id += (Math.random() * 4 | 8).toString(16);
          break;
        default:
          id += (Math.random() * 16 | 0).toString(16);
        }
      }
      return id;
    }

  };
  local._init();
}());



(function moduleAjaxShared() {
  /*
    this shared module exports the ajax api
  */
  'use strict';
  var local;
  local = {

    _name: 'utility2.moduleAjaxShared',

    _init: function () {
      utility2.initModule(module, local);
    },

    ajax: function (options, onEventError) {
      /*
        this function runs the ajax request, and auto-concats the response stream into utf8 text
        usage:
        utility2.ajax({
          data: 'hello world',
          type: 'POST',
          url: '/upload/foo.txt'
        }, utility2.onEventErrorDefault);
      */
      /* validate options */
      options = utility2.ajaxValidateOptionsUrl(options, onEventError);
      if (!options) {
        return;
      }
      /* nodejs */
      if (state.isNodejs) {
        utility2.ajaxNodejs(options, onEventError);
        return;
      }
      /* ajax xss via proxy */
      if ((/^https*:/).test(options.url)) {
        options.url = '/proxy/proxy.ajax/' + options.url;
      }
      options.contentType = options.contentType || 'application/octet-stream';
      options.dataType = options.dataType || 'text';
      options.type = options.type || options.method;
      options.xhr = options.xhr || utility2.xhrProgress;
      if (options.params) {
        options.url = utility2.urlParamsParsedJoin({
          params: options.params,
          path: options.url
        });
      }
      /* debug */
      if (options.debugFlag || state.debugFlag) {
        utility2.jsonLog(['ajax - options', options]);
      }
      $.ajax(options).done(function (data) {
        onEventError(null, data);
      }).fail(function (xhr, textStatus, errorMessage) {
        onEventError(new Error(xhr.status + ' ' + textStatus + ' - ' + options.url + '\n'
          + (xhr.responseText || errorMessage)), null);
      });
    },

    _ajax_default_test: function (onEventError) {
      /*
        this function tests ajax's default handling behavior
      */
      utility2.ajax({ debugFlag: true, url: state.localhost + '/test/test.echo' }, onEventError);
    },

    _ajax_nullCase_test: function (onEventError) {
      /*
        this function tests ajax's null case behavior
      */
      utility2.ajax(null, function (error, data) {
        utility2.assert(error instanceof Error
          && data === undefined);
        onEventError();
      });
    },

    ajaxPermuteParams: function (options, onEventError) {
      /*
        this function run multiple ajax requests for multiple params
      */
      var paramsDict, urlParsed;
      /* validate options */
      options = utility2.ajaxValidateOptionsUrl(options, onEventError);
      if (!options) {
        return;
      }
      paramsDict = {};
      urlParsed = (/([^?]*)\?([^#]*)/).exec(options.url);
      urlParsed = urlParsed || [options.url, options.url, ''];
      urlParsed[1] += '?';
      urlParsed[2].split('&').forEach(function (item) {
        var key;
        key = (/^([^=]+)=[^=]+$/).exec(item);
        if (!key) {
          return;
        }
        key = key[1];
        paramsDict[key] = paramsDict[key] || {};
        paramsDict[key][item] = null;
      });
      urlParsed[2] = Object.keys(paramsDict).map(function (key) {
        return Object.keys(paramsDict[key]);
      });
      if (!urlParsed[2].length) {
        urlParsed[2] = [ [''] ];
      }
      utility2.asyncPermute({
        argMatrix: urlParsed[2]
      }, function (error, data, optionsPermute, onEventResult) {
        var optionsUrl;
        switch (optionsPermute.mode) {
        case 'arg':
          optionsUrl = utility2.jsonCopy(options);
          optionsUrl.url = urlParsed[1] + data.join('&');
          utility2.ajax(optionsUrl, function (error, data) {
            /* debug permuted param */
            utility2.jsonLog(['ajaxPermuteParams - fetched', optionsUrl.url0]);
            onEventResult(error, { data: data, options: optionsUrl });
          });
          break;
        default:
          onEventError(error, data, optionsPermute);
        }
      });
    },

    _ajaxPermuteParams_error_test: function (onEventError) {
      /*
        this function tests ajaxPermuteParams's error handling behavior
      */
      utility2.ajaxPermuteParams({
        url: '/test/test.error'
      }, function (error, data, options) {
        utility2.assert(error instanceof Error);
        utility2.assert(options.mode === 'result');
        utility2.assert(options.remaining === 0);
        onEventError();
      });
    },

    _ajaxPermuteParams_multi_test: function (onEventError) {
      /*
        this function tests ajaxPermuteParams's multi-ajax requests behavior
      */
      utility2.ajaxPermuteParams({
        url: '/test/test.echo?aa=1&aa=2&bb=3&bb=4&cc=5#dd=6'
      }, function (error, data, options) {
        utility2.assert((/^GET \/test\/test\.echo\?aa=.&bb=.&cc=. /).test(data.data)
          && options.mode === 'result');
        if (options.remaining === 0) {
          onEventError();
        }
      });
    },

    _ajaxPermuteParams_multiError_test: function (onEventError) {
      /*
        this function tests ajaxPermuteParams's multi error handling behavior
      */
      utility2.ajaxPermuteParams({
        url: '/test/test.error?aa=1&aa=2&bb=3&bb=4&cc=5#dd=6'
      }, function (error, data, options) {
        utility2.assert(error instanceof Error);
        utility2.assert(options.mode === 'result');
        if (options.remaining === 0) {
          onEventError();
        }
      });
    },

    _ajaxPermuteParams_nullCase_test: function (onEventError) {
      /*
        this function tests ajaxPermuteParams's null case handling behavior
      */
      utility2.ajaxPermuteParams(null, function (error, data, options) {
        utility2.assert(error instanceof Error);
        onEventError();
      });
    },

    ajaxMultiUrls: function (options, onEventError) {
      /*
        this function makes multiple ajax requests for multiple urls
        onEventError = function (error, data, optionsPermute) {};
        data = { data: data, options: optionsUrl };
      */
      var remainingList;
      if (!utility2.ajaxValidateOptionsUrlList(options, onEventError)) {
        return;
      }
      remainingList = utility2.jsonCopy(options.urlList);
      utility2.asyncMap({
        argList: options.urlList
      }, function (error, data, optionsPermute, onEventResult) {
        var optionsUrl;
        switch (optionsPermute.mode) {
        case 'arg':
          optionsUrl = utility2.jsonCopy(options);
          optionsUrl.url = data;
          utility2.ajax(optionsUrl, function (error, data) {
            /* debug remainingList */
            remainingList.splice(remainingList.indexOf(optionsUrl.url0), 1);
            utility2.jsonLog(['ajaxMultiUrls - fetched / remaining',
              optionsUrl.url0,
              JSON.stringify(remainingList.slice(0, 2)).replace(']', ',...]')]);
            onEventResult(error, { data: data, options: optionsUrl });
          });
          break;
        default:
          onEventError(error, data, optionsPermute);
        }
      });
    },

    _ajaxMultiUrls_error_test: function (onEventError) {
      /*
        this function tests ajaxMultiUrls's error handling behavior
      */
      utility2.ajaxMultiUrls({
        urlList: ['/test/test.error']
      }, function (error, data, options) {
        utility2.assert(error instanceof Error
          && options.mode === 'result'
          && options.remaining === 0);
        onEventError();
      });
    },

    _ajaxMultiUrls_nullCase_test: function (onEventError) {
      /*
        this function tests ajaxMultiUrls's null case handling behavior
      */
      utility2.ajaxMultiUrls(null, function (error, data, options) {
        utility2.assert(error instanceof Error);
        onEventError();
      });
    },

    ajaxValidateOptionsUrl: function (options, onEventError) {
      if (!(options && typeof options.url === 'string')) {
        onEventError(new Error('ajaxValidateOptionsUrl - invalid options.url '
          + (options && options.url)));
        return;
      }
      options.url0 = options.url0 || options.url;
      if (options.data) {
        options.method = options.type = options.method || options.type || 'POST';
      }
      return options;
    },

    ajaxValidateOptionsUrlList: function (options, onEventError) {
      if (options && Array.isArray(options.urlList) && options.urlList.every(function (url) {
          return typeof url === 'string';
        })) {
        return true;
      }
      onEventError(new Error('ajaxMultiUrls - invalid options.urlList '
        + (options && options.urlList)));
    }

  };
  local._init();
}());



(function moduleCacheShared() {
  /*
    this shared module exports the cache api
  */
  'use strict';
  var local;
  local = {

    _name: 'utility2.moduleCacheShared',

    _init: function () {
      utility2.initModule(module, local);
    },

    Cache: function (options) {
      /*
        this Cache class has lru-like cache behavior,
        but with O(1) average case gets and sets
      */
      if (!(this instanceof local.Cache)) {
        return new local.Cache(options);
      }
      utility2.assert(options.size >= 2, 'size must be greater than or equal to 2');
      this.size = options.size || 256;
      this.clear();
    },

    Cache_prototype_clear: function () {
      /*
        this function clears the cache
      */
      this.cache1 = {};
      this.cache2 = {};
      this.remaining = this.size;
    },

    Cache_prototype_gc: function () {
      /*
        this function garbage-collects an arbitray number of lru items,
        when a counter reaches zero
       */
      if (this.remaining <= 0) {
        this.remaining = this.size;
        if (2 * Object.keys(this.cache2).length > this.size) {
          this.cache1 = this.cache2;
          this.cache2 = {};
        }
      }
      this.remaining -= 1;
    },

    Cache_prototype_getItem: function (key) {
      /*
        this function gets an item from cache with O(1) average case performance
      */
      var value;
      value = this.cache1[key];
      if (value === undefined) {
        return;
      }
      this.cache2[key] = value;
      this.gc();
      return value;
    },

    Cache_prototype_setItem: function (key, value) {
      /*
        this function sets an item to cache with O(1) average case performance
      */
      this.gc();
      this.cache2[key] = this.cache1[key] = value;
    },

    _Cache_default_test: function (onEventError) {
      /*
        this function tests Cache's default handling behavior
      */
      var cache;
      /* coverage - don't use the "new" keyword */
      cache = utility2.Cache({ size: 2 });
      utility2.assert(cache.remaining === 2);
      cache.setItem('aa', 1);
      utility2.assert(cache.remaining === 1);
      utility2.assert(Object.keys(cache.cache1).length === 1);
      utility2.assert(Object.keys(cache.cache2).length === 1);
      cache.setItem('bb', 2);
      utility2.assert(cache.remaining === 0);
      utility2.assert(Object.keys(cache.cache1).length === 2);
      utility2.assert(Object.keys(cache.cache2).length === 2);
      cache.setItem('cc', 3);
      utility2.assert(cache.remaining === 1);
      utility2.assert(Object.keys(cache.cache1).length === 3);
      utility2.assert(Object.keys(cache.cache2).length === 1);
      utility2.assert(cache.getItem('aa'));
      utility2.assert(cache.remaining === 0);
      utility2.assert(Object.keys(cache.cache1).length === 3);
      utility2.assert(Object.keys(cache.cache2).length === 2);
      cache.setItem('dd', 4);
      utility2.assert(cache.remaining === 1);
      utility2.assert(Object.keys(cache.cache1).length === 3);
      utility2.assert(Object.keys(cache.cache2).length === 1);
      cache.setItem('ee', 5);
      utility2.assert(cache.remaining === 0);
      utility2.assert(Object.keys(cache.cache1).length === 4);
      utility2.assert(Object.keys(cache.cache2).length === 2);
      utility2.assert(cache.getItem('bb') === undefined);
      utility2.assert(cache.remaining === 0);
      utility2.assert(Object.keys(cache.cache1).length === 4);
      utility2.assert(Object.keys(cache.cache2).length === 2);
      onEventError();
    }

  };
  local._init();
}());



(function moduleAsyncPermuteShared() {
  /*
    this shared module exports the asyncPermute api
  */
  'use strict';
  var local;
  local = {

    _name: 'utility2.moduleAsyncPermuteShared',

    _init: function () {
      utility2.initModule(module, local);
    },

    asyncMap: function (options, onEventError) {
      options.argMatrix = [ options.argList ];
      utility2.asyncPermute(options, function (error, data, optionsPermute, onEventResult) {
        var ii;
        switch (optionsPermute.mode) {
        case 'arg':
          ii = optionsPermute.stateList[0];
          onEventError(error, data[0], optionsPermute, function (error, data) {
            optionsPermute.resultList = optionsPermute.resultList || [];
            optionsPermute.resultList[ii] = data;
            onEventResult(error, data);
          });
          break;
        default:
          onEventError(error, data, optionsPermute);
        }
      });
    },

    asyncParallel: function (options, onEventError) {
      options.argMatrix = [ options.callbackList ];
      utility2.asyncPermute(options, function (error, data, optionsPermute, onEventResult) {
        switch (optionsPermute.mode) {
        case 'arg':
          data[0](onEventResult);
          break;
        default:
          onEventError(error, data, optionsPermute);
        }
      });
    },

    asyncPermute: function (options, onEventError) {
      /*
        this function asynchronously runs the onEventError callback
        on all possible permutations of the options.argMatrix arg
          onEventError = function (error, data, options, onEventResult)
          options = { mode: <string>, remaining: <integer> }
      */
      /* null case */
      if (!(options
          && options.argMatrix
          && Array.isArray(options.argMatrix)
          && options.argMatrix.length
          && options.argMatrix.every(function (argList) {
            return argList.length;
          }))) {
        options = options || {};
        options.mode = 'result';
        options.remaining = 0;
        onEventError(null, null, options);
        return;
      }
      /* set timeout */
      options._timeout = utility2.timeoutSetTimeout(function (error) {
        options.mode = 'timeout';
        options.remaining = 0;
        onEventError(error, null, options);
      }, options.timeout || state.timeoutDefault, 'asyncPermute');
      /* init options */
      options.remaining = 1;
      options.stateList = [];
      options.argMatrix.forEach(function (argList) {
        options.remaining *= argList.length;
        options.stateList.push(argList.length - 1);
      });
      /* permute */
      local._onEventArg(options, onEventError);
      local._onEventLoop(options, onEventError);
    },

    _onEventArg: function (options, onEventError) {
      var argList, remaining;
      argList = options.stateList.map(function (jj, ii) {
        return options.argMatrix[ii][jj];
      });
      remaining = 1;
      options.mode = 'arg';
      onEventError(null, argList, options, function (error, result) {
        remaining -= 1;
        /* error - test callback run multiple times */
        if (remaining < 0) {
          error = error
            || new Error('asyncPermute - onEventResult called more than once for argList '
              + utility2.jsonStringifyCircular(argList));
        } else {
          options.remaining -= 1;
        }
        if (options.remaining === 0) {
          /* clear timeout */
          clearTimeout(options._timeout);
        }
        options.mode = 'result';
        onEventError(error, result, options);
        options.error = options.error || error;
      });
    },

    _onEventLoop: function (options, onEventError) {
      /*
        this function runs the actual permutation loop
      */
      var ii, jj;
      /* security - run large permutations over several event-loop-cycles to prevent cpu lock */
      state.asyncPermuteBlock = state.asyncPermuteBlock || 0;
      while (state.asyncPermuteBlock > 0) {
        state.asyncPermuteBlock -= 1;
        for (ii = 0; ii < options.stateList.length; ii += 1) {
          if (options.stateList[ii] !== 0) {
            break;
          }
        }
        /* finished all permutations */
        if (ii === options.stateList.length) {
          return;
        }
        options.stateList[ii] -= 1;
        for (jj = 0; jj < ii; jj += 1) {
          options.stateList[jj] = options.argMatrix[jj].length - 1;
        }
        local._onEventArg(options, onEventError);
      }
      /* security - run large permutations over several event-loop-cycles to prevent cpu lock */
      if (state.asyncPermuteBlock <= 0) {
        state.asyncPermuteBlock = 256;
        setTimeout(local._onEventLoop, 0, options, onEventError);
      }
    },

    _asyncPermute_default_test: function (onEventError) {
      /*
        this function tests asyncPermute's default handling behavior
      */
      var onEventError2, options, resultDict;
      options = { argMatrix: [
        [1],
        [1, 2],
        [1, 2, 3],
        [1, 2, 3, 4],
        [1, 2, 3, 4, 5],
        [1, 2, 3, 4, 5, 6]
      ] };
      onEventError2 = function (error, data, options, onEventResult) {
        switch (options.mode) {
        case 'arg':
          (options.isAsync ? setTimeout : utility2.callArg0)(function () {
            onEventResult(null, JSON.stringify(data));
          });
          break;
        default:
          utility2.assert(!error
            && data
            && (/^\[\d,\d,\d,\d\,\d,\d\]$/g).test(data));
          resultDict[data] = null;
          if (options.remaining === 0) {
            utility2.assert(Object.keys(resultDict).length === 2 * 3 * 4 * 5 * 6);
            if (options.isAsync) {
              onEventError();
            }
          }
        }
      };
      /* sync test */
      resultDict = {};
      utility2.asyncPermute(options, onEventError2);
      /* async test */
      resultDict = {};
      options = { argMatrix: options.argMatrix, isAsync: true };
      utility2.asyncPermute(options, onEventError2);
    },

    _asyncPermute_multiError_test: function (onEventError) {
      /*
        this function tests asyncPermute's multi-error handling behavior
      */
      var remaining;
      remaining = 2;
      utility2.asyncPermute({
        argMatrix: [ [1] ],
        timeout: 1
      }, function (error, data, options, onEventResult) {
        switch (options.mode) {
        case 'arg':
          /* call onEventResult multiple times */
          onEventResult();
          onEventResult();
          break;
        default:
          remaining -= 1;
          switch (remaining) {
          case 0:
            utility2.assert(error instanceof Error);
            onEventError();
            break;
          case 1:
            utility2.assert(!error);
            break;
          }
        }
      });
    },

    _asyncPermute_error_test: function (onEventError) {
      /*
        this function tests asyncPermute's error handling behavior
      */
      utility2.asyncPermute({
        argMatrix: [ [1, 2] ],
        timeout: 1
      }, function (error, data, options, onEventResult) {
        switch (options.mode) {
        case 'arg':
          onEventResult(new Error());
          break;
        default:
          utility2.assert(error instanceof Error);
          if (options.remaining === 0) {
            onEventError();
          }
        }
      });
    },

    _asyncPermute_nullCase_test: function (onEventError) {
      /*
        this function tests asyncPermute's null case handling behavior
      */
      utility2.asyncPermute(null, function (error, data, options) {
        switch (options.mode) {
        case 'result':
          utility2.assert(error === null
            && data === null
            && options.mode === 'result'
            && options.remaining === 0);
          onEventError();
          break;
        }
      });
    },

    _asyncPermute_timeout_test: function (onEventError) {
      /*
        this function tests asyncPermute's timeout handling behavior
      */
      utility2.asyncPermute({
        argMatrix: [ [1] ],
        timeout: 1
      }, function (error, data, options, onEventResult) {
        switch (options.mode) {
        case 'arg':
          /* test callback after timeout */
          setTimeout(onEventResult, 1000);
          break;
        case 'timeout':
          utility2.assert(utility2.isTimeoutError(error)
            && options.remaining === 0);
          onEventError();
          break;
        }
      });
    }

  };
  local._init();
}());



(function moduleLintScriptShared() {
  /*
    this shared module exports the css / js lint api
  */
  'use strict';
  var local;
  local = {

    _name: 'utility2.moduleLintScriptShared',

    _init: function () {
      utility2.initModule(module, local);
    },

    _lintCss: function (file, script) {
      /*
        this function lints a css script using csslint
      */
      var error;
      if (required.CSSLint) {
        error = required.CSSLint.getFormatter('text').formatResults(required.CSSLint.verify(
          script || '',
          { ignore: 'ids' }
        ), file, { quiet: true }).trim();
        if (error) {
          console.error('\n_lintCss\n' + error + '\n');
        }
      }
      return script;
    },

    _lintJs: function (file, script) {
      /*
        this function lints a js script using jslint
      */
      var _;
      if (!global.__coverage__ && required.JSLINT && !required.JSLINT(script)) {
        console.error('\n_lintJs\n' + file);
        required.JSLINT.errors.forEach(function (error, ii) {
          _ = '#' + String(ii + 1) + ' ';
          while (_.length < 4) {
            _ = ' ' + _;
          }
          if (error) {
            console.error(_ + error.reason);
            console.error('    ' + (error.evidence || '').trim() + ' \/\/ Line ' + error.line
              + ', Pos ' + error.character);
          }
        });
        console.error();
      }
      return script;
    },

    lintScript: function (file, script) {
      /*
        this function lints css / html / js / json scripts
      */
      switch (utility2.fsExtname(file)) {
      case '.css':
        return local._lintCss(file, script);
      default:
        return local._lintJs(file, script);
      }
    },

    _lintScript_error_test: function (onEventError) {
      /*
        this function tests lintScript's error handling behavior
      */
      utility2.testMock(onEventError, [
        [console, { error: utility2.nop }],
        [global, { __coverage__: null }]
      ], function (onEventError) {
        utility2.lintScript('error.css', 'invalid syntax\n');
        utility2.lintScript('error.js', 'invalid syntax\n');
        onEventError();
      });
    }

  };
  local._init();
}());



(function moduleTestShared() {
  /*
    this shared module exports the test api
  */
  'use strict';
  var local;
  local = {

    _name: 'utility2.moduleTestShared',

    _init: function () {
      utility2.initModule(module, local);
      state.testSuiteList = state.testSuiteList || [];
      state.testSuiteRemaining = state.testSuiteRemaining || 0;
    },

    _setTimeout: setTimeout,

    testMock: function (onEventError, mockList, test) {
      /*
        this function mocks the state given in the mockList while running the test callback
      */
      var onEventError2, throwError;
      onEventError2 = function (error) {
        /* restore state */
        mockList.reverse().forEach(function (mock) {
          utility2.stateOverride(mock[0], mock[2], null, 1);
        });
        if (error) {
          onEventError(error);
        }
      };
      throwError = utility2.throwError;
      /* prepend mandatory mocks */
      mockList = [
        [global, { setInterval: throwError, setTimeout: throwError }],
        [utility2, { exit: throwError, shell: throwError }],
        [global.process || {}, { exit: throwError }]
      ].concat(mockList);
      utility2.tryCatch(function () {
        /* mock state */
        mockList.forEach(function (mock) {
          mock[2] = {};
          utility2.stateOverride(mock[0], mock[1], mock[2], 1);
        });
        /* run test */
        test(onEventError);
        onEventError2();
      }, onEventError2);
    },

    _testMock_error_test: function (onEventError) {
      /* this function tests testMock's error handling behavior */
      utility2.testMock(onEventError, [
        [state, { foo: 1 }]
      ], function (onEventError) {
        utility2.testMock(function (error) {
          utility2.assert(error instanceof Error);
          utility2.assert(state.foo === 1);
          onEventError();
        }, [
          [state, { foo: 2 }]
        ], function () {
          throw new Error();
        });
      });
    },

    testLocal: function (local2) {
      /*
        this function runs tests on the module's local2 object
      */
      var testList, testSuite;
      if (!(state.isTest || local2._isTest)
          || state.isPhantomjs
          || (local2._name.split('.')[0] === 'utility2' && !state.isNpmTestUtility2)) {
        return;
      }
      testList = Object.keys(local2).filter(function (test) {
        return test.slice(-5) === '_test';
      });
      if (!testList.length) {
        return;
      }
      testSuite = {
        failures: 0,
        name: state.javascriptPlatform + '.' + local2._name,
        skipped: 0,
        testCaseList: {},
        tests: 0,
        time: 0
      };
      state.testSuiteList.push(testSuite);
      state.testSuiteRemaining += 1;
      utility2.asyncPermute({ argMatrix: [testList] }, function (error, test, options, onEventResult) {
        switch (options.mode) {
        case 'arg':
          test = testSuite.testCaseList[test] = {
            ended: 0,
            name: testSuite.name + '.' + test,
            onEventResult: function (error) {
              onEventResult(error, test);
            },
            onEventTest: local2[test],
            time: Date.now()
          };
          utility2.tryCatch(function () {
            test.onEventTest(test.onEventResult);
          }, test.onEventResult);
          break;
        case 'timeout':
          options.mode = 'result';
          options.remaining = 0;
          Object.keys(testSuite.testCaseList).forEach(function (test) {
            test = testSuite.testCaseList[test];
            if (!test.ended) {
              test.onEventResult(error, test, options);
            }
          });
          break;
        default:
          if (testSuite.ended || test.timeout) {
            return;
          }
          if (error && error !== 'skip') {
            console.error('\ntestLocal - test failed, ' + test.name);
            utility2.onEventErrorDefault(error);
          }
          test.ended += 1;
          if (test.ended === 1) {
            test.time = Date.now() - test.time;
            testSuite.time = Math.max(test.time, 0);
          }
          /* test skipped */
          if (error === 'skip') {
            testSuite.skipped += 1;
            test.skipped = 'skipped';
          /* test failed */
          } else if (error && !test.failure) {
            test.failure = error.stack || error.message || error;
            testSuite.failures += 1;
          }
          /* testSuite ended */
          if (options.remaining <= 0) {
            /* wait for possible async surprises before finishing testing */
            local._setTimeout.call(global, function () {
              if (!testSuite.ended) {
                testSuite.ended = true;
                state.testSuiteRemaining -= 1;
                if (state.testSuiteRemaining === 0) {
                  state.testSuiteRemaining = 0;
                  utility2.testReport();
                }
              }
            }, 4000);
          }
        }
      });
    },

    testReport: function () {
      /*
        this function creates a test report
      */
      var coverage;
      console.log('\ntestReport');
      state.testReport = state.testReport || { failures: 0, passed: 0, skipped: 0 };
      state.testSuiteList.sort(function (arg1, arg2) {
        arg1 = arg1.name;
        arg2 = arg2.name;
        return arg1 < arg2 ? -1 : arg1 > arg2 ? 1 : 0;
      }).forEach(function (testSuite) {
        state.testReport.failures += testSuite.failures;
        state.testReport.passed += testSuite.passed;
        state.testReport.skipped += testSuite.skipped;
        console.log(('        ' + (testSuite.time || 0)).slice(-8) + ' ms | '
          + testSuite.failures + ' failed | '
          + testSuite.skipped + ' skipped | '
          + (Object.keys(testSuite.testCaseList).length
            - testSuite.failures
            - testSuite.skipped)
          + ' passed in ' + testSuite.name);
      });
      console.log();
      utility2.deferCallback('untilTestReportReady', 'resume');
      if (state.isBrowser) {
        coverage = global.__coverage__;
        /* reset code coverage */
        if (global.__coverage__) {
          global.__coverage__ = {};
        }
        /* upload test report */
        utility2.ajax({
          data: JSON.stringify({ coverage: coverage, testSuiteList: state.testSuiteList }),
          url: '/test/report.upload'
        }, utility2.onEventErrorDefault);
      }
      state.testSuiteList.length = state.npmTestMode ? state.testSuiteList.length : 0;
    }

  };
  local._init();
}());



(function moduleTimeoutShared() {
  /*
    this shared module exports the timeout api
  */
  'use strict';
  var local;
  local = {

    _name: 'utility2.moduleTimeoutShared',

    _init: function () {
      utility2.initModule(module, local);
    },

    clearCallSetInterval: function (key, callback, interval, timeout) {
      /*
        this function
        1. clear interval key
        2. run callback
        3. set interval key to callback
      */
      var dict;
      dict = state.setIntervalDict = state.setIntervalDict || {};
      dict[key] = dict[key] || {};
      /* set timeout */
      if (timeout) {
        timeout = utility2.timeoutSetTimeout(function (error) {
          utility2.clearCallSetInterval(key, 'clear');
          callback(error);
        }, timeout, key);
      }
      /* 1. clear interval key */
      clearInterval(dict[key].interval);
      if (callback === 'clear') {
        /* clear timeout */
        clearTimeout(dict[key].timeout);
        return;
      }
      /* 2. run callback */
      callback();
      /* 3. set interval key to callback */
      dict[key] = {
        interval: setInterval(callback, interval),
        timeout: timeout
      };
    },

    _clearCallSetInterval_timeout_test: function (onEventError) {
      /*
        this function tests clearCallSetInterval's timeout behavior
      */
      var remaining, _test;
      remaining = 0;
      _test = function (key, interval, timeout) {
        remaining += 1;
        utility2.clearCallSetInterval(key, function (timeout) {
          if (timeout) {
            remaining -= 1;
          }
          if (remaining <= 0) {
            onEventError();
          }
        }, interval, timeout);
      };
      _test(utility2.uuid4(), 200, 100);
      _test(utility2.uuid4(), 200, 200);
      _test(utility2.uuid4(), 200, 300);
    },

    isTimeoutError: function (error) {
      return error instanceof Error
        && (error.code === 'ETIMEDOUT');
    },

    timeoutSetTimeout: function (onEventError, timeout, message) {
      /*
        this function sets a timer to throw and handle a timeout error
      */
      var error;
      error = new Error('timeoutSetTimeout - timeout error - ' + timeout + 'ms - ' + message);
      error.code = 'ETIMEDOUT';
      return setTimeout(function () {
        onEventError(error);
      }, timeout);
    }

  };
  local._init();
}());



(function moduleUrlParamsShared() {
  /*
    this shared module exports the urlParams api
  */
  'use strict';
  var local;
  local = {

    _name: 'utility2.moduleUrlParamsShared',

    _init: function () {
      utility2.initModule(module, local);
    },

    urlParamsGetItem: function (url, key, delimiter) {
      /*
        this function gets a param item from the url
      */
      return utility2.urlParamsParse(url, delimiter).params[key] || '';
    },

    _urlParamsGetItem_default_test: function (onEventError) {
      /*
        this function tests urlParamsGetItem's default handling behavior
      */
      utility2.assert(utility2.urlParamsGetItem('/aa#bb=cc%2B', 'bb', '#') === 'cc+');
      onEventError();
    },

    urlParamsParse: function (url, delimiter) {
      /*
        this function parses the url into path / params components
      */
      var key, match, params, regexp, search, value;
      delimiter = delimiter || '?';
      match = url.indexOf(delimiter);
      params = {};
      regexp = (/([^&]+)=([^&]+)/g);
      if (match < 0) {
        return { params: params, path: url };
      }
      search = url.slice(match + 1);
      url = url.slice(0, match + 1);
      while (true) {
        match = regexp.exec(search);
        if (!match) {
          break;
        }
        /* validate key / value */
        key = utility2.urlDecodeOrError(match[1]);
        value = utility2.urlDecodeOrError(match[2]);
        if (!((key instanceof Error) || (value instanceof Error))) {
          params[key] = value;
        }
      }
      return { params: params, path: url };
    },

    urlParamsParsedJoin: function (parsed, delimiter) {
      /*
        this function joins the parsed object's path / params components into a single url
      */
      var path;
      path = parsed.path;
      delimiter = delimiter || '?';
      if (path.indexOf(delimiter) < 0) {
        path += delimiter;
      }
      Object.keys(parsed.params).sort().forEach(function (key, ii) {
        if (typeof parsed.params[key] === 'string') {
          if (ii || path.slice(-1) !== delimiter) {
            path += '&';
          }
          path += encodeURIComponent(key) + '=' + encodeURIComponent(parsed.params[key]);
        }
      });
      return path.replace(delimiter + '&', delimiter);
    },

    urlParamsRemoveItem: function (url, key, delimiter) {
      /*
        this function removes a param from the url
      */
      var parsed;
      parsed = utility2.urlParamsParse(url, delimiter);
      parsed.params[key] = null;
      return utility2.urlParamsParsedJoin(parsed, delimiter);
    },

    _urlParamsRemoveItem_default_test: function (onEventError) {
      /*
        this function tests urlParamsRemoveItem's default handling behavior
      */
      utility2.assert(utility2.urlParamsRemoveItem('/aa#bb=1&cc=2', 'bb', '#') === '/aa#cc=2');
      onEventError();
    },

    urlParamsSetItem: function (url, key, value, delimiter) {
      /*
        this function sets a param to the input url
      */
      var parsed;
      parsed = utility2.urlParamsParse(url, delimiter);
      parsed.params[key] = value;
      return utility2.urlParamsParsedJoin(parsed, delimiter);
    },

    _urlParamsSetItem_default_test: function (onEventError) {
      /*
        this function tests urlParamsSetItem's default handling behavior
      */
      utility2.assert(utility2.urlParamsSetItem('/aa', 'bb', 'cc+', '#')
        === '/aa#bb=cc%2B');
      utility2.assert(utility2.urlParamsSetItem('/aa#bb=1', 'cc', 'dd+', '#')
        === '/aa#bb=1&cc=dd%2B');
      onEventError();
    }

  };
  local._init();
}());



(function moduleAdminBrowser() {
  /*
    this browser module exports the admin api
  */
  'use strict';
  var local;
  local = {

    _name: 'utility2.moduleAdminBrowser',

    _init: function () {
      if (!state.isBrowser) {
        return;
      }
      utility2.initModule(module, local);
    },

    adminEval: function (script, onEventError) {
      /*
        this function remotely evals the javascript code on server
      */
      utility2.ajax({ data: script, dataType: 'json', url: "/admin/admin.eval" }, onEventError);
    },

    _adminEval_default_test: function (onEventError) {
      /*
        this function tests adminEval's default handling behavior
      */
      utility2.adminEval('"hello world"', function (error, data) {
        utility2.assert(data === 'hello world');
        onEventError();
      });
    },

    adminExit: function (options, onEventError) {
      /*
        this function remotely evals the javascript code on server
      */
      utility2.ajax({ params: options, url: "/admin/admin.exit" }, onEventError);
    },

    _adminExit_default_test: function (onEventError) {
      /*
        this function tests adminExit's default handling behavior
      */
      utility2.adminExit({ mock: '1' }, onEventError);
    },

    adminShell: function (script, onEventError) {
      /*
        this function remotely executes shell commands on server
      */
      utility2.ajax({ data: script, url: "/admin/admin.shell" }, onEventError);
    },

    _adminShell_default_test: function (onEventError) {
      /*
        this function tests adminShell's default handling behavior
      */
      utility2.adminShell('echo', onEventError);
    }

  };
  local._init();
}());



(function moduleXhrProgressBrowser() {
  /*
    this browser module exports the xhr progress api
  */
  'use strict';
  var local;
  local = {

    _name: 'utility2.moduleXhrProgressBrowser',

    _init: function () {
      if (!(state.isBrowser && typeof $().modal === 'function')) {
        return;
      }
      utility2.initModule(module, local);
    },

    _initOnce: function () {
      /* exports */
      /* css */
      $(document.head).append('<style>\n'
        + utility2.lintScript('moduleXhrProgressBrowser.css', '#divXhrProgress {\n'
          + 'background-color: #fff;\n'
          + 'border: 2px solid black;\n'
          + 'border-radius: 5px;\n'
          + 'cursor: pointer;\n'
          + 'display: none;\n'
          + 'left: 50%;\n'
          + 'margin: 0px 0px 0px -64px;\n'
          + 'padding: 0px 0px 0px 0px;\n'
          + 'position: fixed;\n'
          + 'top: 49%;\n'
          + 'width: 128px;\n'
          + 'z-index: 99999;\n'
          + '}\n')
        + '#divXhrProgress > .progress {\n'
          + 'background-color: #777;\n'
          + 'margin: 10px;\n'
        + '}\n'
        + '#divXhrProgress > .progress {\n'
          + 'background-color: #777;\n'
          + 'margin: 10px;\n'
        + '}\n'
        + '</style>\n');
      /* init xhr progress container */
      local._divXhrProgress = $('<div id="divXhrProgress">\n'
        + '<div class="active progress progress-striped">\n'
          + '<div class="progress-bar progress-bar-info">loading\n'
        + '</div></div></a>\n');
      $(document.body).append(local._divXhrProgress);
      local._divXhrProgressBar = local._divXhrProgress.find('div.progress-bar');
      /* event handling */
      local._divXhrProgress.on('click', function () {
        while (local._xhrList.length) {
          local._xhrList.pop().abort();
        }
      });
    },

    _xhrProgress_abort_test: function (onEventError) {
      /* this function tests xhrProgress's abort behavior */
      utility2.clearCallSetInterval('_xhrProgress_abort_test', function () {
        /* wait until no ajax io is in progress before initiating test */
        if (!local._xhrList.length) {
          utility2.clearCallSetInterval('_xhrProgress_abort_test', 'clear');
          utility2.ajax({ url: '/test/test.timeout' });
          local._divXhrProgress.click();
          onEventError();
        }
      }, 1000);
    },

    _onEventEnd: function (event) {
      /*
        this function runs event handling for ending the ajax request
      */
      switch (event.type) {
      case 'load':
        local._progressUpdate('100%', 'progress-bar-success', 'success');
        break;
      default:
        local._progressUpdate('100%', 'progress-bar-danger', event.type);
      }
      /* hide progress bar */
      if (!local._xhrList.length) {
        /* allow the final status to be shown for a short time before hiding */
        setTimeout(function () {
          if (!local._xhrList.length) {
            local._divXhrProgress.hide();
          }
        }, 1000);
      }
    },

    _onEventProgress: function () {
      /*
        this function increments progress in an indeterminate manner
      */
      local._progress += 0.25;
      local._progressUpdate(
        100 - 100 / (local._progress) + '%',
        'progress-bar-info',
        'loading'
      );
    },

    _progressUpdate: function (width, type, label) {
      /*
        this function updates the visual progress bar
      */
      if (width) {
        local._divXhrProgressBar.css('width', width);
      }
      if (type) {
        local._divXhrProgressBar[0].className
          = local._divXhrProgressBar[0].className.replace((/progress-bar-\w+/), type); /**/
      }
      if (label) {
        local._divXhrProgressBar.html(label);
      }
    },

    xhrProgress: function () {
      /*
        this function creates a special xhr object with progress event handling
      */
      var xhr;
      xhr = new XMLHttpRequest();
      /* event handling */
      function _onEvent(event) {
        switch (event.type) {
        case 'abort':
        case 'error':
        case 'timeout':
          local._xhrListRemove(xhr);
          local._onEventEnd(event);
          break;
        case 'load':
          local._xhrListRemove(xhr);
          if (local._xhrList.length) {
            local._onEventProgress(event, xhr);
          } else {
            local._onEventEnd(event);
          }
          break;
        case 'progress':
          local._onEventProgress(event, xhr);
          break;
        }
      }
      xhr.addEventListener('abort', _onEvent);
      xhr.addEventListener('error', _onEvent);
      xhr.addEventListener('load', _onEvent);
      xhr.addEventListener('progress', _onEvent);
      /* show progress bar */
      xhr._progressLoaded = 0;
      xhr._progressRatio = 0;
      if (!local._xhrList.length) {
        local._progress = 1;
        local._progressUpdate('0%', 'progress-bar-info', 'loading');
        /* bug - delay displaying progress bar to prevent it from showing 100% width */
        setTimeout(function () {
          if (local._xhrList.length) {
            local._divXhrProgress.show();
          }
        }, 1);
      }
      local._onEventProgress({}, xhr);
      local._xhrList.push(xhr);
      return xhr;
    },

    _xhrList: [],

    _xhrListRemove: function (xhr) {
      /*
        this function removes the xhr from the progress list
      */
      var list, ii;
      list = local._xhrList;
      ii = list.indexOf(xhr);
      if (ii >= 0) {
        list.splice(ii, 1);
      }
    }

  };
  local._init();
}());



(function moduleInitBrowser() {
  /*
    this browser module inits utility2
  */
  'use strict';
  var local;
  local = {

    _name: 'utility2.moduleInitBrowser',

    _init: function () {
      if (!state.isBrowser) {
        return;
      }
      utility2.initModule(module, local);
    },

    _initOnce: function () {
      /* cache element id */
      $('[id]').each(function (ii, target) {
        state[target.id] = state[target.id] || $(target);
      });
      /* override globals */
      utility2.stateOverride(global, utility2.jsonCopy(global.globalOverride || {}));
      /* browser test flag - watch */
      state.isTest = (/\btestWatch=(\d+)\b/).exec(location.hash);
      if (state.isTest) {
        /* increment watch counter */
        location.hash = utility2.urlParamsSetItem(location.hash, 'testWatch',
          (Number(state.isTest[1]) + 1).toString(), '#');
        state.isTest = 'watch';
        /* watch server for changes and reload via sse */
        new global.EventSource('/test/test.watch').addEventListener('message', function () {
          location.reload();
        });
        return;
      }
      /* browser test flag - once */
      state.isTest = (/\btestOnce=/).exec(location.hash);
      if (state.isTest) {
        state.isTest = 'once';
        return;
      }
    }

  };
  local._init();
}());



(function moduleInitNodejs() {
  /*
    this nodejs module inits utility2
  */
  'use strict';
  var local;
  local = {

    _name: 'utility2.moduleInitNodejs',

    _init: function () {
      if (!state.isNodejs) {
        return;
      }
      utility2.initModule(module, local);
    },

    _initOnce: function () {
      /*jslint stupid: true*/
      /* require modules */
      utility2.requireModules([
        /* require internal nodejs modules */
        'child_process', 'crypto',
        'graceful-fs',
        'http', 'https',
        'net',
        'path',
        'repl',
        'stream',
        'tls',
        'url', 'util',
        'vm',
        'zlib',
        /* require external npm modules */
        'connect', 'coveralls',
        'istanbul',
        'phantomjs',
        'sqlite3',
        'uglify-js',
        'utility2-external'
      ]);
      /* require utility2-external.nodejs.txt */
      required.fs.readFileSync(required.utility2_external.__dirname
        + '/public/utility2-external.nodejs.txt', 'utf8')
        .replace((/\n\/\* module start - (.*) \*\/\n([\S\s]*?)\n\/\* module end \*\//g),
          function (_, url, text) {
            /* export mime.types */
            if (url.slice(-11) === '/mime.types') {
              state.mimeTypesDict = {};
              text.replace((/^(\w\S+)\s+(.*)$/gm), function (_, value, keys) {
                keys.split(' ').forEach(function (key) {
                  if (key) {
                    state.mimeTypesDict[key] = value;
                  }
                });
              });
            }
          });
      /* init sqlite3 */
      state.dbSqlite3 = new required.sqlite3.cached.Database(':memory:');
      /* exports */
      global.atob = global.atob || function (text) {
        return new Buffer(text, 'base64').toString();
      };
      global.btoa = global.btoa || function (text) {
        return new Buffer(text).toString('base64');
      };
      /* check for code coverage */
      if (!global.__coverage__) {
        Object.keys(global).forEach(function (key) {
          if ((/^\$\$cov_.*\$\$$/).test(key)) {
            global.__coverage__ = global[key];
          }
        });
      }
      /* init process.argv */
      local._initProcessArgv();
      /* load package.json file */
      state.packageJson = state.packageJson || {};
      utility2.tryCatch(function () {
        state.packageJson = JSON.parse(required.fs.readFileSync(process.cwd()
          + '/package.json'));
      }, utility2.nop);
      /* load default state */
      state.stateDefault = state.packageJson.stateDefault || {};
      utility2.stateDefault(state, utility2.jsonCopy(state.stateDefault));
      /* update dynamic, override state from external url every 5 minutes */
      state.stateOverride = state.stateOverride || {};
      utility2.stateOverride(state.stateOverride,
        JSON.parse(utility2.base64Decode(utility2.stateOverrideBase64 || '') || '{}'));
      utility2.stateOverride(state, utility2.jsonCopy(state.stateOverride || {}));
      state.stateOverrideUrl = state.stateOverrideUrl || '/state/stateOverride.json';
      utility2.deferCallback('untilServerReady', 'defer', function () {
        utility2.clearCallSetInterval('stateOverrideUpdate', function () {
          utility2.ajax({
            dataType: 'json',
            headers: { authorization: 'Basic ' + state.securityBasicAuthSecret },
            url: state.stateOverrideUrl
          }, function (error, data) {
            utility2.nop(error
              ?  utility2.onEventErrorDefault(error)
              : (function () {
                utility2.stateOverride(state.stateOverride, data);
                utility2.stateOverride(state.stateOverride,
                  JSON.parse(utility2.base64Decode(utility2.stateOverrideBase64 || '')
                    || '{}'));
                utility2.stateOverride(state, utility2.jsonCopy(state.stateOverride));
                utility2.jsonLog(['loaded override config from', state.stateOverrideUrl]);
              }()));
          });
        }, 5 * 60 * 1000);
      });
      /* load js files */
      if (state.loadFile) {
        state.loadFile.split(',').forEach(function (file) {
          utility2.evalFileOnEventError(file, utility2.onEventErrorDefault);
        });
      }
      /* stringify file */
      if (state.stringifyFile) {
        required.fs.readFile(state.stringifyFile, 'utf8', function (error, data) {
          console.log(JSON.stringify(data));
        });
      }
      if (state.isTest) {
        utility2.debugAppOnce();
      }
    },

    _initProcessArgv: function () {
      if (!(require.main === module || state.isProcessArgv)) {
        return;
      }
      process.argv.forEach(function (arg, ii, argv) {
        var value;
        arg = arg.split('=');
        value = arg[1] || argv[ii + 1];
        arg = arg[0];
        if ((/^--[a-z]/).test(arg)) {
          /* --no-foo -> state.isFoo = false */
          if ((/^--no-[a-z]/).test(arg)) {
            state[utility2.stringToCamelCase('is' + arg.slice(4))] = false;
          /* --foo bar -> state.isFoo = bar */
          } else if (value && !(/^--[a-z]/).test(value)) {
            state[utility2.stringToCamelCase(arg.slice(2))] = isFinite(Number(value))
              ? Number(value)
              : value;
          /* --foo -> state.isFoo = true */
          } else {
            state[utility2.stringToCamelCase('is' + arg.slice(1))] = true;
          }
        }
      });
    },

    debugAppOnce: function () {
      /*
        this function prints debug info about the current process once
      */
      if (!state.debugAppOnced) {
        state.debugAppOnced = true;
        utility2.jsonLog(['debugAppOnce - process.cwd()', process.cwd()]);
        utility2.jsonLog(['debugAppOnce - process.pid', process.pid]);
        utility2.jsonLog(['debugAppOnce - process.argv', process.argv]);
        utility2.jsonLog(['debugAppOnce - process.env', process.env]);
      }
    },

    shell: function (options) {
      /*
        this function gives a quick and dirty way to execute shell scripts
      */
      var child;
      if (options.verbose !== false) {
        utility2.jsonLog(['shell - options', options]);
      }
      if (typeof options === 'string') {
        options = { script: options };
      }
      options.stdio = options.stdio || ['ignore', 1, 2];
      child = required.child_process.spawn(
        options.argv ? options.argv[0] : '/bin/sh',
        options.argv ? options.argv.slice(1) : ['-c', options.script],
        options
      );
      /* log pid */
      required.fs.writeFile(state.fsDirPid + '/' + child.pid, '', utility2.onEventErrorDefault);
      return child;
    },

    streamReadOnEventError: function (readable, onEventError) {
      /*
        this function concats data from readable stream and passes it to callback when done
      */
      var chunks;
      chunks = [];
      readable.on('data', function (chunk) {
        chunks.push(chunk);
      }).on('error', onEventError).on('end', function () {
        onEventError(null, Buffer.concat(chunks));
      });
    }

  };
  local._init();
}());



(function moduleInitPhantomjs() {
  /*
    this phantomjs module inits utility2
  */
  'use strict';
  var local;
  local = {

    _name: 'utility2.moduleInitPhantomjs',

    _init: function () {
      if (!state.isPhantomjs) {
        return;
      }
      utility2.initModule(module, local);
    },

    _initOnce: function () {
      /* require modules */
      utility2.requireModules(['system', 'webpage', 'webserver']);
      /* state */
      utility2.stateOverride(state, JSON.parse(utility2.base64Decode(required.system.args[2])));
      /* phantomjs server */
      required.webserver.create().listen(state.phantomjsPort, function (request, response) {
        utility2.tryCatch(function () {
          /* debug */
          state.request = request;
          state.response = response;
          state.routerDict[request.url](request, response, JSON.parse(request.post || '{}'));
        }, function (error) {
          console.error(request && request.url);
          local._serverRespondError(request, response, error);
        });
      });
      utility2.jsonLog(['phantomjs - server started on port',
        state.phantomjsPort]);
    },

    'routerDict_/': function (request, response) {
      local._serverRespondData(request, response);
    },

    'routerDict_/eval': function (request, response, data) {
      utility2.evalOnEventError('phantomjsEval.js', data.script, function (error, data) {
        if (error) {
          local._serverRespondError(request, response, error);
          return;
        }
        local._serverRespondData(request,
          response,
          utility2.jsonStringifyCircular(data) || 'null');
      });
    },

    'routerDict_/testUrl': function (request, response, data) {
      var page;
      local._serverRespondData(request, response);
      page = required.webpage.create();
      page.onConsoleMessage = function () {
        console.log.apply(console, arguments);
      };
      page.open(data.url, function (status) {
        utility2.jsonLog(['phantomjs - testUrl', status, data.url]);
      });
      /* page timeout */
      setTimeout(page.close, state.timeoutDefault);
    },

    lintScript: utility2.nop,

    _serverRespondData: function (request, response, data) {
      if (!response.written) {
        response.write(data || null);
        response.written = true;
      }
      if (!response.closed) {
        response.close();
        response.closed = true;
      }
    },

    _serverRespondError: function (request, response, error) {
      ((/\berror=silent\b/).test(request.url)
        ? utility2.nop
        : utility2.onEventErrorDefault)(error);
      response.statusCode = 500;
      local._serverRespondData(request, response);
    }

  };
  local._init();
}());



(function moduleAdminNodejs() {
  /*
    this nodejs module exports the admin api
  */
  'use strict';
  var local;
  local = {

    _name: 'utility2.moduleAdminNodejs',

    _init: function () {
      if (!state.isNodejs) {
        return;
      }
      utility2.initModule(module, local);
    },

    'routerSecurityDict_/admin': function (request, response, next) {
      /*
        this function handles admin security
      */
      if (utility2.securityBasicAuthValidate(request)) {
        next();
        return;
      }
      utility2.serverRespondDefault(response, 303, null, '/signin?redirect='
        + encodeURIComponent(request.url));
    },

    'routerDict_/admin/admin.eval': function (request, response, next) {
      /*
        this function evals the javascript code
      */
      utility2.fsCacheWriteStream(request, null, function (error, tmp) {
        if (error) {
          next(error);
          return;
        }
        required.fs.readFile(tmp, function (error, data) {
          if (error) {
            next(error);
            return;
          }
          utility2.evalOnEventError(tmp, data, function (error, data) {
            if (error) {
              next(error);
              return;
            }
            response.end(utility2.jsonStringifyCircular(data));
          });
        });
      });
    },

    'routerDict_/admin/admin.exit': function (request, response) {
      /*
        this function causes the application to exit
      */
      setTimeout(request.urlParsed.params.mock ? utility2.nop : utility2.exit, 1000);
      response.end();
    },

    'routerDict_/admin/admin.shell': function (request, response, next) {
      /*
        this function runs shell scripts
      */
      utility2.fsCacheWriteStream(request, null, function (error, tmp) {
        if (error) {
          next(error);
          return;
        }
        var child, _onEventData;
        _onEventData = function (chunk) {
          process.stdout.write(chunk);
          response.write(chunk);
        };
        child = required.child_process.spawn('/bin/sh', [tmp])
          .on('close', function (exitCode) {
            response.end('exit code: ' + exitCode);
          })
          .on('error', next);
        child.stderr.on('data', _onEventData);
        child.stdout.on('data', _onEventData);
      });
    }

  };
  local._init();
}());



(function moduleAjaxNodejs() {
  /*
    this nodejs module exports the ajaxNodejs api
  */
  'use strict';
  var local;
  local = {

    _name: 'utility2.moduleAjaxNodejs',

    _init: function () {
      if (!state.isNodejs) {
        return;
      }
      utility2.initModule(module, local);
    },

    ajaxNodejs: function (options, onEventError) {
      /*
        this function implements the ajax function in nodejs
      */
      /* localhost */
      var _onEventError, timeout, urlParsed;
      _onEventError = function (error, data) {
        /* clear timeout */
        clearTimeout(timeout);
        /* debug */
        if (options.debugFlag) {
          utility2.jsonLog(['ajaxNodejs - response',
            options.url,
            options.responseStatusCode,
            options.responseHeaders]);
        }
        onEventError(error, data);
      };
      /* set timeout */
      timeout = utility2.timeoutSetTimeout(_onEventError,
        options.timeout || state.timeoutDefault,
        'ajaxNodejs');
      /* ajax - cached file */
      if (!local._ajaxCache(options, _onEventError)) {
        return;
      }
      /* ajax - file uri scheme */
      if (!local._ajaxFile(options, _onEventError)) {
        return;
      }
      /* ajax - localhost */
      if (!local._ajaxLocalhost(options, _onEventError)) {
        return;
      }
      /* set default options */
      urlParsed = required.url.parse(String(options.proxy || options.url));
      /* assert valid http / https url */
      if (!(/^https*:$/).test(urlParsed.protocol)) {
        _onEventError(new Error('ajaxNodejs - invalid url ' + (options.proxy || options.url)));
        return;
      }
      options.hostname = urlParsed.hostname;
      options.path = options.proxy ? options.url : urlParsed.path;
      options.protocol = urlParsed.protocol || 'http:';
      options.rejectUnauthorized = options.rejectUnauthorized === undefined ? false : undefined;
      if (options.params) {
        options.path = utility2.urlParamsParsedJoin({
          params: options.params,
          path: options.path
        });
      }
      options.port = urlParsed.port;
      /* ajax - socks5 */
      if (!utility2.ajaxSocks5(options, _onEventError)) {
        return;
      }
      local._ajaxRequest(options, _onEventError);
    },

    _ajaxNodejs_cache_test: function (onEventError) {
      /*
        this function tests ajaxNodejs's cache behavior
      */
      var options, url;
      url = '/test/test.echo?' + utility2.uuid4();
      options = { cache: true, url: url };
      utility2.ajax(options, function (error, data) {
        utility2.assert(!error);
        utility2.assert(options.cache === 'cached');
        utility2.ajax(options, function (error, data) {
          utility2.assert(!error);
          utility2.assert(options.cache === 'hit');
          onEventError();
        });
      });
    },

    _ajaxNodejs_fileUriScheme_test: function (onEventError) {
      /*
        this function tests ajaxNodejs's file uri scheme behavior
      */
      utility2.ajax({
        url: 'file://localhost/' + state.fsFileTestHelloJson
      }, function (error, data) {
        onEventError(error || (data !== '"hello world"'));
      });
    },

    _ajaxNodejs_serverResumeError_test: function (onEventError) {
      /*
        this function tests ajaxNodejs's server resume on error behavior
      */
      utility2.deferCallback('untilServerReady', 'resume');
      utility2.deferCallback('untilServerReady', 'error', new Error());
      utility2.ajax({ url: '/test/test.echo' }, function (error) {
        utility2.deferCallback('untilServerReady', 'reset');
        utility2.deferCallback('untilServerReady', 'resume');
        onEventError(error ? null : new Error());
      });
    },

    _ajaxCache: function (options, onEventError) {
      /*
        this function tries to get the data from local cache instead of running the ajax request
      */
      if (!options.cache || options.cache === 'miss') {
        return true;
      }
      options.cacheFile = utility2.createFsCacheFilename(options.cacheDir, options.url0);
      required.fs.readFile(options.cacheFile,
        function (error, data) {
          options.cache = 'miss';
          if (error) {
            utility2.ajaxNodejs(options, onEventError);
            return;
          }
          options.cache = 'hit';
          local._onEventData(options, onEventError, null, data);
        });
      return;
    },

    _ajaxFile: function (options, onEventError) {
      /*
        this function runs the ajax request using the file uri scheme
      */
      if (options.url.slice(0, 7) !== 'file://') {
        return true;
      }
      required.fs.readFile(options.url.replace(/^file:\/\/[^\/]*/, ''),
        options,
        function (error, data) {
          local._onEventData(options, onEventError, error, data);
        });
    },

    _ajaxLocalhost: function (options, onEventError) {
      /*
        this function defers ajax requests to localhost until the server is ready
      */
      if (options.url[0] !== '/') {
        return true;
      }
      utility2.deferCallback('untilServerReady', 'defer', function (error) {
        if (error) {
          onEventError(error);
          return;
        }
        options.url = state.localhost + options.url;
        utility2.ajax(options, onEventError);
      });
    },

    _ajaxRequest: function (options, onEventError) {
      /*
        this function runs the actual ajax request
      */
      var request;
      request = options.protocol === 'https:' ? required.https : required.http;
      /* debug ajaxRequest */
      state.ajaxRequest = request = request.request(options, function (response) {
        /* debug ajaxResponse */
        state.ajaxResponse = response;
        local._onEventResponse(options, onEventError, response);
      }).on('error', onEventError);
      if (options.file) {
        options.readStream = options.readStream || required.fs.createReadStream(options.file);
      }
      if (options.readStream) {
        options.readStream.on('error', onEventError).pipe(request.on('error', onEventError));
      } else {
        request.end(options.data);
      }
      /* debug */
      if (options.debugFlag || state.debugFlag) {
        utility2.jsonLog(['ajaxNodejs - options', options]);
      }
    },

    _onEventData: function (options, onEventError, error, data) {
      /*
        this function handles error / data received by ajax request
      */
      if (error) {
        onEventError(error);
        return;
      }
      if (options.responseStatusCode >= 400) {
        onEventError(new Error((options.method || 'GET') + ' - ' + options.url
          + ' - ' + options.responseStatusCode + ' - ' + data.toString()));
        return;
      }
      /* cache data */
      if (options.cache === 'miss') {
        utility2.fsWriteFileAtomic(options.cacheFile,
          data,
          function (error) {
            options.cache = error ? 'error' : 'cached';
            local._onEventData(options, onEventError, error, data);
          });
        return;
      }
      switch (options.dataType) {
      case 'binary':
        break;
      /* try to JSON.parse the response */
      case 'json':
        data = utility2.jsonParseOrError(data);
        if (data instanceof Error) {
          /* or if parsing fails, pass an error with offending url */
          onEventError(new Error('ajaxNodejs - invalid json data from ' + options.url));
          return;
        }
        break;
      default:
        data = data.toString();
      }
      onEventError(null, data);
    },

    _onEventResponse: function (options, onEventError, response) {
      /*
        this function handles the response object received by ajax request
      */
      var readStream;
      options.responseStatusCode = response.statusCode;
      options.responseHeaders = response.headers;
      if (options.dataType === 'response') {
        onEventError(null, response);
        return;
      }
      if (options.redirect !== false) {
        /* http redirect */
        switch (response.statusCode) {
        case 300:
        case 301:
        case 302:
        case 303:
        case 307:
        case 308:
          options.redirected = options.redirected || 0;
          options.redirected += 1;
          if (options.redirected >= 8) {
            onEventError(new Error('ajaxNodejs - too many http redirects to '
              + response.headers.location));
            return;
          }
          options.url = response.headers.location;
          if (options.url[0] === '/') {
            options.url = options.protocol + '//' + options.hostname + options.url;
          }
          if (response.statusCode === 303) {
            options.data = null;
            options.method = 'GET';
          }
          utility2.ajax(options, onEventError);
          return;
        }
      }
      switch (options.dataType) {
      case 'headers':
        onEventError(null, response.headers);
        return;
      case 'statusCode':
        onEventError(null, response.statusCode);
        return;
      }
      switch (response.headers['content-encoding']) {
      case 'deflate':
        readStream = response.pipe(required.zlib.createInflate());
        break;
      case 'gzip':
        readStream = response.pipe(required.zlib.createGunzip());
        break;
      default:
        readStream = response;
      }
      readStream.on('error', onEventError);
      utility2.streamReadOnEventError(readStream, function (error, data) {
        local._onEventData(options, onEventError, error, data);
      });
    }

  };
  local._init();
}());



(function moduleExitNodejs() {
  /*
    this nodejs module exports the exit api
  */
  'use strict';
  var local;
  local = {

    _name: 'utility2.moduleExitNodejs',

    _init: function () {
      if (!state.isNodejs) {
        return;
      }
      utility2.initModule(module, local);
    },

    _initOnce: function () {
      /* exit on absolute timeout */
      if (state.timeExit) {
        state.timeoutExit = state.timeExit - Date.now();
      }
      /* exit on relative timeout */
      if (state.timeoutExit) {
        state.timeoutExit = Number(state.timeoutExit);
        utility2.assert(isFinite(state.timeoutExit), state.timeoutExit);
        state.timeExit = Date.now() + state.timeoutExit;
        utility2.timeoutSetTimeout(utility2.exit,
          state.timeoutExit,
          'timeoutExit - ' + process.argv.join(' '));
      }
    },

    exit: function (error) {
      /*
        this function performs default error handling and exits the process with an error code
      */
      utility2.deferCallback('onEventExit', 'resume');
      process.exit(isFinite(error) ? error : error && utility2.onEventErrorDefault(error));
    },

    timeoutExitRemaining: function () {
      /*
        this function returns the amount of timeout remaining before utility2.exit
      */
      return state.timeExit - Date.now();
    }

  };
  local._init();
}());



(function moduleFsNodejs() {
  /*
    this nodejs module exports the filesystem api
  */
  'use strict';
  var local;
  local = {

    _name: 'utility2.moduleFsNodejs',

    _init: function () {
      if (!state.isNodejs) {
        return;
      }
      utility2.initModule(module, local);
    },

    _initOnce: function () {
      /*jslint stupid: true*/
      /* create tmp dir */
      state.fsDirTmp = required.path.resolve(state.fsDirTmp || process.cwd() + '/tmp');
      utility2.fsMkdirpSync(state.fsDirTmp);
      /* create cache dir */
      state.fsDirCache = state.fsDirTmp + '/cache';
      utility2.fsMkdirpSync(state.fsDirCache);
      /* create pid dir */
      state.fsDirPid = state.fsDirTmp + '/pid';
      utility2.fsMkdirpSync(state.fsDirPid);
      /* kill old pid's from previous process */
      required.fs.readdirSync(state.fsDirPid).forEach(function (file) {
        try {
          process.kill(file);
        } catch (ignore) {
        }
        required.fs.unlink(state.fsDirPid + '/' + file, utility2.nop);
      });
      /* periodically clean up the cache dir */
      utility2.clearCallSetInterval('_fsCacheCleanup', local._fsCacheCleanup, 5 * 60 * 1000);
    },

    createFsCacheFilename: function (dir, key) {
      /*
        this function creates a temp filename in the cache dir
      */
      return (dir || state.fsDirCache) + '/' + encodeURIComponent(key || utility2.dateAndSalt());
    },

    fsCacheWriteStream: function (readable, options, onEventError) {
      /*
        this function writes data from a readable stream to a unique cache file
      */
      var cache;
      cache = utility2.createFsCacheFilename();
      options = options || {};
      options.flag = 'wx';
      /* write stream */
      readable.on('error', onEventError).pipe(
        /* create cache writable stream */
        required.fs.createWriteStream(cache, options).on('close', function () {
          onEventError(null, cache);
        }).on('error', onEventError)
      );
    },

    fsMkdirp: function (dir, onEventError) {
      /*
        this function creates a dir, along with any missing sub-dirs
      */
      required.fs.mkdir(dir, function (error) {
        if (!error) {
          onEventError();
          return;
        }
        switch (error.code) {
        /* ignore error that dir already exists */
        case 'EEXIST':
          onEventError();
          break;
        case 'ENOENT':
          /* recursively create missing sub-dirs */
          utility2.fsMkdirp(utility2.fsDirname(dir), function (error) {
            if (error) {
              onEventError(error);
              return;
            }
            utility2.fsMkdirp(dir, onEventError, true);
          });
          break;
        default:
          onEventError(error);
        }
      });
    },

    fsMkdirpSync: function (dir) {
      /*jslint stupid: true*/
      try {
        required.fs.mkdirSync(dir);
      } catch (error) {
        switch (error.code) {
        case 'EEXIST':
          break;
        case 'ENOENT':
          utility2.fsMkdirpSync(utility2.fsDirname(dir));
          utility2.fsMkdirpSync(dir);
          break;
        default:
          throw error;
        }
      }
    },

    fsRename: function (file1, file2, onEventError) {
      /*
        this function renames a file, while auto-creating missing dirs
      */
      required.fs.rename(file1, file2, function (error) {
        if (!error) {
          onEventError();
          return;
        }
        /* fallback - retry after creating missing dir */
        if (error.code === 'ENOENT') {
          utility2.fsMkdirp(utility2.fsDirname(file2), function (error) {
            if (error) {
              onEventError(error);
              return;
            }
            /* retry */
            required.fs.rename(file1, file2, onEventError);
          });
          return;
        }
        /* default handling behavior */
        onEventError(error);
      });
    },

    _fsCacheCleanup: function () {
      /*
        this function cleans up the cache dir
      */
      /* remove files from cache dir */
      utility2.jsonLog(['_fsCacheCleanup - cleaning cache dir' + state.fsDirCache]);
      (state.fsDirCacheList || []).forEach(function (file) {
        local._fsRmr(state.fsDirCache + '/' + file);
      });
      /* get list of files to be removed for the next cycle */
      required.fs.readdir(state.fsDirCache, function (error, files) {
        if (error) {
          throw error;
        }
        /* first-time init - remove old cache files */
        if (!state.fsDirCacheList) {
          files.forEach(function (file) {
            local._fsRmr(state.fsDirCache + '/' + file);
          });
          state.fsDirCacheList = [];
          return;
        }
        state.fsDirCacheList = files;
      });
    },

    _fsRmr: function (dir) {
      /*
        this function recursively removes the dir
      */
      var onEventError;
      onEventError = utility2.onEventErrorDefault;
      required.fs.unlink(dir, function (error) {
        if (!error || error.code === 'ENOENT') {
          return;
        }
        required.fs.readdir(dir, function (error, fileList) {
          if (error) {
            onEventError(error);
            return;
          }
          utility2.asyncPermute([fileList], function (error,
            data,
            options,
            onEventResult) {
            switch (options.mode) {
            case 'arg':
              local._fsRmr(dir + '/' + data, onEventResult);
              break;
            default:
              if (error) {
                onEventError(error);
              } else if (options.remaining === 0) {
                /* rmdir */
                required.fs.rmdir(dir, onEventError);
              }
            }
          });
        });
      });
    },

    fsRmrAtomic: function (dir, onEventError) {
      /*
        this function atomically removes the dir,
        by first renaming it to the cache dir, where it will later be removed
      */
      utility2.fsRename(dir,
        utility2.createFsCacheFilename(null, dir) + '.' + utility2.uuid4() + '.fsRmrAtomic',
        function (error) {
          onEventError(error && error.code === 'ENOENT' ? null : error);
        });
    },

    _fsRmrAtomic_default_test: function (onEventError) {
      /*
        this function tests fsRmrAtomic's default handling behavior
      */
      var file = utility2.createFsCacheFilename();
      required.fs.writeFile(file, 'hello world', function (error) {
        utility2.assert(!error);
        utility2.fsRmrAtomic(file, function (error) {
          utility2.assert(!error);
          required.fs.exists(file, function (exists) {
            utility2.assert(!exists);
            onEventError();
          });
        });
      });
    },

    _fsRmrAtomic_error_test: function (onEventError) {
      /*
        this function tests fsRmrAtomic's error handling behavior
      */
      var file = utility2.createFsCacheFilename();
      /* remove non-existent file */
      utility2.fsRmrAtomic(file, function (error) {
        utility2.assert(!error);
        required.fs.exists(file, function (exists) {
          utility2.assert(!exists);
          onEventError();
        });
      });
    },

    fsWatch: function (file) {
      /*
        this function watches a file and runs specified actions if it is modified.
        usage:
        fsWatch({ action: ['lint', 'eval'], name: 'foo.js' });
      */
      var file2, _onEventChange;
      file2 = file;
      _onEventChange = function (stat2, stat1, mode) {
        /* execute following code only if modified timestamp has changed */
        if (stat2.mtime < stat1.mtime) {
          return;
        }
        required.fs.readFile(file.name, 'utf8', function (error, content) {
          var content2;
          if (error) {
            utility2.onEventErrorDefault(error);
            return;
          }
          /* bump up timestamp */
          state.timestamp = new Date().toISOString();
          /* test watch */
          state.testWatchList = state.testWatchList || [];
          state.testWatchList.forEach(function (response) {
            response.write('data:\n\n');
          });
          /* comment out shebang for executable scripts */
          content2 = content.replace(/^#/, '//#');
          /* code coverage instrumentation */
          content2 = utility2.instrumentScript(file.name, content2);
          /* run action */
          (file.action || []).forEach(function (action) {
            switch (action) {
            /* eval the file in global context */
            case 'eval':
              if (mode !== 'noEval') {
                console.log('\n>\n>\n>\n> fsWatch - eval, ' + file.name + '\n');
                utility2.evalOnEventError(file.name, content2, utility2.onEventErrorDefault);
              }
              break;
            /* css / js lint file - csslint / jslint npm module must be installed */
            case 'lint':
              utility2.lintScript(file.name, content2);
              break;
            default:
              /* action is a function call */
              action(file.name, content, content2);
            }
          });
        });
      };
      file.name = required.path.resolve(file.name);
      state.fsWatchDict = state.fsWatchDict || {};
      file = state.fsWatchDict[file.name] = state.fsWatchDict[file.name] || file2;
      /* first-time watch */
      if (file === file2) {
        /* watch file in 1000 ms intervals */
        required.fs.watchFile(file.name, { interval: 1000, persistent: false }, _onEventChange);
      } else {
        ['action'].forEach(function (key) {
          if (!file2[key]) {
            return;
          }
          file[key] = file[key] || [];
          file2[key].forEach(function (action) {
            if (file[key].indexOf(action) < 0) {
              file[key].push(action);
            }
          });
        });
      }
      /* import file */
      _onEventChange({ mtime: 2}, { mtime: 1}, 'noEval');
    },

    fsWriteFileAtomic: function (file, data, onEventError) {
      /*
        this function atomically writes data to a file,
        by first writing to a unique cache file, and then renaming it,
        while auto-creating missing dirs
      */
      var cache;
      cache = utility2.createFsCacheFilename();
      /* write data */
      required.fs.writeFile(cache, data, function (error) {
        if (!error) {
          utility2.fsRename(cache, file, onEventError);
          return;
        }
        /* fallback - retry after creating missing dir */
        if (error.code === 'ENOENT') {
          utility2.fsMkdirp(utility2.fsDirname(file), function (error) {
            if (error) {
              onEventError(error);
              return;
            }
            /* retry */
            required.fs.writeFile(cache, data, onEventError);
          });
          return;
        }
        /* default error handling behavior */
        onEventError(error);
      });
    }

  };
  local._init();
}());



(function moduleInstrumentScriptNodejs() {
  /*
    this nodejs module instrumentScript api
  */
  'use strict';
  var local;
  local = {

    _name: 'utility2.moduleInstrumentScriptNodejs',

    _init: function () {
      if (!state.isNodejs) {
        return;
      }
      utility2.initModule(module, local);
      /* init istanbul instrumenter */
      local._instrumenter = required.istanbul && new required.istanbul.Instrumenter();
    },

    instrumentScript: function (file, script) {
      /*
        this file instruments a script using the istanbul npm module
      */
      /*jslint stupid: true*/
      return (local._instrumenter
          && utility2.fsExtname(file) === '.js'
          && global.__coverage__
          && (required.path.basename(file) !== 'utility2.js' || state.isNpmTestUtility2))
        ? local._instrumenter.instrumentSync(script, file)
        : script;
    }

  };
  local._init();
}());



(function modulePhantomjsNodejs() {
  /*
    this nodejs module exports the phantomjs ajax / phantomjs test server api
  */
  'use strict';
  var local;
  local = {

    _name: 'utility2.modulePhantomjsNodejs',

    _init: function () {
      if (!state.isNodejs) {
        return;
      }
      utility2.deferCallback('untilServerReady', 'defer', function (error) {
        utility2.nop(error
          ? utility2.onEventErrorDefault(error)
          : utility2.initModule(module, local));
      });
    },

    _initOnce: function () {
      utility2.restartPhantomjsServer();
    },

    _initTest: function () {
      utility2.deferCallback('untilPhantomjsServerReady', 'defer', function (error) {
        if (!error) {
          utility2.testLocal(local);
        }
      });
    },

    _phantomjsAjax: function (options, onEventError) {
      /*
        this function makes ajax request to the phantomjs test server
      */
      utility2.deferCallback('untilPhantomjsServerReady', 'defer', function (error) {
        if (error) {
          onEventError(error);
          return;
        }
        /* bug - headers are case-sensitive in phantomjs */
        options.headers = { 'Content-Length': Buffer.byteLength(options.data || '') };
        options.url = 'http://localhost:' + state.phantomjsPort + options.url;
        utility2.ajax(options, onEventError);
      });
    },

    __phantomjsAjax_error_test: function (onEventError) {
      /*
        this function tests _phantomjsAjax's error handling behavior
      */
      local._phantomjsAjax({ url: '/invalid?error=silent' }, function (error) {
        utility2.assert(error instanceof Error);
        onEventError();
      });
    },

    phantomjsEval: function (script, onEventError) {
      /*
        this function sends a url to phantomjs server for testing
      */
      local._phantomjsAjax({
        data: JSON.stringify({ script: script }),
        dataType: 'json',
        url: '/eval'
      }, onEventError);
    },

    _phantomjsEval_error_test: function (onEventError) {
      /*
        this function tests phantomjsEval's error handling behavior
      */
      utility2.phantomjsEval('syntax error', function (error) {
        utility2.assert(error instanceof Error);
        onEventError();
      });
    },

    restartPhantomjsServer: function (file) {
      /*
        this function spawns a phantomjs test server
      */
      file = file || utility2.__filename;
      utility2.deferCallback('untilPhantomjsServerReady', 'reset');
      state.phantomjsPort = utility2.serverPortRandom();
      /* instrument utility2.js */
      if (global.__coverage__ && file === utility2.__filename) {
        required.fs.readFile(file, 'utf8', function (error, content) {
          content = utility2.instrumentScript(file, content);
          file = utility2.createFsCacheFilename() + '.js';
          utility2.fsWriteFileAtomic(file, content, function (error) {
            utility2.onEventErrorDefault(error);
            utility2.restartPhantomjsServer(file);
          });
        });
        return;
      }
      /* check every second to see if phantomjs spawn is ready */
      utility2.clearCallSetInterval('untilPhantomjsServerReady', function (timeout) {
        /* timeout error */
        if (timeout) {
          utility2.deferCallback('untilPhantomjsServerReady', 'error', timeout);
          return;
        }
        utility2.ajax({
          url: 'http://localhost:' + state.phantomjsPort + '/'
        }, function (error) {
          if (!error) {
            utility2.deferCallback('untilPhantomjsServerReady', 'resume');
            utility2.clearCallSetInterval('untilPhantomjsServerReady', 'clear');
          }
        });
      }, 1000, state.timeoutDefault);
      /* kill old phantomjs process */
      utility2.tryCatch(function () {
        process.kill(state.phantomjsPid || 99999999);
      }, utility2.nop);
      /* spawn phantomjs process */
      state.phantomjsPid = utility2.shell(required.phantomjs.path + ' '
        + file + ' --state-override-base64 ' + utility2.base64Encode(JSON.stringify({
          fsDirCache: state.fsDirCache,
          isNpmTestUtility2: state.isNpmTestUtility2,
          localhost: state.localhost,
          phantomjsPort: state.phantomjsPort,
          serverPort: state.serverPort,
          timeoutDefault: state.timeoutDefault
        })))
        .on('close', function (exitCode) {
          /* error handling */
          if (exitCode) {
            utility2.deferCallback('untilPhantomjsServerReady', 'error', new Error(exitCode));
            utility2.clearCallSetInterval('untilPhantomjsServerReady', 'clear');
          }
        }).pid;
      /* phantomjs code coverage */
      if (state.isNpmTestUtility2) {
        setTimeout(function () {
          utility2.phantomjsEval('global.__coverage__ || null', function (error, data) {
            utility2.nop(error
              ? utility2.onEventErrorDefault(error)
              : utility2.coverageExtend(global.__coverage__, data));
          });
        }, utility2.timeoutExitRemaining() - 1000);
      }
    },

    phantomjsTestUrl: function (url, onEventError) {
      /*
        this function sends a url to phantomjs server for testing
      */
      local._phantomjsAjax({
        data: JSON.stringify({ url: state.localhost + url }),
        url: '/testUrl'
      }, onEventError);
    },

    _phantomjsTestUrl_testOnce_test: function (onEventError) {
      /*
        this function tests phantomjsTestUrl's testOnce behavior
      */
      utility2.phantomjsTestUrl('/test/test.html#testOnce=1', onEventError);
    },

    _phantomjsTestUrl_testWatch_test: function (onEventError) {
      /*
        this function tests phantomjsTestUrl's testWatch behavior
      */
      utility2.nop(state.npmTestMode
        ? utility2.phantomjsTestUrl('/test/test.html#testWatch=1', onEventError)
        : onEventError('skip'));
    }

  };
  local._init();
}());



(function moduleReplNodejs() {
  /*
    this nodejs module starts up an interactive console debugger
  */
  'use strict';
  var local;
  local = {

    _name: 'utility2.moduleReplNodejs',

    _init: function () {
      if (!state.isNodejs) {
        return;
      }
      utility2.initModule(module, local);
    },

    _initOnce: function () {
      /* start interactive interpreter / debugger */
      if (state.isRepl === true && !state.repl) {
        state.repl = required.repl.start({
          eval: function (script, context, file, onEventError) {
            utility2.evalOnEventError('<repl>', local._parse(script), onEventError);
          },
          useGlobal: true
        });
      }
    },

    _initTest: function () {
      if (state.repl) {
        utility2.testLocal(local);
      }
    },

    _parse: function (script) {
      /*
        this function parses repl stdin
      */
      /* optimization - cached callback */
      var arg1, arg2;
      /* null -> "(null\n)" */
      if (!/^\(.*\n\)$/.test(script)) {
        return script;
      }
      script = script.slice(1, -2);
      /* @@ syntax sugar */
      while (/\w@@ /.test(script)) {
        script = script.replace(/(\w)@@ ([\S\s]*)/, '$1($2)');
      }
      arg1 = script.split(' ');
      arg2 = arg1.slice(1).join(' ');
      arg1 = arg1[0];
      switch (arg1) {
      /* eval in phantomjs */
      case 'ajaxDebug':
        utility2.ajax({ debugFlag: true, redirect: false, url: arg2 },
          utility2.onEventErrorDefault);
        return;
      case 'ajaxCache':
        utility2.ajax({ cache: true, url: arg2 }, utility2.onEventErrorDefault);
        return;
      case 'ajax':
        utility2.ajax({ url: arg2 }, utility2.onEventErrorDefault);
        return;
      case 'browser':
        utility2.phantomjsEval(arg2, utility2.onEventErrorDefault);
        return;
      /* git commands */
      case 'git':
        switch (arg2) {
        case 'diff':
          arg2 = '--no-pager diff';
          break;
        case 'log':
          arg2 = 'log | head -n 18';
          break;
        }
        utility2.shell({ script: 'git ' + arg2, verbose: false });
        return;
      case 'grep':
        utility2.shell({ script: 'find . -type f | grep -v '
          + '"/\\.\\|.*\\b\\(\\.\\d\\|archive\\|artifacts\\|bower_components\\|build'
          + '\\|coverage\\|docs\\|external\\|git_modules\\|jquery\\|log\\|logs\\|min'
          + '\\|node_modules\\|rollup.*\\|swp\\|test\\|tmp\\)\\b" '
          + '| tr "\\n" "\\000" | xargs -0 grep -in ' + JSON.stringify(arg2), verbose: false });
        return;
      /* print stringified object */
      case 'print':
        script = 'console.log(String(' + arg2 + '))';
        break;
      /* sqlite3 commands */
      case 'sql':
        if (arg2 === '_') {
          console.log(state.dbSqlite3Result);
        } else {
          state.dbSqlite3.all(arg2, function (error, rows) {
            if (rows) {
              state.dbSqlite3Result = rows;
            }
            console.log(error || rows);
          });
        }
        return;
      /* execute /bin/sh script in console */
      case '$':
        utility2.shell({ script: arg2, verbose: false });
        return;
      }
      return '(' + script + '\n)';
    },

    _parse_default_test: function (onEventError) {
      /*
        this function tests parse's default handling behavior
      */
      utility2.testMock(onEventError, [
        [utility2, { ajax: utility2.nop, phantomjsEval: utility2.nop, shell: utility2.nop }],
        [console, { log: utility2.nop }],
        [state, { dbSqlite3: { all: function (_, onEventError) {
          onEventError(null, true);
        } } }]
      ], function (onEventError) {
        /*jslint evil: true*/
        state.repl.eval(null, null, null, utility2.nop);
        state.repl.eval('($ ls\n)', null, null, utility2.nop);
        state.repl.eval('(ajax /test/test.echo\n)', null, null, utility2.nop);
        state.repl.eval('(ajaxDebug /test/test.echo\n)', null, null, utility2.nop);
        state.repl.eval('(ajaxCache /test/test.echo\n)', null, null, utility2.nop);
        state.repl.eval('(console.log@@ "hello world"\n)', null, null, utility2.nop);
        state.repl.eval('(browser state\n)', null, null, utility2.nop);
        state.repl.eval('(git diff\n)', null, null, utility2.nop);
        state.repl.eval('(git log\n)', null, null, utility2.nop);
        state.repl.eval('(grep zxqj\n)', null, null, utility2.nop);
        state.repl.eval('(print true\n)', null, null, utility2.nop);
        state.repl.eval('(sql _\n)', null, null, utility2.nop);
        state.repl.eval('(sql SELECT * from myTable\n)', null, null, utility2.nop);
        state.repl.eval('(syntax error\n)', null, null, utility2.nop);
        onEventError();
      });
    }

  };
  local._init();
}());



(function moduleRollupNodejs() {
  /*
    this nodejs module exports the rollup api
  */
  'use strict';
  var local;
  local = {

    _name: 'utility2.moduleRollupNodejs',

    _init: function () {
      if (!state.isNodejs) {
        return;
      }
      utility2.initModule(module, local);
    },

    _initOnce: function () {
      if (require.main === module) {
        utility2.minifyFileCommandLine();
        utility2.rollupFileCommandLine();
      }
    },

    rollupFileCommandLine: function () {
      /*
        this function rollup files given by the command-line
      */
      if (!state.rollup) {
        return;
      }
      utility2.asyncMap({
        argList: state.rollup.split(',')
      }, function (error, data, optionsPermute, onEventResult) {
        switch (optionsPermute.mode) {
        case 'arg':
          local._rollupFile(data, onEventResult);
          break;
        default:
          if (error || optionsPermute.remaining === 0) {
            utility2.exit(error);
          }
        }
      });
    },

    _rollupFile: function (file, onEventError) {
      /*
        this function rolls up a css / js file
      */
      var content, onEventError2, options;
      utility2.jsonLog(['_rollupFile - rolling up file', file]);
      onEventError2 = function (error, data, optionsPermute) {
        if (optionsPermute.error) {
          return;
        }
        if (error) {
          onEventError(error);
          optionsPermute.error = optionsPermute.error || error;
          return;
        }
        /* additional css parsing */
        if (utility2.fsExtname(file) === '.css' && !data.cssParsed) {
          optionsPermute.remaining += 1;
          local._rollupFileCss(data, function (error, data) {
            data = data || {};
            data.cssParsed = true;
            optionsPermute.remaining -= 1;
            onEventError2(error, data, optionsPermute);
          });
          return;
        }
        /* finished ajax requests */
        if (optionsPermute.remaining !== 0) {
          return;
        }
        /* concat text to content */
        options.urlList.forEach(function (url, ii) {
          content += '\n\n/* module start - ' + url + ' */\n'
            + optionsPermute.resultList[ii].data.trim()
            + '\n/* module end */';
        });
        /* post processing */
        if (options.postProcessing) {
          content = options.postProcessing(content);
        }
        /* remove trailing whitespace */
        content = content.replace((/[\t\r ]+$/gm), '').trim() + '\n';
        /* write to file */
        utility2.fsWriteFileAtomic(file, content, function (error) {
          if (error) {
            onEventError(error);
            return;
          }
          local._minifyFile(file, null, onEventError);
        });
      };
      required.fs.readFile(file, 'utf8', function (error, __) {
        content = (/[\S\s]+?\n\}\(\)\);\n/).exec(__);
        content = utility2.lintScript(file + '.js', content && content[0].trim());
        utility2.evalOnEventError(file, content, function (error, __) {
          if (error) {
            onEventError2(error);
            return;
          }
          options = __;
          utility2.ajaxMultiUrls(options, onEventError2);
        });
      });
    },

    minifyFileCommandLine: function () {
      /*
        this function minify files given by the command-line
      */
      if (!state.minify) {
        return;
      }
      utility2.asyncMap({
        argList: state.minify.split(',')
      }, function (error, data, optionsPermute, onEventResult) {
        switch (optionsPermute.mode) {
        case 'arg':
          local._minifyFile(data, null, onEventResult);
          break;
        default:
          if (error || optionsPermute.remaining === 0) {
            utility2.exit(error);
          }
        }
      });
    },

    _minifyFile: function (file, content, onEventError) {
      var file2, minified;
      if (content === null) {
        required.fs.readFile(file, 'utf8', function (error, content) {
          if (error) {
            onEventError(error);
            return;
          }
          utility2.tryCatch(function () {
            local._minifyFile(file, content, onEventError);
          }, onEventError);
        });
        return;
      }
      switch (utility2.fsExtname(file)) {
      case '.css':
        file2 = file.slice(0, -4) + '.min.css';
        minified = { code: required.cssmin(content) };
        break;
      case '.js':
        file2 = file.slice(0, -3) + '.min.js';
        minified = required.uglify_js.minify(content,
          { fromString: true, outSourceMap: file2 + '.map', output: { ascii_only: true } });
        break;
      }
      utility2.asyncParallel({
        callbackList: [
          function (onEventError) {
            if (minified && minified.code) {
              utility2.fsWriteFileAtomic(file2,
                '//@ sourceMappingURL=' + required.path.basename(file2) + '.map\n'
                  + minified.code,
                onEventError);
            } else {
              onEventError();
            }
          },
          function (onEventError) {
            if (minified && minified.map) {
              utility2.fsWriteFileAtomic(file2 + '.map', minified.map, onEventError);
            } else {
              onEventError();
            }
          }
        ]
      }, function (error, data, optionsPermute) {
        if (!optionsPermute.error && (error || optionsPermute.remaining === 0)) {
          onEventError(error);
        }
      });
    },

    __rollupFile_cssRollup_test: function (onEventError) {
      /*
        this function tests _rollupFile's css rollup behavior
      */
      var file = state.fsDirCache + '/test.rollup.css';
      utility2.fsWriteFileAtomic(file, '(function () {\n'
        + '    "use strict";\n'
        + '    return { urlList: ["/test/test.css", "' + state.localhost + '/test/test.css"] };\n'
        + '}());\n', function () {
          local._rollupFile(file, onEventError);
        });
    },

    __rollupFile_jsRollup_test: function (onEventError) {
      /*
        this function tests _rollupFile's js rollup behavior
      */
      var file = state.fsDirCache + '/test.rollup.js';
      utility2.fsWriteFileAtomic(file, '(function () {\n'
        + '    "use strict";\n'
        + '    return { urlList: ["/test/test.js", "' + state.localhost + '/test/test.js"] };\n'
        + '}());\n', function () {
          local._rollupFile(file, onEventError);
        });
    },

    _rollupFileCss: function (data, onEventError) {
      /*
        this function runs additional rollup steps for css scripts
      */
      var dataUriDict;
      dataUriDict = {};
      data.data.replace((/\burl\(([^)]+)\)/g), function (match, url) {
        url = required.path.resolve('/' + utility2.fsDirname(data.options.url0) + '/'
          + url.replace((/["']/g), '')).replace((/^\/(https*:\/)/), '$1/');
        dataUriDict[url] = dataUriDict[url] || {};
        dataUriDict[url][match] = null;
      });
      utility2.ajaxMultiUrls({
        cache: true,
        cacheDir: state.fsDirTmp + '/rollup',
        dataType: 'binary',
        urlList: Object.keys(dataUriDict)
      }, function (error, data2, optionsPermute) {
        if (optionsPermute.error) {
          return;
        }
        if (error) {
          onEventError(error);
          return;
        }
        Object.keys(dataUriDict[data2
          && data2.options
          && data2.options.url0]
          || []).forEach(function (match) {
          data.data = data.data.replace(new RegExp(match.replace((/(\W)/g), '\\$1'), 'g'),
            'url(\n"data:' + utility2.mimeLookup(data2.options.url0) + ';base64,'
              + data2.data.toString('base64') + '"\n)');
        });
        /* finished ajax requests */
        if (optionsPermute.remaining === 0) {
          onEventError(null, data);
        }
      });
    }

  };
  local._init();
}());



(function moduleServerNodejs() {
  /*
    this nodejs module exports the server middleware api
  */
  'use strict';
  var local;
  local = {

    _name: 'utility2.moduleServerNodejs',

    _init: function () {
      if (!state.isNodejs) {
        return;
      }
      utility2.initModule(module, local);
    },

    _initOnce: function () {
      /* security - basic auth */
      state.securityBasicAuthSecret = state.securityBasicAuthSecret
        || Math.random().toString(36).slice(2);
      /* 1. middleware logging */
      state.middlewareLogging = state.middlewareLogging
        || local._createMiddleware(state.routerLoggingDict);
      state.middlewareLoggingDefault = state.middlewareLoggingDefault
        || required.connect.logger('dev');
      /* 2. middleware security */
      state.middlewareSecurity = state.middlewareSecurity
        || local._createMiddleware(state.routerSecurityDict);
      /* 3. middleware proxy */
      state.middlewareProxy = state.middlewareProxy
        || local._createMiddleware(state.routerProxyDict);
      /* 4. middleware backend */
      state.middleware = state.middleware || local._createMiddleware(state.routerDict);
      /* 5. middleware file */
      state.middlewareFile = state.middlewareFile
        || local._createMiddleware(state.routerFileDict);
      /* 6. middleware test */
      state.routerTestDict = state.routerTestDict || {};
      state.middlewareTest = state.middlewareTest
        || local._createMiddleware(state.routerTestDict);
      /* start server */
      utility2.serverStart();
    },

    'routerLoggingDict_/': function (request, response, next) {
      /*
        this function handles default logging
      */
      state.middlewareLoggingDefault(request, response, next);
    },

    'routerLoggingDict_/favicon.ico': function (request, response, next) {
      next();
    },

    'routerSecurityDict_/': function (request, response, next) {
      /*
        this function handles default security
      */
      /* security - https redirect */
      if (utility2.securityHttpsRedirect(request, response)) {
        return;
      }
      /* security - basic auth */
      if (utility2.securityBasicAuthValidate(request)) {
        next();
        return;
      }
      utility2.serverRespondDefault(response, 303, null, '/signin?redirect='
        + encodeURIComponent(request.url));
    },

    'routerSecurityDict_/public': function (request, response, next) {
      /*
        this function grants public access to the /public path
      */
      next();
    },

    'routerSecurityDict_/signin': function (request, response, next) {
      var redirect;
      if (utility2.securityBasicAuthValidate(request)) {
        if (request.urlParsed.params.redirect) {
          redirect = utility2.urlDecodeOrError(request.urlParsed.params.redirect);
          if (redirect instanceof Error) {
            next(redirect);
            return;
          }
          utility2.serverRespondDefault(response, 303, null, redirect);
          return;
        }
        next();
        return;
      }
      utility2.serverRespondDefault(response, 401, 'text/plain', '401 Unauthorized');
    },

    '_routerSecurityDict_/signin_default_test': function (onEventError) {
      /*
        this function tests routerSecurityDict_/signin_default_test's default handling behavior
      */
      utility2.testMock(onEventError, [
        [state, { '/signin': local['routerSecurityDict_/signin'] }]
      ], function (onEventError) {
        state.middlewareTest({ headers: { host: 'localhost' }, url: '/signin' },
          {},
          onEventError);
      });
    },

    'routerProxyDict_/': function (request, response, next) {
      next();
    },

    'routerProxyDict_/proxy/proxy.ajax': function (request, response, next) {
      /*
        this function proxies frontend request
      */
      var headers, url, urlParsed;
      headers = utility2.jsonCopy(request.headers);
      url = request.url.replace('/proxy/proxy.ajax/', '');
      urlParsed = required.url.parse(url);
      /* update host header with actual destination */
      headers.host = urlParsed.host;
      utility2.ajax({
        dataType: 'response',
        headers: headers,
        readStream: request,
        url: url
      }, function (error, response2) {
        if (error) {
          next(error);
          return;
        }
        if (!response.headersSent) {
          response.writeHead(response2.statusCode, response2.headers);
        }
        response2.on('error', next).pipe(response.on('error', next));
      });
    },

    'routerDict_/state/stateDefault.json': function (request, response) {
      /*
        this function returns the current default config
      */
      response.end(JSON.stringify(state.stateDefault));
    },

    'routerDict_/state/stateOverride.json': function (request, response) {
      /*
        this function returns the current override config
      */
      response.end(JSON.stringify(state.stateOverride));
    },

    'routerFileDict_/public': function (request, response, next) {
      /*
        this function serves public files
      */
      utility2.serverRespondFile(response, process.cwd() + request.urlPathNormalized, next);
    },

    'routerFileDict_/public/utility2-external': function (request, response, next) {
      /*
        this function serves public, utility2-external files
      */
      utility2.serverRespondFile(response,
        required.utility2_external.__dirname + '/public/' + request.urlPathNormalized
          .replace('/public/utility2-external/', ''),
        next);
    },

    'routerFileDict_/public/utility2.js': function (request, response) {
      /* this function serves the file utility2.js */
      utility2.serverRespondDefault(response, 200, 'application/javascript; charset=utf-8',
        utility2._fileContentBrowser);
    },

    _createMiddleware: function (routerDict) {
      /*
        this function creates a middleware app using the specified route dict
      */
      return function (request, response, next) {
        var path, path0, tryCatch;
        /* debug */
        state.request = request;
        state.response = response;
        /* security - validate path */
        path = request.urlPathNormalized = request.urlPathNormalized
          || utility2.urlPathNormalizeOrError(request.url);
        if (path instanceof Error) {
          next(path);
          return;
        }
        /* parse url params */
        request.urlParsed = request.urlParsed || utility2.urlParamsParse(request.url);
        tryCatch = function () {
          utility2.tryCatch(function () {
            routerDict[path](request, response, next);
          }, next);
        };
        /* dyanamic path handler */
        for (path = request.urlPathNormalized;
            path !== path0;
            path = utility2.fsDirname(path)) {
          path0 = path = path || '/';
          /* found a handler matching request path */
          if (routerDict[path]) {
            /* debug */
            request.handler = routerDict[path];
            /* process request with error handling */
            tryCatch();
            return;
          }
        }
        /* fallback to next middleware */
        next();
      };
    },

    middlewareApplication: function (request, response, next) {
      /*
        this function exports the main middleware application
      */
      var _onEventError;
      _onEventError = function (error) {
        /* call error handling middleware */
        if (error instanceof Error) {
          utility2.serverRespondDefault(response, 500, 'plain/text', error, next);
          return true;
        }
      };
      /* call logging middleware */
      state.middlewareLogging(request, response, function (error) {
        if (_onEventError(error)) {
          return;
        }
        /* call security middleware */
        state.middlewareSecurity(request, response, function (error) {
          if (_onEventError(error)) {
            return;
          }
          /* call proxy middleware */
          state.middlewareProxy(request, response, function (error) {
            if (_onEventError(error)) {
              return;
            }
            /* call backend middleware */
            state.middleware(request, response, function (error) {
              if (_onEventError(error)) {
                return;
              }
              /* call file middleware */
              state.middlewareFile(request, response, function (error) {
                if (_onEventError(error)) {
                  return;
                }
                /* fallback to next middleware */
                next();
              });
            });
          });
        });
      });
    },

    securityBasicAuthValidate: function (request) {
      /*
        this function validates the request's basic auth
        basic auth format:
        btoa('Aladdin:open sesame')
        atob('QWxhZGRpbjpvcGVuIHNlc2FtZQ==')
      */
      /* ignore localhost */
      return (/^(?::1|127.0.0.1|localhost)\b/).test(request.headers.host)
        /* basic auth validation */
        || (/\S*$/).exec(request.headers.authorization || '')[0]
        === state.securityBasicAuthSecret;
    },

    securityHttpsRedirect: function (request, response) {
      /*
        this function forces the server to redirect all non-https requests to https
      */
      var headers;
      headers = request.headers;
      if (state.isSecurityHttpsRedirect
          && headers.host.slice(0, 9) !== 'localhost'
          && headers['x-forwarded-proto'] !== 'https') {
        utility2.serverRespondDefault(response,
          301,
          null,
          'https://' + headers.host + request.url);
        return true;
      }
    },

    serverRespondDefault: function (response, statusCode, contentType, data) {
      /*
        this function handles an appropriate response for a given status code
      */
      statusCode = Number(statusCode);
      data = data || statusCode + ' '
        + (required.http.STATUS_CODES[statusCode] || 'Unknown Status Code');
      switch (statusCode) {
      /* redirect */
      case 301:
      case 302:
      case 303:
      case 304:
      case 305:
      case 306:
      case 307:
      case 308:
      case 309:
        if (data) {
          response.setHeader('location', data);
        }
        break;
      case 401:
        response.setHeader('www-authenticate', 'Basic realm="Authorization Required"');
        break;
      /* error */
      case 500:
        utility2.onEventErrorDefault(data);
        break;
      }
      if (!response.headersSent) {
        response.statusCode = statusCode;
        if (contentType) {
          response.setHeader('content-type', contentType);
        }
      }
      response.end(data);
    },

    serverRespondFile: function (response, file, next) {
      response.setHeader('content-type', utility2.mimeLookup(file));
      required.fs.createReadStream(file).on('error', function () {
        next();
      }).pipe(response);
    },

    serverStart: function (port) {
      var _listen, remaining;
      state.serverPort = port || state.serverPort;
      if (!state.serverPort) {
        return;
      }
      /* random server port */
      if (state.serverPort === 'random') {
        state.serverPort = utility2.serverPortRandom();
      }
      /* setup localhost */
      state.localhost = state.localhost || 'http://localhost:' + state.serverPort;
      /* create server */
      state.server = state.server || required.connect().use(utility2.middlewareApplication);
      /* listen on specified port */
      if (state.serverListened) {
        return;
      }
      state.serverListened = true;
      _listen = function (port) {
        utility2.deferCallback('untilServerReady', 'pause');
        remaining = remaining || 0;
        remaining += 1;
        state.server.listen(port, function () {
          remaining -= 1;
          utility2.jsonLog(['serverStart - server started on port', port]);
          if (remaining === 0) {
            utility2.deferCallback('untilServerReady', 'resume');
          }
        });
      };
      _listen(state.serverPort);
      state.serverPort2 = state.serverPort2 || utility2.serverPortRandom();
      state.localhost2 = state.localhost2 || 'http://localhost:' + state.serverPort2;
      _listen(state.serverPort2);
    }

  };
  local._init();
}());



(function moduleSocks5Nodejs() {
  /*
    this nodejs module exports the socks5 api
  */
  'use strict';
  var local;
  local = {

    _name: 'utility2.moduleSocks5Nodejs',

    _init: function () {
      if (!state.isNodejs) {
        return;
      }
      utility2.initModule(module, local);
    },

    _initOnce: function () {
      utility2.restartSocks5Server(state.socks5ServerPort, state.socks5SshHost);
    },

    ajaxSocks5: function (options, onEventError) {
      /*
        this function hooks the socks5 proxy protocol into the function ajax
      */
      var regexp;
      regexp = typeof state.socks5IgnoreRegexp === 'string'
        ? new RegExp(state.socks5IgnoreRegexp)
        : state.socks5IgnoreRegexp;
      if (!state.socks5ServerPort || options.createConnection
          || (options.url.indexOf(state.localhost2) !== 0
          && ((/^https*:\/\/localhost\b/).test(options.url)
            || (regexp && regexp.test(options.url))
            || options.url.indexOf(state.localhost) === 0
            || options.hostname === state.socks5SshHostname))) {
        return true;
      }
      utility2.deferCallback('untilSocks5PortReady', 'defer', function (error) {
        if (error) {
          onEventError(error);
          return;
        }
        local._ajaxSocks5Resume(options, onEventError);
      });
    },

    _ajaxSocks5Resume: function (options, onEventError) {
      /*
        this function resumes the ajax request after a socks5 proxy has been established
      */
      var chunks, hostname, _onEventData, port, self;
      chunks = new Buffer(0);
      hostname = new Buffer(options.hostname);
      _onEventData = function (chunk) {
        chunks = Buffer.concat([chunks, chunk]);
        if (chunks.length < 12) {
          return;
        }
        if (!(chunks[0] === 5
            && chunks[1] === 0
            && chunks[2] === 5
            && chunks[3] === 0
            && chunks[4] === 0
            && chunks[5] === 1)) {
          onEventError(new Error('_ajaxSocks5Resume - request failed'));
          return;
        }
        /* cleanup socks5 listeners */
        self.removeListener('data', _onEventData);
        /* continue with ajax request as normal */
        options.createConnection = function () {
          /* reset createConnection for http redirects */
          options.createConnection = null;
          return self;
        };
        /* disable socket pooling */
        options.agent = false;
        if (options.protocol !== 'https:') {
          utility2.ajax(options, onEventError);
          return;
        }
        local._startTls({
          rejectUnauthorized: options.rejectUnauthorized,
          socket: self
        }, function (error, cleartext) {
          if (error) {
            onEventError(error);
            return;
          }
          self = cleartext;
          utility2.ajax(options, onEventError);
        });
      };
      port = Number(options.port) || (options.protocol === 'https:' ? 443 : 80);
      self = required.net.connect(state.socks5ServerPort, 'localhost', function () {
        /*jslint bitwise: true*/
        try {
          self.write(Buffer.concat([
            new Buffer([5, 1, 0, 5, 1, 0, 3, hostname.length]),
            hostname,
            new Buffer([port >> 8, port & 0xff])
          ]));
        } catch (error) {
          onEventError(error);
        }
      }).on('data', _onEventData).on('error', onEventError);
    },

    _ajaxSocks5_socks5_test: function (onEventError) {
      /*
        this function tests ajaxSocks5's socks5 behavior
      */
      utility2.nop(state.socks5ServerPort && state.npmTestMode
        ? utility2.ajax({ url: state.localhost2 + '/test/test.echo' }, onEventError)
        : onEventError('skip'));
    },

    _startTls: function (options, onEventError) {
      /*
        this function upgrades a socket to tls security protocol
      */
      var pair;
      pair = required.tls
        .createSecurePair(required.crypto.createCredentials(options))
        .on('error', onEventError);
      pair.encrypted.pipe(options.socket);
      options.socket.pipe(pair.encrypted);
      pair.on('secure', function () {
        onEventError(pair.ssl.verifyError(), pair.cleartext.on('error', onEventError));
      });
    },

    _socks5ServerOnEventSocket: function (self) {
      var ended, _onEventData, _onEventError, proxy;
      _onEventData = function (chunk) {
        var host, port;
        if (chunk.length < 11 || !(chunk[0] === 5
            && chunk[1] === 1
            && chunk[2] === 0
            && chunk[3] === 5
            && chunk[4] === 1
            && chunk[5] === 0
            && chunk[6] === 3
            && chunk.length >= 8 + chunk[7] + 2)) {
          _onEventError(new Error('_socks5ServerOnEventSocket - request failed'));
          return;
        }
        self.removeListener('data', _onEventData);
        /* create proxy socket */
        host = chunk.slice(8, 8 + chunk[7]).toString();
        port = chunk.readUInt16BE(8 + chunk[7]);
        utility2.jsonLog(['_socks5ServerOnEventSocket - proxying', host + ':' + port]);
        proxy = required.net.connect(port, host).on('error', _onEventError);
        /* write leftover chunk from current read to proxy connection */
        proxy.write(chunk.slice(8 + chunk[7] + 2));
        proxy.pipe(self);
        self.pipe(proxy);
      };
      _onEventError = function (error) {
        if (!ended) {
          ended = true;
          utility2.onEventErrorDefault(error);
          self.removeListener('data', _onEventData);
          self.end('HTTP/1.1 500 Internal Server Error\r\n\r\n');
          utility2.nop(proxy && proxy.end());
        }
      };
      self
        .on('data', _onEventData)
        .on('error', _onEventError)
        .write('\u0005\u0000\u0005\u0000\u0000\u0001\u0000\u0000\u0000\u0000\u0000\u0000');
    },

    __socks5ServerOnEventSocket_error_test: function (onEventError) {
      /*
        this function tests _socks5ServerOnEventSocket's error handling behavior
      */
      utility2.testMock(onEventError, [
        [console, { error: utility2.nop }]
      ], function (onEventError) {
        local._socks5ServerOnEventSocket({
          end: utility2.nop,
          on: function (event, onEvent) {
            if (event === 'error') {
              this.onEventError = onEvent;
            }
            return this;
          },
          removeListener: utility2.nop,
          write: function () {
            this.onEventError(new Error());
            onEventError();
          }
        });
      });
    },

    restartSocks5Server: function (port, sshHost) {
      /*
        this function restarts the socks5 server
      */
      if (state.npmTestMode) {
        sshHost = null;
      }
      state.socks5ServerPort = port || state.socks5ServerPort || (sshHost ? 'random' : null);
      /* invalid port */
      if (!state.socks5ServerPort) {
        utility2.deferCallback('untilSocks5PortReady', 'resume');
        return;
      }
      /* random server port */
      if (state.socks5ServerPort === 'random') {
        state.socks5ServerPort = utility2.serverPortRandom();
      }
      /* pause socks5 proxy */
      utility2.deferCallback('untilSocks5PortReady', 'pause');
      /* start ssh socks5 proxy server */
      if (sshHost) {
        local._restartSocks5ServerSsh(sshHost);
        return;
      }
      /* close old socks5 server */
      if (state.socks5Server) {
        state.socks5Server.close();
      }
      /* start socks5 proxy server */
      state.socks5Server = required.net.createServer(local._socks5ServerOnEventSocket);
      state.socks5Server.listen(state.socks5ServerPort, function () {
        utility2.deferCallback('untilSocks5PortReady', 'resume');
        utility2.jsonLog(['restartSocks5Server - socks5 server started on port',
          state.socks5ServerPort]);
      });
    },

    _restartSocks5ServerSsh: function (sshHost) {
      /*
        this function restart the socks5 ssh server
      */
      /* kill old ssh process */
      try {
        process.kill(state.socks5SshPid || 99999999);
      } catch (ignore) {
      }
      state.socks5SshHost = sshHost;
      state.socks5SshHostname = state.socks5SshHost.split(':')[0];
      state.socks5SshPort = state.socks5SshHost.split(':')[1] || 22;
      state.socks5SshPid = utility2.shell({
        script: 'ssh -D ' + state.socks5ServerPort + ' -o StrictHostKeyChecking=no -p '
          + (state.socks5SshPort) + ' ' + state.socks5SshHostname,
        stdio: ['pipe', 'pipe', 'pipe']
      }).pid;
      utility2.clearCallSetInterval('untilSocks5PortReady', function (timeout) {
        /* timeout error handling */
        if (timeout) {
          utility2.deferCallback('untilSocks5PortReady', 'error', timeout);
          return;
        }
        local._ajaxSocks5Resume({
          hostname: 'www.google.com',
          url: 'http://www.google.com'
        }, function (error) {
          if (error && error.code === 'ECONNREFUSED') {
            return;
          }
          utility2.deferCallback('untilSocks5PortReady', 'resume');
          utility2.clearCallSetInterval('untilSocks5PortReady', 'clear');
        });
      }, 1000, state.timeoutDefault);
    }

  };
  local._init();
}());



(function moduleTestNodejs() {
  /*
    this nodejs module exports the test api
  */
  'use strict';
  var local;
  local = {

    _name: 'utility2.moduleTestNodejs',

    _init: function () {
      if (!state.isNodejs) {
        return;
      }
      utility2.initModule(module, local);
    },

    _initOnce: function () {
      /*jslint stupid: true */
      /* create test dir */
      state.fsDirTest = state.fsDirTmp + '/test';
      utility2.fsMkdirpSync(state.fsDirTest + '/test');
      /* create mock json test file */
      state.fsFileTestHelloJson = state.fsDirTest + '/mock.hello.json';
      required.fs.writeFileSync(state.fsFileTestHelloJson, '"hello world"');
      /* npm test */
      local._npmTest();
      /* upload coverage to http://coveralls.io */
      local._coverageCoverallsUpload();
      /* gracefully handle signal interrupt */
      if (state.npmTestMode) {
        process.on('SIGINT', utility2.exit);
      }
    },

    'routerDict_/test/test.echo': function (request, response) {
      /*
        this function echoes the request back to the response
      */
      if (!response.headersSent) {
        response.writeHead(200, { 'content-type': 'text/plain' });
      }
      response.write(request.method + ' ' + request.url + ' http/' + request.httpVersion
        + '\n');
      Object.keys(request.headers).forEach(function (name) {
        response.write(name + ': ' + request.headers[name] + '\n');
      });
      response.write('\n');
      /* optimization - stream data */
      request.pipe(response);
    },

    'routerDict_/test/test.error': function (request, response) {
      /*
        this function responds with default 500
      */
      utility2.serverRespondDefault(response, 500, null, 'testing server error');
    },

    'routerDict_/test/test.timeout': function (request, response) {
      /*
        this function responds after state.timeoutDefault milliseconds
      */
      setTimeout(function () {
        response.end();
      }, state.timeoutDefault);
    },

    '_routerDict_/test/test.timeout_default_test': function (onEventError) {
      /*
        this function tests routerDict_/test/test.timeout's default handling behavior
      */
      utility2.testMock(onEventError, [
        [global, { setTimeout: utility2.callArg0 }],
        [state.routerTestDict, { '/test/test.timeout': local['routerDict_/test/test.timeout'] }]
      ], function (onEventError) {
        state.middlewareTest({ url: '/test/test.timeout' }, { end: onEventError });
      });
    },

    'routerDict_/test/report.upload': function (request, response, next) {
      /*
        this function receives and parses uploaded test objects
      */
      utility2.streamReadOnEventError(request, function (error, data) {
        error = error || utility2.jsonParseOrError(data);
        if (error instanceof Error) {
          next(error);
          return;
        }
        response.end();
        state.testSuiteList = state.testSuiteList.concat(error.testSuiteList || []);
        /* extend global.__coverage with uploaded code coverage object */
        utility2.coverageExtend(global.__coverage__, error.coverage);
      });
    },

    '_routerDict_/test/report.upload_error_test': function (onEventError) {
      /*
        this function tests routerDict_/test/report.upload's error handling behavior
      */
      utility2.testMock(onEventError, [
        [utility2, { streamReadOnEventError: function (_, onEventError) {
          onEventError(null, 'syntax error');
        } }],
        [state.routerTestDict, { '/test/report.upload': local['routerDict_/test/report.upload'] }]
      ], function (onEventError) {
        state.middlewareTest({ url: '/test/report.upload' }, {}, function (error) {
          utility2.assert(error instanceof Error);
          onEventError();
        });
      });
    },

    'routerDict_/test/test.watch': function (request, response, next) {
      /*
        this function informs the client about server file changes using server sent events
      */
      var list;
      if (request.headers.accept !== 'text/event-stream') {
        next();
        return;
      }
      /* https://developer.mozilla.org/en-US/docs/Server-sent_events/Using_server-sent_events */
      response.setHeader('content-type', 'text/event-stream');
      response.write('retry: ' + state.timeoutDefault + '\n\n');
      list = state.testWatchList;
      if (list.length >= 256) {
        list.shift();
      }
      list.push(response);
    },

    '_routerDict_/test/test.watch_default_test': function (onEventError) {
      /*
        this function tests routerDict_/test/test.watch's default handling behavior
      */
      utility2.testMock(onEventError, [
        [state, { testWatchList: new global.Array(256) }],
        [state.routerTestDict, { '/test/test.watch': local['routerDict_/test/test.watch'] }]
      ], function (onEventError) {
        state.middlewareTest({
          headers: { accept: 'text/event-stream' },
          url: '/test/test.watch'
        }, {
          setHeader: utility2.nop,
          write: utility2.nop
        });
        state.middlewareTest({ headers: {}, url: '/test/test.watch' }, {}, onEventError);
      });
    },

    'routerFileDict_/test/test.1x1.png': function (request, response) {
      /*
        this function serves the file test.1x1.png
      */
      utility2.serverRespondDefault(response, 200, 'image/png', local._fileTest1x1Png);
    },

    'routerFileDict_/test/test.css': function (request, response) {
      /*
        this function serves the file test.css
      */
      utility2.serverRespondDefault(response, 200, 'text/css', local._fileTestCss);
    },

    'routerFileDict_/test/test.html': function (request, response) {
      /* this function serves the file test.html */
      utility2.serverRespondDefault(response, 200, 'text/html',
        utility2.templateFormat(local._fileTestHtml, { globalOverride: JSON.stringify({ state: {
          isNpmTestUtility2: state.isNpmTestUtility2,
          localhost: state.localhost
        } }) }));
    },

    'routerFileDict_/test/test.js': function (request, response) {
      /*
        this function serves the file test.css
      */
      utility2.serverRespondDefault(response, 200, 'application/javascript; charset=utf-8',
        'console.log("hello world");');
    },

    _fileTest1x1Png: (global.Buffer || utility2.nop)(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAAApJ'
        + 'REFUCB1jYAAAAAIAAc/INeUAAAAASUVORK5CYII=',
      'base64'
    ),

    _fileTestCss: (utility2.lintScript || utility2.nop)('test.css', 'body {\n'
      + 'background-image:url("test.1x1.png");\n'
      + '}\n'),

    _fileTestHtml: '<!DOCTYPE html><html><head>\n'
      + '<link href="/public/utility2-external/utility2-external.browser.min.css" rel="stylesheet"/>\n'
      + '<style>\n'
      + utility2.lintScript('test.css', '\n')
      + '</style></head><body>\n'
      + '<div id="divTest"></div>\n'
      + '<script>window.globalOverride = {{globalOverride}};</script>\n'
      + '<script src="/public/utility2-external/utility2-external.shared.min.js"></script>\n'
      + '<script src="/public/utility2-external/utility2-external.browser.min.js"></script>\n'
      + '<script src="/public/utility2.js"></script>\n'
      + '</body></html>\n',

    coverageExtend: function (coverage1, coverage2) {
      /*
        this function extends code coverage object1 with code coverage object2
      */
      coverage1 = coverage1 || {};
      Object.keys(coverage2 || []).forEach(function (key) {
        var file1, file2;
        file1 = coverage1[key];
        file2 = coverage2[key];
        if (file1) {
          /* remove derived info */
          delete file1.l;
          Object.keys(file2.s).forEach(function (key) {
            file1.s[key] += file2.s[key];
          });
          Object.keys(file2.f).forEach(function (key) {
            file1.f[key] += file2.f[key];
          });
          Object.keys(file2.b).forEach(function (key) {
            var ii, list1, list2;
            list1 = file1.b[key];
            list2 = file2.b[key];
            for (ii = 0; ii < list1.length; ii += 1) {
              list1[ii] += list2[ii];
            }
          });
        } else {
          coverage1[key] = file2;
        }
      });
      return coverage1;
    },

    _coverageExtend_default_test: function (onEventError) {
      /*
        this function tests coverageExtend's default handling behavior
      */
      utility2.assert(JSON.stringify(utility2.coverageExtend({}, { aa: 1 })) === '{"aa":1}');
      onEventError();
    },

    _coverageCoverallsUpload: function () {
      /*
        this function uploads code coverage info to http://coveralls.io
      */
      var script;
      if (required.coveralls && state.isCoveralls) {
        if (process.env.TRAVIS) {
          script = 'cat ' + state.fsDirTest + '/coverage/lcov.info'
            + ' | ' + utility2.__dirname + '/node_modules/.bin/coveralls '
            + '; kill ' + process.pid;
          utility2.shell(script);
          utility2.timeoutSetTimeout(utility2.exit,
            state.timeoutDefault,
            '_coverageCoverallsUpload');
        } else {
          utility2.exit();
        }
      }
    },

    _coverageCoverallsUpload_default_test: function (onEventError) {
      /*
        this function tests _coverageCoverallsUpload's default handling behavior
      */
      utility2.testMock(onEventError, [
        [utility2, { exit: onEventError }],
        [process.env, { TRAVIS: '' }],
        [state, { isCoveralls: true }]
      ], function (onEventError) {
        local._coverageCoverallsUpload();
      });
    },

    _coverageCoverallsUpload_travisCi_test: function (onEventError) {
      /*
        this function tests _coverageCoverallsUpload's travis-ci behavior
      */
      utility2.testMock(onEventError, [
        [utility2, { shell: utility2.nop, timeoutSetTimeout: function () {
          onEventError();
        } }],
        [process.env, { TRAVIS: '1' }],
        [global, { setTimeout: utility2.callArg0 }],
        [state, { isCoveralls: true }]
      ], function (onEventError) {
        local._coverageCoverallsUpload();
      });
    },

    _npmTest: function () {
      /*
        this function runs npm test with code coverage
      */
      switch (state.npmTestMode) {
      /* start child process running npm test */
      case 'start':
        utility2.shell('rm -r ' + state.fsDirTest + '/coverage 2>/dev/null; '
          + utility2.__dirname + '/node_modules/.bin/istanbul '
          + (process.env.npm_config_cover === '' ? 'test' : 'cover')
          + ' --dir ' + state.fsDirTest + '/coverage'
          + ' -x **/tmp/**'
          + ' ' + state.npmTestScript + ' --'
          + ' --npm-test-mode running'
          + ' --' + (state.isNpmTestUtility2 ? '' : 'no-') + 'npm-test-utility2'
          + ' --repl'
          + ' --socks5-server-port random'
          + ' --serverPort random'
          + ' --test'
          + ' --timeout-default ' + state.timeoutDefault
          + ' --time-exit ' + (state.timeExit - 1000)
          + (state.isNpmTestUtility2
            /* test option --load-file */
            ? ' --load-file ' + required.utility2_external.__dirname + '/public/hello.js'
              /* test option --no-xxx */
              + ' --no-' + utility2.uuid4()
            : ''));
        utility2.deferCallback('onEventExit', 'defer', function () {
          utility2.exit();
        });
        break;
      /* npm test is running */
      case 'running':
        utility2.deferCallback('onEventExit', 'defer', function () {
          /*jslint stupid: true*/
          /* write test report */
          required.fs.writeFileSync(state.fsDirTest + '/test.result.xml',
            local._testReportXml());
          /* write test failures */
          required.fs.writeFileSync(state.fsDirTest + '/test.failures.json',
            state.testFailures.toString());
          utility2.exit();
        });
        break;
      /* end npm test with appropriate exit code */
      case 'end':
        required.fs.readFile(state.fsDirTest + '/test.failures.json', function (error, data) {
          utility2.exit(error || utility2.jsonParseOrError(data));
        });
        break;
      }
    },

    __npmTest_default_test: function (onEventError) {
      /*
        this function tests _npmTest's default handling behavior
      */
      utility2.testMock(onEventError, [
        [utility2, { deferCallback: utility2.callArg2, exit: utility2.nop, shell: utility2.nop }],
        [required.fs, { readFile: utility2.callArg1 }],
        [state, { npmTestMode: '' }]
      ], function (onEventError) {
        state.npmTestMode = 'start';
        local._npmTest();
        state.npmTestMode = 'running';
        local._npmTest();
        state.npmTestMode = 'end';
        local._npmTest();
        onEventError();
      });
    },

    _testReportXml: function () {
      /*
        this function creates a test report in junit-xml format
      */
      var xml;
      xml = '\n<testsuites>\n';
      state.testSuiteList.sort(function (arg1, arg2) {
        arg1 = arg1.name;
        arg2 = arg2.name;
        return arg1 < arg2 ? -1 : arg1 > arg2 ? 1 : 0;
      }).forEach(function (testSuite) {
        state.testFailures = state.testFailures || 0;
        state.testFailures += testSuite.failures || 0;
        xml += '<testsuite ';
        ['failures', 'name', 'passed', 'skipped', 'tests'].forEach(function (attribute) {
          xml += attribute + '="' + testSuite[attribute] + '" ';
        });
        Object.keys(testSuite.testCaseList).forEach(function (test) {
          test = testSuite.testCaseList[test];
          xml += '<testcase ';
          ['name', 'time'].forEach(function (attribute) {
            xml += attribute + '="' + test[attribute] + '" ';
          });
          xml += '>';
          xml += (test.failure
            ? '<failure><![CDATA[' + test.failure + ']]></failure>\n'
            : test.skipped
            ? '<skipped></skipped>'
            : '');
          xml += '</testcase>\n';
        });
        xml += '</testsuite>\n';
      });
      xml += '</testsuites>\n';
      return xml;
    }

  };
  local._init();
}());
