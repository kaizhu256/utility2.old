#!/usr/bin/env node
/*jslint browser: true, indent: 2, maxerr: 8, node: true, nomen: true, regexp: true, todo: true, unparam: true*/
/*global EXPORTS, global, required, state, underscore, $*/
/*
utility2.js
common, shared utilities for both browser and nodejs

todo:
emulate localStorage
add heroku dynamic config server
integrate forever-webui
*/



(function moduleInitFirstShared() {
  /*
    this shared module runs initializations before the below modules are loaded
  */
  'use strict';
  var local;
  local = {

    _name: 'utility2.moduleInitFirstShared',

    _init: function () {
      try {
        window.global = window.global || window;
      } catch (ignore) {
      }
      /* exports */
      global.EXPORTS = global.EXPORTS || {};
      global.module = global.module || {};
      global.required = EXPORTS.required = EXPORTS.required || global.required || {};
      global.state = EXPORTS.state = EXPORTS.state || global.state || {};
      /* make console.log callable without context */
      console._log = console._log || console.log;
      console.log = function () {
        console._log.apply(console, arguments);
      };
      /* debugPrint */
      global.debugPrint = function () {
        /*
          this global function is used purely for temporary debugging,
          and jslint will nag you to remove it
        */
        console.log('\n\n\n\ndebugPrint');
        console.log.apply(console, arguments);
      };
      if (global.process && process.versions) {
        /* nodejs */
        if (process.versions.node) {
          state.isNodejs = true;
          EXPORTS.require = EXPORTS.require || require;
        }
        /* nodejs node-webkit */
        state.isNodeWebkit = process.versions['node-webkit'];
      }
      /* phantomjs */
      if (global.phantom) {
        state.isPhantomjs = true;
      /* browser - require jquery */
      } else if (global.document && global.jQuery) {
        state.isBrowser = true;
      }
      /* init module */
      local.initModule(module, local);
    },

    initModule: function (module, local2) {
      /*
        this function inits a module with the provided local2 dictionary
      */
      var exports, name;
      /* assert local2._name */
      if (EXPORTS.assert) {
        EXPORTS.assert(local2._name, [local2._name]);
      }
      name = local2._name.split('.');
      /* exports */
      exports = EXPORTS.required[name[0]] = EXPORTS.required[name[0]] || {};
      Object.keys(local2).forEach(function (key) {
        var match;
        /* dict item */
        match = (/(.+Dict)_(.*)/).exec(key);
        if (match) {
          state[match[1]] = state[match[1]] || {};
          state[match[1]][match[2]] = local2[key];
          return;
        }
        /* prototype item */
        match = (/(.+)_prototype_(.+)/).exec(key);
        if (match) {
          local2[match[1]].prototype[match[2]] = local2[key];
          return;
        }
        /* export local2 */
        if (key[0] === '_' && key.slice(-5) !== '_test') {
          exports[key] = local2[key];
          return;
        }
        /* export global */
        EXPORTS[key] = local2[key];
      });
      /* defer further module initialization until jQuery.ready */
      if (state.isBrowser && EXPORTS.deferCallback) {
        $(function () {
          EXPORTS.deferCallback('initModuleDefer', 'resume');
        });
        EXPORTS.deferCallback('initModuleDefer', 'defer', function () {
          local._initModuleResume(module, local2, exports);
        });
        return;
      }
      local._initModuleResume(module, local2, exports);
    },

    _initModuleOnceNodejs: function (module, local2, exports) {
      /*
        this function runs extra nodejs initializations
      */
      if (!state.isNodejs
          || exports.__filename
          || !(module && module.filename)
          || !EXPORTS.fsWatch) {
        return;
      }
      exports.__filename = exports.__filename || module.filename;
      exports.__dirname = exports.__dirname || EXPORTS.fsDirname(exports.__filename);
      module.exports = exports;
      /* watch module */
      EXPORTS.fsWatch({ action: ['lint', function (file, content, content2) {
        exports._fileContent = content2;
        exports._fileContentBrowser = global.__coverage__ ? content2
          : (content2 + '\n(function moduleNodejs() {\n}());\n')
            .replace((/\n\(function module\w*Nodejs\([\S\s]*/), '').trim();
      }, 'eval'], name: exports.__filename });
    },

    _initModuleResume: function (module, local2, exports) {
      /*
        this function resumes module initialization
      */
      /* first-time init */
      state.initOnceDict = state.initOnceDict || {};
      if (!state.initOnceDict[local2._name]) {
        state.initOnceDict[local2._name] = true;
        /* init module once */
        if (local2._initOnce) {
          local2._initOnce();
        }
        /* init module once - nodejs */
        local._initModuleOnceNodejs(module, local2, exports);
      }
      /* run tests */
      setTimeout(function () {
        if (local2._initTest) {
          EXPORTS.deferCallback('serverDefer', 'defer', function () {
            local2._initTest();
          });
        }
      });
    }

  };
  local._init();
}());



(function moduleCommonShared() {
  /*
    this shared module exports common, shared utilities
  */
  'use strict';
  var local;
  local = {

    _name: 'utility2.moduleCommonShared',

    _init: function () {
      EXPORTS.initModule(module, local);
    },

    _initTest: function () {
      EXPORTS.testModule(local);
    },

    base64Decode: function (text) {
      /*
        this function base64 decodes text that was encoded in a uri-friendly format
      */
      return global.atob(text.replace((/-/g), '+').replace((/_/g), '/'));
    },

    _base64Decode_default_test: function (onEventError) {
      /*
        this function tests base64Decode's default behavior
      */
      EXPORTS.assert(EXPORTS.base64Decode('') === '');
      EXPORTS.assert(EXPORTS.base64Decode('AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUm'
        + 'JygpKissLS4vMDEyMzQ1Njc4OTo7PD0-P0BBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWltcXV5fYGFiY2Rl'
        + 'ZmdoaWprbG1ub3BxcnN0dXZ3eHl6e3x9fn8') === EXPORTS.stringAscii);
      onEventError();
    },

    base64Encode: function (text) {
      /*
        this function base64 encodes text in a uri-friendly manner
      */
      return global.btoa(text).replace((/\+/g), '-').replace((/\//g), '_')
        .replace((/\=+/g), ''); /**/
    },

    _base64Encode_default_test: function (onEventError) {
      /*
        this function tests base64Encode's default behavior
      */
      EXPORTS.assert(EXPORTS.base64Encode('') === '');
      EXPORTS.assert(EXPORTS.base64Encode(EXPORTS.stringAscii) === 'AAECAwQFBgcICQoLDA0ODxAREhM'
        + 'UFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0-P0BBQkNERUZHSElKS0xNTk9QUVJ'
        + 'TVFVWV1hZWltcXV5fYGFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6e3x9fn8');
      onEventError();
    },

    callCallback: function (callback) {
      /*
        this function calls the callback
      */
      callback();
    },

    clearCallSetInterval: function (key, callback, interval, timeout) {
      /*
        this function:
          1. clear interval key
          2. run callback
          3. set interval key to callback
      */
      var _callback, dict;
      _callback = function () {
        if (timeout !== -1) {
          if (Date.now() < timeout) {
            callback();
            return;
          }
          callback(timeout);
          timeout = -1;
          clearInterval(dict[key]);
          delete dict[key];
        }
      };
      dict = state.setIntervalDict = state.setIntervalDict || {};
      timeout = timeout ? Date.now() + timeout : Infinity;
      /* 1. clear interval key */
      clearInterval(dict[key]);
      if (callback === 'clear') {
        return;
      }
      /* 2. run callback */
      _callback();
      /* 3. set interval key to callback */
      dict[key] = setInterval(_callback, interval);
    },

    _clearCallSetInterval_timeout_test: function (onEventError) {
      /*
        this function tests clearCallSetInterval's timeout behavior
      */
      var remaining, _test;
      remaining = 0;
      _test = function (key, interval, timeout) {
        remaining += 1;
        EXPORTS.clearCallSetInterval(key, function (timeout) {
          if (timeout) {
            remaining -= 1;
          }
          if (remaining <= 0) {
            onEventError();
          }
        }, interval, timeout);
      };
      _test(EXPORTS.uuid4(), 200, 100);
      _test(EXPORTS.uuid4(), 200, 200);
      _test(EXPORTS.uuid4(), 200, 300);
    },

    createErrorTimeout: function (message) {
      /*
        this function creates a new timeout error
      */
      var error;
      error = new Error((message || 'timeout error') + ' - ' + state.timeoutDefault);
      error.code = error.errno = 'ETIMEDOUT';
      return error;
    },

    createUtc: function (arg) {
      /*
        this function parses the argument into a date object, assuming UTC timezone
      */
      var time;
      time = arg;
      /* no arguments */
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
        this function tests createUtc's default behavior
      */
      EXPORTS.assert(EXPORTS.createUtc().toISOString().slice(0, 19)
        === new Date().toISOString().slice(0, 19));
      EXPORTS.assert(EXPORTS.createUtc('oct 10 2010').toISOString().slice(0, 19)
        === '2010-10-10T00:00:00');
      EXPORTS.assert(EXPORTS.createUtc('2010-10-10').toISOString().slice(0, 19)
        === '2010-10-10T00:00:00');
      EXPORTS.assert(EXPORTS.createUtc('2010-10-10 00:00:00').toISOString().slice(0, 19)
        === '2010-10-10T00:00:00');
      EXPORTS.assert(EXPORTS.createUtc('2010-10-10T00:00:00Z').toISOString().slice(0, 19)
        === '2010-10-10T00:00:00');
      onEventError();
    },

    dateAndSalt: function () {
      /*
        this function generates a unique, incrementing date counter with a random salt
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
        this function tests dateAndSalt
      */
      onEventError(!(
        /* assert each call returns incrementing result */
        EXPORTS.dateAndSalt(1) < EXPORTS.dateAndSalt(2)
          /* assert call can be converted to date */
          && new Date(EXPORTS.dateAndSalt()).getTime()
      ));
    },

    _debugPrint_default_test: function (onEventError) {
      EXPORTS.testMock({ console: { log: EXPORTS.nop } }, function () {
        onEventError(global.debugPrint('hello world'));
      });
    },

    fsDirname: function (file) {
      /*
        this function returns a file name's parent directory
      */
      return file.replace((/\/[^\/]+\/*$/), '');
    },

    isErrorTimeout: function (object) {
      /*
        this function returns the object if it's a timeout error
      */
      if (object instanceof Error && object.code === 'ETIMEDOUT') {
        return object;
      }
    },

    jsEvalFileSyncOnEventError: function (file, onEventError) {
      /*
        this function synchronously evals a file with auto error-handling
      */
      /*jslint stupid: true*/
      EXPORTS.tryCatch(function () {
        return required.fs.readFileSync(file, 'utf8');
      }, function (error, data) {
        EXPORTS.nop(error
          ? onEventError(error)
          : EXPORTS.jsEvalOnEventError(file, data, onEventError));
      });
    },

    jsEvalOnEventError: function (file, script, onEventError) {
      /*
        this function evals a script with auto error-handling
      */
      /*jslint evil: true*/
      var data;
      try {
        data = state.isNodejs ? required.vm.runInThisContext(script, file) : eval(script);
      } catch (error) {
        /* debug error */
        state.error = error;
        onEventError(error);
        return;
      }
      onEventError(null, data);
    },

    _jsEvalOnEventError_default_test: function (onEventError) {
      /*
        this function tests jsEvalOnEventError's default behavior
      */
      EXPORTS.jsEvalOnEventError('test.js', 'null', onEventError);
    },

    _jsEvalOnEventError_syntaxErrorHandling_test: function (onEventError) {
      /*
        this function tests jsEvalOnEventError's syntax error-handling behavior
      */
      EXPORTS.jsEvalOnEventError('error.js', 'syntax error', function (error) {
        EXPORTS.tryCatch(function () {
          EXPORTS.assert(error instanceof Error);
        }, onEventError);
      });
    },

    jsonParseOrError: function (data) {
      /*
        this function returns JSON.parse(data) or error
      */
      try {
        return JSON.parse(data);
      } catch (error) {
        return error;
      }
    },

    _jsonParseOrError_syntaxErrorHandling_test: function (onEventError) {
      /*
        this function tests jsonParseOrError's syntax error-handling behavior
      */
      onEventError(!(EXPORTS.jsonParseOrError('syntax error') instanceof Error));
    },

    jsonStringifyCircular: function (value, replacer, space) {
      /*
        this function JSON.stringify's an object, ignoring circular references
      */
      try {
        return JSON.stringify(value, replacer, space);
      } catch (error) {
        return JSON.stringify(local._jsonStringifyCircularRecurse(value, []), replacer, space);
      }
    },

    _jsonStringifyCircularRecurse: function (value, history) {
      /*
        this function JSON.stringify's an object, ignoring circular references
      */
      var result;
      if (value && history.indexOf(value) >= 0) {
        return;
      }
      try {
        JSON.stringify(value);
        return value;
      } catch (ignore) {
      }
      try {
        /* fallback */
        history.push(value);
        /* array */
        if (Array.isArray(value)) {
          return value.map(function (element) {
            return local._jsonStringifyCircularRecurse(element, history);
          });
        }
        /* object */
        result = {};
        Object.keys(value).forEach(function (key) {
          result[key] = local._jsonStringifyCircularRecurse(value[key], history);
        });
        return result;
      } catch (ignore) {
      }
    },

    _jsonStringifyCircular_default_test: function (onEventError) {
      /*
        this function tests jsonStringifyCircular's default behavior
      */
      var circular;
      console.assert(EXPORTS.jsonStringifyCircular() === undefined);
      circular = {};
      circular.circular = circular;
      circular = {'aa': [1, circular, 2]};
      console.assert(EXPORTS.jsonStringifyCircular(circular) === '{"aa":[1,{},2]}');
      onEventError();
    },

    lintScript: function (file, script) {
      /*
        this function is a stub
      */
      return script;
    },

    mimeLookup: function (file) {
      /*
        this function returns the mime-type for a given filename
      */
      if (required.mime) {
        return required.mime.lookup(file);
      }
      switch ((/[^\.]*$/).exec(file)[0]) {
      case 'css':
        return 'text/css';
      case 'html':
        return 'text/html';
      case 'js':
        return 'application/javascript';
      case 'json':
        return 'application/json';
      case 'txt':
        return 'text/plain';
      default:
        return 'application/octet-stream';
      }
    },

    _mimeLookup_default_test: function (onEventError) {
      /*
        this function tests mimeLookup's default behavior
      */
      EXPORTS.assert(EXPORTS.mimeLookup('css') === 'text/css');
      EXPORTS.assert(EXPORTS.mimeLookup('html') === 'text/html');
      EXPORTS.assert(EXPORTS.mimeLookup('js') === 'application/javascript');
      EXPORTS.assert(EXPORTS.mimeLookup('json') === 'application/json');
      EXPORTS.assert(EXPORTS.mimeLookup('txt') === 'text/plain');
      EXPORTS.assert(EXPORTS.mimeLookup('') === 'application/octet-stream');
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
        this function tests nop's default behavior
      */
      onEventError(EXPORTS.nop());
    },

    objectCopyDeep: function (object) {
      /*
        this function returns a deep-copy of an object using JSON.parse(JSON.stringify(object))
      */
      return JSON.parse(JSON.stringify(object));
    },

    onEventErrorDefault: function (error, data) {
      /*
        this function provides a common, default error / data callback.
        on error, it will print the error statck.
        on data, it will print the data.
      */
      if (error) {
        /* debug error */
        state.error = error;
        console.error(error.stack || error.message || error);
        return;
      }
      if (data === undefined) {
        return;
      }
      console.log((global.Buffer && global.Buffer.isBuffer(data)) ? data.toString() : data);
    },

    _onEventErrorDefault_errorHandling_test: function (onEventError) {
      /*
        this function tests onEventErrorDefault's error-handling behavior
      */
      EXPORTS.testMock({ console: { error: EXPORTS.nop } }, function () {
        EXPORTS.onEventErrorDefault(new Error());
        onEventError();
      });
    },

    _onEventErrorDefault_default_test: function (onEventError) {
      /*
        this function tests onEventErrorDefault's default behavior
      */
      EXPORTS.testMock({ console: { log: EXPORTS.nop } }, function () {
        EXPORTS.onEventErrorDefault(null, null);
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

    setOptionsDefaults: function (options, defaults) {
      /*
        this function recursively walks through the defaults tree,
        and sets default values for unset leaf nodes
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
        /* recurse if options2 and defaults2 are both dictionaries */
        if (defaults2
            && typeof defaults2 === 'object'
            && options2
            && typeof options2 === 'object'
            && !Array.isArray(options2)) {
          local.setOptionsDefaults(options2, defaults2);
        }
      });
      return options;
    },

    _setOptionsDefaults_default_test: function (onEventError) {
      /*
        this function tests setOptionsDefault's default behavior
      */
      var options;
      options = EXPORTS.setOptionsDefaults(
        { aa: 1, bb: {}, cc: [] },
        { aa: 2, bb: { cc: 2 }, cc: [1, 2] }
      );
      EXPORTS.assert(options.aa === 1);
      EXPORTS.assert(options.bb.cc === 2);
      EXPORTS.assert(JSON.stringify(options.cc) === '[]');
      onEventError();
    },

    setOptionsOverrides: function (options, overrides) {
      /*
        this function recursively walks through the overrides tree,
        and sets override values to the options tree
      */
      Object.keys(overrides || {}).forEach(function (key) {
        var options2, overrides2;
        overrides2 = overrides[key];
        if (overrides2 === undefined) {
          return;
        }
        if (typeof overrides2 !== 'object' || overrides === null || Array.isArray(overrides2)) {
          options[key] = overrides2;
          return;
        }
        options2 = options[key];
        if (!options2 || typeof options2 !== 'object') {
          options2 = options[key] = {};
        }
        local.setOptionsOverrides(options2, overrides2);
      });
      return options;
    },

    _setOptionsOverrides_default_test: function (onEventError) {
      /*
        this function tests setOptionsDefault's default behavior
      */
      var options;
      options = EXPORTS.setOptionsOverrides(
        { aa: 1, bb: { cc: 2 }, dd: [3, 4] },
        { aa: 5, bb: { dd: 6 }, dd: [7, 8], ff: {} }
      );
      EXPORTS.assert(options.aa === 5);
      EXPORTS.assert(options.bb.cc === 2);
      EXPORTS.assert(options.bb.dd === 6);
      EXPORTS.assert(JSON.stringify(options.dd) === '[7,8]');
      EXPORTS.assert(JSON.stringify(options.ff) === '{}');
      onEventError();
    },

    stringAscii: '\x00\x01\x02\x03\x04\x05\x06\x07\b\t\n\x0b\f\r\x0e\x0f'
      + '\x10\x11\x12\x13\x14\x15\x16\x17\x18\x19\x1a\x1b\x1c\x1d\x1e\x1f'
      + ' !"#$%&\'()*+,-./0123456789:;<=>?'
      + '@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_'
      + '`abcdefghijklmnopqrstuvwxyz{|}~\x7f',

    stringToCamelCase: function (text) {
      /*
        this function converts dashed names to camel-case
      */
      return text.replace((/-[a-z]/g), function (match) {
        return match[1].toUpperCase();
      });
    },

    _stringToCamelCase_default_test: function (onEventError) {
      EXPORTS.assert(EXPORTS.stringToCamelCase('') === '');
      EXPORTS.assert(EXPORTS.stringToCamelCase('aa-bb-cc') === 'aaBbCc');
      onEventError();
    },

    templateFormat: function (template, dict) {
      /*
        this function runs basic templating on a template with a given dict
      */
      return template.replace((/\{\{\w+\}\}/g), function (key) {
        var value;
        value = dict[key.slice(2, -2)];
        return typeof value === 'string' ? value : key;
      });
    },

    _templateFormat_default_test: function (onEventError) {
      /*
        this function tests templateFormat's default behavior
      */
      EXPORTS.assert(EXPORTS.templateFormat('{{aa}}', { aa: 1 }) === '{{aa}}');
      EXPORTS.assert(EXPORTS.templateFormat('{{aa}}', { aa: 'bb' }) === 'bb');
      onEventError();
    },

    tryCatch: function (callback, onEventError) {
      /*
        this function helps achieve 100% code coverage
      */
      var data;
      try {
        data = callback();
      } catch (error) {
        return onEventError(error);
      }
      return onEventError(null, data);
    },

    _tryCatch_errorHandling_test: function (onEventError) {
      /*
        this function tests tryCatch's error-handling behavior
      */
      EXPORTS.tryCatch(function () {
        throw new Error();
      }, function (error) {
        onEventError(!error);
      });
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

    _urlDecodeOrError_errorHandling_test: function (onEventError) {
      /*
        this function tests urlDecodeOrError's error-handling behavior
      */
      EXPORTS.assert(EXPORTS.urlDecodeOrError(EXPORTS.stringAscii) instanceof Error);
      onEventError();
    },

    urlPathNormalizeOrError: function (url) {
      /*
        this function normalizes a url or returns an error
      */
      if (url.length <= 4096) {
        url = (/[^#&?]*/).exec(encodeURI(url))[0];
        if (url && url.length <= 256 && !(/\.\/|\.$/).test(url)) {
          return url.replace((/\/\/+/), '/').replace((/\/$/), '');
        }
      }
      return new Error('invalid url');
    },

    _urlPathNormalizeOrError_errorHandling_test: function (onEventError) {
      /*
        this function tests urlPathNormalizeOrError's error-handling behavior
      */
      EXPORTS.assert(EXPORTS.urlPathNormalizeOrError('../') instanceof Error);
      onEventError();
    },

    uuid4: function () {
      /*
        this function returns uuid4 string of form xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
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
      EXPORTS.initModule(module, local);
    },

    _initTest: function () {
      EXPORTS.testModule(local);
    },

    ajax: function (options, onEventError) {
      /*
        this function makes an ajax request, and auto-concats the response stream into utf8 text
      */
      options.url0 = options.url0 || options.url;
      if (options.data) {
        options.method = options.type = options.method || options.type || 'POST';
      }
      /* browser */
      if (state.isBrowser) {
        required.utility2._ajaxProgressOnEventError(options, onEventError);
        return;
      }
      /* nodejs */
      required.utility2._ajaxNodejs(options, onEventError);
    },

    _ajax_default_test: function (onEventError) {
      /*
        this function tests ajax's default behavior
      */
      EXPORTS.ajax({ url: state.localhost + '/test/test.echo' }, onEventError);
    },

    ajaxMultiParams: function (options, onEventError) {
      /*
        this function makes multiple ajax calls for multiple params
      */
      var params, urlParsed;
      /* remove hash-tag from url */
      urlParsed = (/[^#]*/).exec(options.url)[0].split('?');
      params = [{}];
      (urlParsed[1] || '').split('&').forEach(function (value) {
        var dict, ii, key;
        value = value.split('=');
        key = value[0];
        value = value[1];
        for (ii = params.length - 1; ii >= 0; ii -= 1) {
          dict = params[ii];
          if (dict[key] && !(options.unique && dict[key] === value)) {
            dict = EXPORTS.objectCopyDeep(dict);
            params.push(dict);
          }
          dict[key] = value;
        }
      });
      options.urls = params.map(function (dict) {
        return urlParsed[0] + '?' + Object.keys(dict).sort().map(function (key) {
          return key + '=' + dict[key];
        }).join('&');
      });
      EXPORTS.ajaxMultiUrls(options, onEventError);
    },

    _ajaxMultiParams_errorHandling_test: function (onEventError) {
      /*
        this function tests ajaxMultiParams's error-handling behavior
      */
      EXPORTS.ajaxMultiParams({
        url: '/test/test.error'
      }, function (error) {
        if (error) {
          onEventError();
        }
      });
    },

    _ajaxMultiParams_multi_test: function (onEventError) {
      /*
        this function tests ajaxMultiParams's multi-ajax requests behavior
      */
      EXPORTS.ajaxMultiParams({
        url: '/test/test.echo?aa=1&aa=2&bb=3&bb=4&cc=5#dd=6'
      }, function (error, data, options, remaining) {
        EXPORTS.assert((/^GET \/test\/test\.echo\?aa=.&bb=.&cc=. /).test(data));
        if (remaining === 0) {
          onEventError();
        }
      });
    },

    _ajaxMultiParams_multiError_test: function (onEventError) {
      /*
        this function tests ajaxMultiParams's multi error-handling behavior
      */
      EXPORTS.ajaxMultiParams({
        url: '/test/test.error?aa=1&aa=2&bb=3&bb=4&cc=5#dd=6'
      }, function (error) {
        if (error) {
          onEventError();
        }
      });
    },

    _ajaxMultiParams_nullCase_test: function (onEventError) {
      /*
        this function tests ajaxMultiParams's null-case behavior
      */
      EXPORTS.ajaxMultiParams({
        url: '/test/test.echo'
      }, onEventError);
    },

    ajaxMultiUrls: function (options, onEventError) {
      /*
        this function makes multiple ajax calls for multiple urls
      */
      var _onEventError, remaining;
      if (!(options && options.urls && Array.isArray(options.urls) && options.urls.length)) {
        onEventError(new Error('invalid urls'));
        return;
      }
      _onEventError = function (error, data, options) {
        if (remaining < 0) {
          return;
        }
        if (error) {
          remaining = -1;
          onEventError(error, null, options);
          return;
        }
        remaining.splice(remaining.indexOf(options.url0), 1);
        /* debug remaining urls */
        console.log('ajaxMultiUrls - received: ' + options.url0 + ', remaining: ['
          + remaining.slice(0, 2) + (remaining.length ? ', ...]' : ']'));
        onEventError(null, data, options, remaining.length);
      };
      remaining = EXPORTS.objectCopyDeep(options.urls);
      options.urls.forEach(function (url) {
        var options2;
        options2 = EXPORTS.objectCopyDeep(options);
        options2.url = url;
        EXPORTS.ajax(options2, _onEventError);
      });
    },

    _ajaxMultiUrls_errorHandling_test: function (onEventError) {
      /*
        this function tests ajaxMultiUrls's error-handling behavior
      */
      EXPORTS.ajaxMultiUrls({}, function (error) {
        onEventError(!error);
      });
    }

  };
  local._init();
}());



(function moduleAssertShared() {
  /*
    this shared module exports the assert api
  */
  'use strict';
  var local;
  local = {

    _name: 'utility2.moduleAssertShared',

    _init: function () {
      EXPORTS.initModule(module, local);
    },

    _initTest: function () {
      EXPORTS.testModule(local);
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
        this function tests assert's default behavior
      */
      EXPORTS.assert(true);
      try {
        EXPORTS.assert(false);
      } catch (error) {
        onEventError(!error);
      }
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
      EXPORTS.initModule(module, local);
    },

    _initTest: function () {
      EXPORTS.testModule(local);
    },

    Cache: function (options) {
      /*
        this Cache class has lru-like cache behavior,
        but with O(1) average case gets and sets
      */
      if (!(this instanceof local.Cache)) {
        return new local.Cache(options);
      }
      EXPORTS.assert(options.size >= 2, 'size must be greater than or equal to 2');
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
        this function tests Cache's default behavior
      */
      var cache;
      /* coverage - don't use the "new" keyword */
      cache = EXPORTS.Cache({ size: 2 });
      EXPORTS.assert(cache.remaining === 2);
      cache.setItem('aa', 1);
      EXPORTS.assert(cache.remaining === 1);
      EXPORTS.assert(Object.keys(cache.cache1).length === 1);
      EXPORTS.assert(Object.keys(cache.cache2).length === 1);
      cache.setItem('bb', 2);
      EXPORTS.assert(cache.remaining === 0);
      EXPORTS.assert(Object.keys(cache.cache1).length === 2);
      EXPORTS.assert(Object.keys(cache.cache2).length === 2);
      cache.setItem('cc', 3);
      EXPORTS.assert(cache.remaining === 1);
      EXPORTS.assert(Object.keys(cache.cache1).length === 3);
      EXPORTS.assert(Object.keys(cache.cache2).length === 1);
      EXPORTS.assert(cache.getItem('aa'));
      EXPORTS.assert(cache.remaining === 0);
      EXPORTS.assert(Object.keys(cache.cache1).length === 3);
      EXPORTS.assert(Object.keys(cache.cache2).length === 2);
      cache.setItem('dd', 4);
      EXPORTS.assert(cache.remaining === 1);
      EXPORTS.assert(Object.keys(cache.cache1).length === 3);
      EXPORTS.assert(Object.keys(cache.cache2).length === 1);
      cache.setItem('ee', 5);
      EXPORTS.assert(cache.remaining === 0);
      EXPORTS.assert(Object.keys(cache.cache1).length === 4);
      EXPORTS.assert(Object.keys(cache.cache2).length === 2);
      EXPORTS.assert(cache.getItem('bb') === undefined);
      EXPORTS.assert(cache.remaining === 0);
      EXPORTS.assert(Object.keys(cache.cache1).length === 4);
      EXPORTS.assert(Object.keys(cache.cache2).length === 2);
      onEventError();
    }

  };
  local._init();
}());



(function moduleDeferCallbackShared() {
  /*
    this shared module exports the deferCallback api
  */
  'use strict';
  var local;
  local = {

    _name: 'utility2.moduleDeferCallbackShared',

    _init: function () {
      EXPORTS.initModule(module, local);
    },

    _initTest: function () {
      EXPORTS.testModule(local);
    },

    deferCallback: function (key, mode, callback) {
      /*
        this function defers a callback until a resume event is fired
      */
      var self;
      self = state.deferCallbackDict = state.deferCallbackDict || {};
      self = self[key] = self[key] || { callbacks: [], pause: true };
      switch (mode) {
      case 'delete':
        delete state.deferCallbackDict[key];
        break;
      case 'defer':
        self.callbacks.push(callback);
        if (!self.pause) {
          local._deferCallbackResume(self);
        }
        break;
      case 'error':
        self.error = callback;
        local._deferCallbackResume(self);
        break;
      case 'mode':
        return self.error ? 'error' : self.pause ? 'pause' : 'resume';
      case 'pause':
        self.pause = !self.error;
        break;
      case 'reset':
        self.error = null;
        self.pause = true;
        break;
      case 'resume':
        local._deferCallbackResume(self);
        break;
      default:
        throw new Error('unknown mode - ' + mode);
      }
    },

    _deferCallbackResume: function (self) {
      /*
        this function resumes callbacks on the deferCallback object
      */
      self.pause = false;
      while (self.callbacks.length) {
        self.callbacks.shift()(self.error);
      }
    },

    _deferCallback_default_test: function (onEventError) {
      /*
        this function tests deferCallback's default behavior
      */
      var key;
      key = EXPORTS.uuid4();
      EXPORTS.deferCallback(key, 'pause');
      EXPORTS.assert(EXPORTS.deferCallback(key, 'mode') === 'pause');
      EXPORTS.deferCallback(key, 'resume');
      EXPORTS.assert(EXPORTS.deferCallback(key, 'mode') === 'resume');
      EXPORTS.deferCallback(key, 'defer', function (error) {
        onEventError(error);
        EXPORTS.deferCallback(key, 'delete');
      });
    },

    _deferCallback_errorHandling_test: function (onEventError) {
      /*
        this function tests deferCallback's error-handling behavior
      */
      var error, key;
      key = EXPORTS.uuid4();
      error = new Error();
      EXPORTS.deferCallback(key, 'resume');
      EXPORTS.deferCallback(key, 'error', error);
      EXPORTS.deferCallback(key, 'reset');
      EXPORTS.deferCallback(key, 'error', error);
      EXPORTS.deferCallback(key, 'defer', function (error) {
        onEventError(!error);
        EXPORTS.deferCallback(key, 'delete');
      });
    },

    _deferCallback_unknownMode_test: function (onEventError) {
      /*
        this function tests deferCallback's unknown mode error-handling behavior
      */
      var key;
      key = EXPORTS.uuid4();
      try {
        EXPORTS.deferCallback(key, 'unknown mode');
      } catch (error) {
        onEventError(!error);
        EXPORTS.deferCallback(key, 'delete');
      }
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
      EXPORTS.initModule(module, local);
    },

    _initTest: function () {
      EXPORTS.testModule(local);
    },

    testMock: function (global2, test) {
      /*
        this function mocks the global state while running tests
      */
      var backup;
      /* mock global state */
      backup = {};
      /* additional mocks */
      required.utility2._testMock(global2);
      Object.keys(EXPORTS.setOptionsDefaults(global2, {
        global: { setInterval: EXPORTS.testThrowError, setTimeout: EXPORTS.testThrowError }
      })).forEach(function (key1) {
        backup[key1] = {};
        Object.keys(global2[key1]).forEach(function (key2) {
          backup[key1][key2] = global[key1][key2];
          global[key1][key2] = global2[key1][key2];
        });
      });
      /* run test */
      EXPORTS.tryCatch(test, EXPORTS.onEventErrorDefault);
      /* restore global state */
      Object.keys(backup).forEach(function (key1) {
        Object.keys(backup[key1]).forEach(function (key2) {
          global[key1][key2] = backup[key1][key2];
        });
      });
    },

    _testMock: EXPORTS.nop,

    testModule: function (local2) {
      /*
        this function runs tests on a module
      */
      var environment, _onEventFinishTestSuite, remaining, testSuite, timeout;
      if (!(state.isTest || local2._isTest)) {
        return;
      }
      environment = state.isBrowser ? 'browser' : 'nodejs';
      _onEventFinishTestSuite = function () {
        clearTimeout(timeout);
        remaining = -1;
        state.testSuiteRemaining -= 1;
        /* timeout remaining tests */
        Object.keys(testSuite.testCases).forEach(function (test) {
          test = testSuite.testCases[test];
          /* test timeout */
          if (!test.finished) {
            test.time = Date.now() - test.time;
            testSuite.failures += 1;
            testSuite.tests += 1;
            console.error('\n' + testSuite.environment, 'test failed -',
              local2._name + '.' + test.name);
            test.failure = 'test timeout - ' + state.timeoutDefault;
            EXPORTS.onEventErrorDefault(new Error(test.failure));
          }
        });
        /* finish test suites */
        if (state.testSuiteRemaining <= 0) {
          state.testSuiteRemaining = 0;
          EXPORTS.testReport();
        }
      };
      remaining = 0;
      testSuite = {
        environment: environment,
        failures: 0,
        name: environment + '.' + local2._name,
        passed: 0,
        skipped: 0,
        testCases: {},
        tests: 0,
        time: 0
      };
      Object.keys(local2).forEach(function (test) {
        var _onEventError;
        if (test.slice(-5) !== '_test') {
          return;
        }
        _onEventError = function (error) {
          if (test.finished) {
            error = new Error('test callback used multiple times');
          } else {
            remaining -= 1;
            test.finished = true;
            test.time = (Date.now() - test.time) / 1000;
          }
          /* test skipped */
          if (error === 'skip') {
            testSuite.skipped += 1;
            test.skipped = 'skipped';
          /* test failed */
          } else if (error) {
            testSuite.failures += 1;
            console.error('\n' + testSuite.environment, 'test failed -',
              local2._name + '.' + test.name);
            EXPORTS.onEventErrorDefault(error);
            test.failure = error.stack || error.message || error;
          /* test passed */
          } else {
            testSuite.passed += 1;
          }
          /* finished testing */
          if (remaining === 0) {
            _onEventFinishTestSuite();
          }
        };
        if (remaining === 0) {
          state.testSuiteRemaining = state.testSuiteRemaining || 0;
          state.testSuiteRemaining += 1;
        }
        remaining += 1;
        /* enqueue test */
        test = testSuite.testCases[test] = { name: test, time: Date.now() };
        setTimeout(function () {
          try {
            local2[test.name](_onEventError);
          } catch (error) {
            _onEventError(error);
          }
        });
      });
      if (remaining) {
        /* add test suite */
        state.testSuiteList = state.testSuiteList || [];
        state.testSuiteList.push(testSuite);
        /* add timeout to test suite */
        timeout = setTimeout(_onEventFinishTestSuite, state.timeoutDefault);
      }
    },

    testReport: function () {
      /*
        this function creates a test report
      */
      var result;
      result = '\n';
      state.testSuiteList.forEach(function (testSuite) {
        result += [testSuite.environment, 'tests -', testSuite.failures, 'failed /',
          testSuite.skipped, 'skipped /', testSuite.passed, 'passed in', testSuite.name]
          .join(' ') + '\n';
      });
      console.log(result);
      if (state.isBrowser) {
        /* upload test report */
        EXPORTS.ajax({
          data: JSON.stringify({
            coverage: global.__coverage__,
            testSuiteList: state.testSuiteList
          }),
          url: '/test/test.upload'
        }, EXPORTS.onEventErrorDefault);
        /* reset code coverage */
        if (global.__coverage__) {
          global.__coverage__ = {};
        }
      } else {
        required.utility2._testReport(state.testSuiteList);
      }
      /* reset test suites */
      state.testSuiteList.length = 0;
    }

  };
  local._init();
}());



(function moduleUrlParams() {
  /*
    this shared module exports the urlParams api
  */
  'use strict';
  var local;
  local = {

    _name: 'utility2.moduleUrlSearch',

    _init: function () {
      EXPORTS.initModule(module, local);
    },

    _initTest: function () {
      EXPORTS.testModule(local);
    },

    urlParamsGetItem: function (url, key, delimiter) {
      /*
        this function gets a param from the input url
      */
      return EXPORTS.urlParamsParse(url, delimiter).params[key] || '';
    },

    _urlParamsGetItem_default_test: function (onEventError) {
      /*
        this function tests urlParamsGetItem's default behavior
      */
      onEventError(EXPORTS.urlParamsGetItem('/aa#bb=cc%2B', 'bb', '#') === 'cc+' ? null
        : new Error());
    },

    urlParamsParse: function (url, delimiter) {
      /*
        this function parses a url into path / params components
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
        key = EXPORTS.urlDecodeOrError(match[1]);
        value = EXPORTS.urlDecodeOrError(match[2]);
        if (!((key instanceof Error) || (value instanceof Error))) {
          params[key] = value;
        }
      }
      return { params: params, path: url };
    },

    urlParamsParsedJoin: function (parsed, delimiter) {
      /*
        this function joins path / params components into a single url
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
        this function removes a param from the input url
      */
      var parsed;
      parsed = EXPORTS.urlParamsParse(url, delimiter);
      parsed.params[key] = null;
      return EXPORTS.urlParamsParsedJoin(parsed, delimiter);
    },

    _urlParamsRemoveItem_default_test: function (onEventError) {
      /*
        this function tests urlParamsRemoveItem's default behavior
      */
      EXPORTS.assert(EXPORTS.urlParamsRemoveItem('/aa#bb=1&cc=2', 'bb', '#') === '/aa#cc=2');
      onEventError();
    },

    urlParamsSetItem: function (url, key, value, delimiter) {
      /*
        this function sets a param to the input url
      */
      var parsed;
      parsed = EXPORTS.urlParamsParse(url, delimiter);
      parsed.params[key] = value;
      return EXPORTS.urlParamsParsedJoin(parsed, delimiter);
    },

    _urlParamsSetItem_default_test: function (onEventError) {
      /*
        this function tests urlParamsSetItem's default behavior
      */
      EXPORTS.assert(EXPORTS.urlParamsSetItem('/aa', 'bb', 'cc+', '#')
        === '/aa#bb=cc%2B');
      EXPORTS.assert(EXPORTS.urlParamsSetItem('/aa#bb=1', 'cc', 'dd+', '#')
        === '/aa#bb=1&cc=dd%2B');
      onEventError();
    }

  };
  local._init();
}());



(function moduleInitShared() {
  /*
    this shared module inits utility2
  */
  'use strict';
  var local;
  local = {

    _name: 'utility2.moduleInitShared',

    _init: function () {
      EXPORTS.initModule(module, local);
    },

    _initOnce: function () {
      /* exports */
      /* global default timeout */
      state.timeoutDefault = state.timeoutDefault || 30 * 1000;
      if (!state.isNodejs) {
        /* don't wait for server initialization, because it doesn't exist */
        EXPORTS.deferCallback('serverDefer', 'resume');
      }
      /* browser initialization */
      local._initOnceBrowser();
      /* debug */
      global.onEventError = EXPORTS.onEventErrorDefault;
    },

    _initOnceBrowser: function () {
      /*
        this function runs browser initialization code once
      */
      if (!state.isBrowser) {
        return;
      }
      /* cache element id */
      $('[id]').each(function (ii, target) {
        state[target.id] = state[target.id] || $(target);
      });
      /* override globals */
      EXPORTS.setOptionsOverrides(global, global.globalOverride);
      /*
        bug - phantomjs - new Blob() throws error
        https://github.com/ariya/phantomjs/issues/11013
      */
      try {
        EXPORTS.nop(new global.Blob());
      } catch (error) {
        global.Blob = local._Blob;
      }
      /* browser test flag - watch */
      state.isTest = (/\btestWatch=(\d+)\b/).exec(location.hash);
      if (state.isTest) {
        /* increment watch counter */
        location.hash = EXPORTS.urlParamsSetItem(location.hash, 'testWatch',
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
    },

    _initTest: function () {
      EXPORTS.testModule(local);
    },

    _Blob: function (aFileParts, options) {
      /*
        this function replaces the buggy phantomjs Blob class constructor
      */
      var BlobBuilder, oBuilder;
      BlobBuilder = global.BlobBuilder || global.WebKitBlobBuilder || global.MozBlobBuilder
        || global.MSBlobBuilder;
      oBuilder = new BlobBuilder();
      if (aFileParts) {
        oBuilder.append(aFileParts[0]);
      }
      return options ? oBuilder.getBlob(options.type) : oBuilder.getBlob();
    }

  };
  local._init();
}());



(function moduleXhrProgressBrowser() {
  /*
    this browser module provides a drop-in replacement for jQuery.ajax
    with an automatic progress meter
  */
  'use strict';
  var local;
  local = {

    _name: 'utility2.moduleXhrProgressBrowser',

    _init: function () {
      if (!state.isBrowser) {
        return;
      }
      EXPORTS.initModule(module, local);
    },

    _initOnce: function () {
      /* css */
      $(document.head).append('<style>\n'
        + '#divXhrProgress {\n'
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
        + '}\n'
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
        while (local._xhrProgressList.length) {
          local._xhrProgressList.pop().abort();
        }
      });
    },

    _initTest: function () {
      EXPORTS.testModule(local);
    },

    _ajaxProgressOnEventError: function (options, onEventError) {
      /*
        this function runs ajax calls with a progress meter
        usage:
        local._ajaxProgressOnEventError({
          data: 'hello world',
          type: 'POST',
          url: '/upload/foo.txt'
        }, EXPORTS.onEventErrorDefault);
      */
      /* ajax xss via proxy */
      if ((/^https*:/).test(options.url)) {
        options.url = '/proxy/proxy.ajax/' + options.url;
      }
      /* binary file */
      if (options.file && !options.data) {
        local._ajaxProgressOnEventErrorFile(options, onEventError);
        return;
      }
      options.contentType = options.contentType || 'application/octet-stream';
      options.dataType = options.dataType || 'text';
      options.type = options.type || options.method;
      options.xhr = options.xhr || local._xhrProgress;
      if (options.params) {
        options.url = EXPORTS.urlParamsParsedJoin({
          params: options.params,
          path: options.url
        });
      }
      /* debug */
      if (options.debugFlag || state.debugFlag) {
        console.log(options);
      }
      $.ajax(options).done(function (data, textStatus, xhr) {
        switch (options.dataType) {
        case 'statusCode':
          onEventError(null, xhr.status, options);
          return;
        }
        onEventError(null, data, options);
      }).fail(function (xhr, textStatus, errorMessage) {
        switch (options.dataType) {
        case 'statusCode':
          /* ignore error, if all we want is the status code */
          if (xhr.status) {
            onEventError(null, xhr.status, options);
            return;
          }
          break;
        }
        onEventError(new Error(xhr.status + ' ' + textStatus + ' - ' + options.url + '\n'
          + (xhr.responseText || errorMessage)), null, options);
      });
    },

    _ajaxProgressOnEventError_fileUpload_test: function (onEventError) {
      /*
        this function tests ajaxProgressOnEventError's file upload behavior
      */
      var blob;
      blob = new global.Blob(['hello world']);
      blob.name = 'test.txt';
      EXPORTS.ajax({
        file: blob,
        url: '/admin/admin.upload'
      }, onEventError);
    },

    _ajaxProgressOnEventErrorFile: function (options, onEventError) {
      /*
        this function uploads a file
      */
      var reader;
      options.headers = options.headers || {};
      options.headers['upload-filename'] = options.file.name;
      options.processData = false;
      reader = new global.FileReader();
      reader.onload = function (event) {
        /*jslint bitwise: true*/
        var data, ii, ui8a;
        data = event.target.result;
        ui8a = new global.Uint8Array(data.length);
        for (ii = 0; ii < data.length; ii += 1) {
          ui8a[ii] = data.charCodeAt(ii) & 0xff;
        }
        options.data = ui8a;
        local._ajaxProgressOnEventError(options, onEventError);
      };
      reader.readAsBinaryString(options.file);
    },

    _onEventEnd: function (event) {
      /*
        this function runs event-handling for ending the ajax request
      */
      switch (event.type) {
      case 'load':
        local._xhrProgressStatus('100%', 'progress-bar-success', 'success');
        break;
      default:
        local._xhrProgressStatus('100%', 'progress-bar-danger', event.type);
      }
      /* hide progress bar */
      if (!local._xhrProgressList.length) {
        /* allow the final status to be shown for a short time before hiding */
        setTimeout(function () {
          if (!local._xhrProgressList.length) {
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
      local._xhrProgressStatus(
        100 - 100 / (local._progress) + '%',
        'progress-bar-info',
        'loading'
      );
    },

    _xhrProgress: function () {
      /*
        this function creates a special xhr object with progress event-handling
      */
      var xhr;
      xhr = new XMLHttpRequest();
      /* event handling */
      function _onEvent(event) {
        switch (event.type) {
        case 'abort':
        case 'error':
        case 'timeout':
          local._xhrProgressListRemove(xhr);
          local._onEventEnd(event);
          break;
        case 'load':
          local._xhrProgressListRemove(xhr);
          if (local._xhrProgressList.length) {
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
      if (!local._xhrProgressList.length) {
        local._progress = 1;
        local._xhrProgressStatus('0%', 'progress-bar-info', 'loading');
        /* bug - delay displaying progress bar to prevent it from showing 100% width */
        setTimeout(function () {
          if (local._xhrProgressList.length) {
            local._divXhrProgress.show();
          }
        }, 1);
      }
      local._onEventProgress({}, xhr);
      local._xhrProgressList.push(xhr);
      return xhr;
    },

    _xhrProgressList: [],

    _xhrProgressListRemove: function (xhr) {
      /*
        this function removes the xhr from the progress list
      */
      var list, ii;
      list = local._xhrProgressList;
      ii = list.indexOf(xhr);
      if (ii >= 0) {
        list.splice(ii, 1);
      }
    },

    _xhrProgressStatus: function (width, type, label) {
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
      EXPORTS.initModule(module, local);
    },

    _initOnce: function () {
      if (!(state.isBrowser && location.pathname === '/admin/admin.html')) {
        return;
      }
      /* event handling */
      state.inputAdminUpload.on("change", function (event) {
        EXPORTS.ajax({
          file: event.target.files[0],
          method: "POST",
          url: "/admin/admin.upload"
        });
        /* reset input */
        $(event.target).val('');
      });
    },

    _initTest: function () {
      EXPORTS.testModule(local);
    },

    adminEval: function (script, onEventError) {
      /*
        this function remotely evals javascript code on server
      */
      EXPORTS.ajax({ data: script, url: "/admin/admin.eval" }, onEventError);
    },

    _adminEval_default_test: function (onEventError) {
      /*
        this function tests adminEval's default behavior
      */
      EXPORTS.adminEval('null', onEventError);
    },

    adminExit: function (options, onEventError) {
      /*
        this function remotely evals javascript code on server
      */
      EXPORTS.ajax({ params: options, url: "/admin/admin.exit" }, onEventError);
    },

    _adminExit_default_test: function (onEventError) {
      /*
        this function tests adminExit's default behavior
      */
      EXPORTS.adminExit({ mock: '1' }, onEventError);
    },

    adminShell: function (script, onEventError) {
      /*
        this function remotely executes shell commands on server
      */
      EXPORTS.ajax({ data: script, url: "/admin/admin.shell" }, onEventError);
    },

    _adminShell_default_test: function (onEventError) {
      /*
        this function tests adminShell's default behavior
      */
      EXPORTS.adminShell('echo', onEventError);
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
      EXPORTS.initModule(module, local);
    },

    _initOnce: function () {
      /* require */
      EXPORTS.requireModules([
        /* require internal */
        'child_process',
        'crypto',
        'fs',
        'http',
        'https',
        'net',
        'path',
        'repl',
        'stream',
        'tls',
        'url',
        'util',
        'vm',
        'zlib',
        /* require external */
        'connect',
        'cssmin',
        'graceful-fs',
        'istanbul',
        'mime',
        'moment',
        'phantomjs',
        'sqlite3',
        'uglify-js'
      ]);
      /* require utility2-external */
      required.utility2_external = required.utility2_external
        || require(__dirname + '/bower_components/utility2-external');
      [
        'utility2-external.shared.js'
      ].forEach(function (file) {
        EXPORTS.jsEvalFileSyncOnEventError(
          required.utility2_external.__dirname + '/' + file,
          EXPORTS.onEventErrorDefault
        );
      });
      /* maxSockets */
      required.http.globalAgent.maxSockets = 256;
      required.https.globalAgent.maxSockets = 256;
      /* override required.fs with required.graceful_fs */
      required.fs = required.graceful_fs;
      /* init istanbul */
      if (required.istanbul) {
        required.istanbul_Instrumenter = required.istanbul_Instrumenter
          || new required.istanbul.Instrumenter();
      }
      /* init sqlite3 */
      state.dbSqlite3 = new required.sqlite3.cached.Database(':memory:');
      /* init uglify-js*/
      required.uglify_js_compressor = required.uglify_js.Compressor();
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
      process.argv.forEach(function (arg, ii, argv) {
        var value;
        value = argv[ii + 1];
        if ((/^--[a-z]/).test(arg)) {
          /* --no-foo -> state.isFoo = false */
          if ((/^--no-[a-z]/).test(arg)) {
            state[EXPORTS.stringToCamelCase('is' + arg.slice(4))] = false;
          /* --foo bar -> state.isFoo = bar */
          } else if (value && !(/^--[a-z]/).test(value)) {
            state[EXPORTS.stringToCamelCase(arg.slice(2))] = isNaN(Number(value))
              ? value
              : Number(value);
          /* --foo -> state.isFoo = true */
          } else {
            state[EXPORTS.stringToCamelCase('is' + arg.slice(1))] = true;
          }
        }
      });
      /* load package.json file */
      EXPORTS.tryCatch(function () {
        /*jslint stupid: true*/
        state.packageJson = {};
        state.packageJson = JSON.parse(required.fs.readFileSync(process.cwd()
          + '/package.json'));
      }, EXPORTS.onEventErrorDefault);
      /* load default state */
      state.stateDefault = state.packageJson.stateDefault || {};
      EXPORTS.setOptionsDefaults(state, EXPORTS.objectCopyDeep(state.stateDefault));
      /* update dynamic, override state from external url every 60 seconds */
      state.stateOverride = state.stateOverride || {};
      EXPORTS.setOptionsOverrides(state, state.stateOverride || {});
      state.stateOverrideUrl = state.stateOverrideUrl || '/state/stateOverride.json';
      EXPORTS.deferCallback('serverDefer', 'defer', function () {
        setTimeout(function () {
          EXPORTS.clearCallSetInterval('stateOverrideUpdate', function () {
            EXPORTS.ajax({
              dataType: 'json',
              headers: { authorization: 'Basic ' + state.securityBasicAuthSecret },
              url: state.stateOverrideUrl
            }, function (error, data) {
              if (error) {
                EXPORTS.onEventErrorDefault(error);
                return;
              }
              EXPORTS.setOptionsOverrides(state.stateOverride, data);
              EXPORTS.setOptionsOverrides(state, EXPORTS.objectCopyDeep(state.stateOverride));
              console.log('loaded override config from ' + state.stateOverrideUrl);
            });
          }, 5 * 60 * 1000);
        });
      });
      /* load js files */
      if (state.loadFiles) {
        state.loadFiles.split(',').forEach(function (file) {
          /*jslint stupid: true*/
          var _onEventError;
          _onEventError = EXPORTS.onEventErrorDefault;
          EXPORTS.tryCatch(function () {
            EXPORTS.jsEvalOnEventError(file, required.fs.readFileSync(file), _onEventError);
          }, _onEventError);
        });
      }
      if (state.isTest) {
        EXPORTS.debugProcessOnce();
      }
      /* exit on timeout */
      if (state.timeExit) {
        state.timeoutExit = state.timeExit - Date.now();
      }
      if (state.timeoutExit) {
        state.timeoutExit = Number(state.timeoutExit);
        EXPORTS.assert(!isNaN(state.timeoutExit));
        state.timeExit = Date.now() + state.timeoutExit;
        setTimeout(process.exit, state.timeoutExit);
      }
    },

    _initTest: function () {
      EXPORTS.testModule(local);
    },

    debugProcessOnce: function () {
      /*
        this function prints debug info about the current process once
      */
      if (state.debugProcessOnced) {
        return;
      }
      state.debugProcessOnced = true;
      console.log(['process.cwd()', process.cwd()]);
      console.log(['process.pid', process.pid]);
      console.log(['process.argv', process.argv]);
      console.log(['process.env', process.env]);
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
            EXPORTS.onEventErrorDefault(error);
            return;
          }
          /* bump up timestamp */
          EXPORTS.timestamp = new Date().toISOString();
          /* test watch */
          state.testWatchList = state.testWatchList || [];
          state.testWatchList.forEach(function (response) {
            response.write('data:\n\n');
          });
          content2 = content.replace(/^#/, '//#');
          /* code coverage instrumentation */
          if (required.istanbul && global.__coverage__ && file.name.slice(-3) === '.js') {
            /*jslint stupid: true*/
            content2 = required.istanbul_Instrumenter.instrumentSync(content2, file.name);
          }
          /* run action */
          (file.action || []).forEach(function (action) {
            switch (action) {
            /* eval the file in global context */
            case 'eval':
              if (mode !== 'noEval') {
                EXPORTS.jsEvalOnEventError(file.name, content2, EXPORTS.onEventErrorDefault);
              }
              break;
            /* css / js lint file - csslint / jslint npm module must be installed */
            case 'lint':
              EXPORTS.lintScript(file.name, content2);
              break;
            default:
              /* action is a function call */
              action(file.name, content, content2);
            }
          });
          /* run copy action */
          (file.copy || []).forEach(function (file2) {
            EXPORTS.fsWriteFileAtomic(file2, content, null, EXPORTS.onEventErrorDefault);
          });
          /* run copyx action */
          (file.copyx || []).forEach(function (file2) {
            EXPORTS.fsWriteFileAtomic(file2, content, { mode: '777' },
              EXPORTS.onEventErrorDefault);
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
        ['action', 'copy', 'copyx'].forEach(function (key) {
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

    jsUglify: function (file, script) {
      /*
        this function uglifies a js script
      */
      var ast, result;
      ast = required.uglify_js.parse(script, { filename: file });
      ast.figure_out_scope();
      /* compress */
      ast.transform(required.uglify_js_compressor);
      /* mangle */
      ast.figure_out_scope();
      ast.compute_char_frequency();
      ast.mangle_names();
      /* output */
      result = required.uglify_js.OutputStream();
      ast.print(result);
      return result.toString();
    },

    _jsUglify_default_test: function (onEventError) {
      /*
        this function tests jsUglify's default behavior
      */
      EXPORTS.assert(EXPORTS.jsUglify('test.js', 'console.log("hello world");')
        === 'console.log("hello world");');
      onEventError();
    },

    requireModules: function (modules) {
      /*
        this function requires the given modules and caches them in the global.required object
      */
      modules.forEach(function (module) {
        var module2;
        module2 = module.replace((/\W/g), '_');
        try {
          required[module2] = required[module2] || require(module);
        } catch (errorRequire) {
          console.log('module not loaded - ' + module);
        }
      });
    },

    shell: function (options) {
      /*
        this function provides a quick and dirty way to execute shell scripts
      */
      var child;
      if (options.verbose !== false) {
        console.log(['shell', options]);
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
      required.fs.writeFile(state.fsDirPid + '/' + child.pid, '', EXPORTS.onEventErrorDefault);
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
    },

    streamWriteSplice: function (writable, onEventData) {
      /*
        this function overrides the writable stream's internal _write function,
        splicing the written chunk to onEventData
      */
      var _write;
      _write = writable._write.bind(writable);
      writable._write = function (chunk, encoding, callback) {
        _write(chunk, encoding, callback);
        /* splice chunk to onEventData */
        onEventData(chunk);
      };
    },

    timeoutExitRemaining: function () {
      /*
        this function returns amout of timeout remaining before process.exit
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
      EXPORTS.initModule(module, local);
    },

    _initOnce: function () {
      /*jslint stupid: true*/
      /* exports */
      state.fsDirTmp = required.path.resolve(state.fsDirTmp || process.cwd() + '/tmp');
      try {
        /* create cache dir */
        state.fsDirCache = state.fsDirTmp + '/cache';
        EXPORTS.fsMkdirpSync(state.fsDirCache);
        /* create pid dir */
        state.fsDirPid = state.fsDirTmp + '/pid';
        EXPORTS.fsMkdirpSync(state.fsDirPid);
        /* kill stale pid's from previous process */
        required.fs.readdirSync(state.fsDirPid).forEach(function (file) {
          try {
            process.kill(file);
          } catch (ignore) {
          }
          required.fs.unlink(state.fsDirPid + '/' + file, EXPORTS.nop);
        });
      } catch (error) {
        EXPORTS.onEventErrorDefault(error);
      }
      /* periodically clean up cache directory */
      EXPORTS.clearCallSetInterval('fsCacheCleanup', local._fsCacheCleanup, 60 * 60 * 1000);
      /* remove old coverage reports */
      EXPORTS.fsRmrAtomic(process.cwd() + '/tmp/coverage', EXPORTS.nop);
      /* remove old test reports */
      EXPORTS.fsRmrAtomic(process.cwd() + '/tmp/test', EXPORTS.nop);
    },

    _initTest: function () {
      EXPORTS.testModule(local);
    },

    createFsCacheFilename: function (dir, key) {
      /*
        this function creates a temp filename in the cache directory
      */
      return (dir || state.fsDirCache) + '/' + encodeURIComponent(key || EXPORTS.dateAndSalt());
    },

    _fsCacheCleanup: function () {
      /*
        this function cleans up the cache directory
      */
      /* remove files from cache directory */
      (state.fsDirCacheList || []).forEach(function (file) {
        local._fsRmr(state.fsDirCache + '/' + file, EXPORTS.onEventErrorDefault);
      });
      /* get list of files to be removed for the next cycle */
      required.fs.readdir(state.fsDirCache, function (error, files) {
        state.fsDirCacheList = files;
      });
    },

    fsCacheWritestream: function (readable, options, onEventError) {
      /*
        this function writes data from a readable stream to a unique cache file
      */
      var cache;
      cache = EXPORTS.createFsCacheFilename();
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
        this function creates a directory, along with any missing sub-directories
      */
      required.fs.mkdir(dir, function (error) {
        if (!error) {
          onEventError();
          return;
        }
        switch (error.code) {
        /* ignore error that directory already exists */
        case 'EEXIST':
          onEventError();
          break;
        case 'ENOENT':
          /* recursively create missing sub-directories */
          EXPORTS.fsMkdirp(EXPORTS.fsDirname(dir), function (error) {
            if (error) {
              onEventError(error);
              return;
            }
            EXPORTS.fsMkdirp(dir, onEventError, true);
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
          EXPORTS.fsMkdirpSync(EXPORTS.fsDirname(dir));
          EXPORTS.fsMkdirpSync(dir);
          break;
        default:
          throw error;
        }
      }
    },

    fsRename: function (file1, file2, onEventError) {
      /*
        this function renames a file, while auto-creating missing directories
      */
      required.fs.rename(file1, file2, function (error) {
        if (!error) {
          onEventError();
          return;
        }
        /* fallback - retry after creating missing directory */
        if (error.code === 'ENOENT') {
          EXPORTS.fsMkdirp(EXPORTS.fsDirname(file2), function (error) {
            if (error) {
              onEventError(error);
              return;
            }
            /* retry */
            required.fs.rename(file1, file2, onEventError);
          });
          return;
        }
        /* default behavior */
        onEventError(error);
      });
    },

    _fsRmr: function (dir, onEventError) {
      /*
        this function recursively removes a file / directory
      */
      required.fs.unlink(dir, function (error) {
        if (!error || error.code === 'ENOENT') {
          onEventError();
          return;
        }
        required.fs.readdir(dir, function (error, files) {
          var _recurse, remaining;
          if (error) {
            onEventError(error);
            return;
          }
          if (!files.length) {
            /* empty directory */
            required.fs.rmdir(dir, onEventError);
            return;
          }
          remaining = files.length;
          _recurse = function (file) {
            /* recurse */
            local._fsRmr(dir + '/' + file, function (error) {
              if (remaining < 0) {
                return;
              }
              if (error) {
                remaining = -1;
                onEventError(error);
                return;
              }
              remaining -= 1;
              if (remaining === 0) {
                remaining = -1;
                required.fs.rmdir(dir, onEventError);
              }
            });
          };
          files.forEach(_recurse);
        });
      });
    },

    fsRmrAtomic: function (dir, onEventError) {
      /*
        this function atomically removes a file / directory,
        by first renaming it to a cache directory, and then removing it afterwards
      */
      var cache;
      cache = EXPORTS.createFsCacheFilename();
      required.fs.rename(dir, cache, function (error) {
        if (error) {
          onEventError(error.code === 'ENOENT' && error);
          return;
        }
        /* recursively remove file / directory after rename */
        local._fsRmr(cache, onEventError);
      });
    },

    fsWriteFileAtomic: function (file, data, options, onEventError) {
      /*
        this function atomically writes data to a file,
        by first writing to a unique cache file, and then renaming it,
        while auto-creating missing directories
      */
      var cache;
      cache = EXPORTS.createFsCacheFilename();
      options = options || {};
      options.flag = 'wx';
      /* write data */
      required.fs.writeFile(cache, data, options, function (error) {
        if (!error) {
          EXPORTS.fsRename(cache, file, onEventError);
          return;
        }
        /* fallback - retry after creating missing directory */
        if (error.code === 'ENOENT') {
          EXPORTS.fsMkdirp(EXPORTS.fsDirname(file), function (error) {
            if (error) {
              onEventError(error);
              return;
            }
            /* retry */
            required.fs.writeFile(cache, data, options, onEventError);
          });
          return;
        }
        /* default error-handling behavior */
        onEventError(error);
      });
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
      EXPORTS.initModule(module, local);
    },

    _initTest: function () {
      EXPORTS.testModule(local);
    },

    'routerSecurityDict_/admin': function (request, response, next) {
      /*
        this function handles admin security
      */
      if (EXPORTS.securityBasicAuthValidate(request)) {
        next();
        return;
      }
      EXPORTS.serverRespondDefault(response, 303, 'text/plain', '/signin?redirect='
        + encodeURIComponent(request.url));
    },

    'routerDict_/admin/admin.eval': function (request, response, next) {
      /*
        this function evals javascript code
      */
      EXPORTS.fsCacheWritestream(request, null, function (error, tmp) {
        if (error) {
          next(error);
          return;
        }
        required.fs.readFile(tmp, function (error, data) {
          if (error) {
            next(error);
            return;
          }
          EXPORTS.jsEvalOnEventError(tmp, data, function (error, data) {
            if (error) {
              next(error);
              return;
            }
            response.end(EXPORTS.jsonStringifyCircular(data));
          });
        });
      });
    },

    'routerDict_/admin/admin.exit': function (request, response) {
      /*
        this function causes the application to exit
      */
      setTimeout(request.urlParsed.params.mock ? EXPORTS.nop : process.exit, 1000);
      response.end();
    },

    'routerDict_/admin/admin.shell': function (request, response, next) {
      /*
        this function runs shell scripts
      */
      EXPORTS.fsCacheWritestream(request, null, function (error, tmp) {
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
    },

    'routerDict_/admin/admin.upload': function (request, response, next) {
      /*
        this function uploads a file into the ./tmp/upload/ directory by default
      */
      EXPORTS.fsCacheWritestream(request, null, function (error, tmp) {
        if (error) {
          next(error);
          return;
        }
        EXPORTS.fsRename(tmp, state.fsDirTmp + '/upload/' + request.headers['upload-filename']
          || '', function (error) {
            if (error) {
              next(error);
              return;
            }
            response.end();
          });
      });
    },

    'routerAssetsDict_/admin/admin.html': function (request, response) {
      /*
        this function serves the asset admin.html
      */
      EXPORTS.serverRespondDefault(response, 200, 'text/html', local._adminHtml);
    },

    _adminHtml: '<!DOCTYPE html><html><head>\n'
      + '<link href="/public/assets/utility2-external/external.rollup.auto.css" rel="stylesheet"/>\n'
      + '<style>\n'
      + '</style></head><body>\n'
      + '<input id="inputAdminUpload" type="file"/>\n'
      + '<script src="/public/assets/utility2-external/external.rollup.auto.js"></script>\n'
      + '<script src="/public/assets/utility2.js"></script>\n'
      + '</body></html>'

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
      EXPORTS.initModule(module, local);
    },

    _initTest: function () {
      EXPORTS.testModule(local);
    },

    _ajaxNodejs: function (options, onEventError) {
      /*
        this function implements the ajax function in nodejs
      */
      /* localhost */
      var _onEventError, timeout, urlParsed;
      _onEventError = function (error, data) {
        var response;
        if (timeout < 0) {
          return;
        }
        clearTimeout(timeout);
        timeout = -1;
        /* debug */
        response = options.response;
        options.response = null;
        if (options.debugFlag) {
          console.log([
            '_ajaxNodejs',
            options.url,
            response && response.statusCode,
            response && response.headers
          ]);
        }
        onEventError(error, data, options);
      };
      /* set timeout */
      timeout = setTimeout(_onEventError,
        options.timeout || state.timeoutDefault,
        EXPORTS.createErrorTimeout());
      /* cached file */
      if (options.cache && options.cache !== 'miss') {
        required.fs.readFile(EXPORTS.createFsCacheFilename(options.cacheDir, options.url0),
          function (error, data) {
            options.cache = 'miss';
            if (error) {
              local._ajaxNodejs(options, _onEventError);
              return;
            }
            options.cache = 'hit';
            local._onEventErrorData(options, _onEventError, null, data);
          });
        return;
      }
      /* file uri scheme */
      if (options.url.slice(0, 7) === 'file://') {
        local._ajaxNodejsFile(options, _onEventError);
        return;
      }
      if (options.url[0] === '/') {
        EXPORTS.deferCallback('serverDefer', 'defer', function (error) {
          if (error) {
            _onEventError(error);
            return;
          }
          options.url = state.localhost + options.url;
          EXPORTS.ajax(options, _onEventError);
        });
        return;
      }
      /* set default options */
      urlParsed = required.url.parse(options.proxy || options.url || '');
      /* assert valid http / https url */
      if (!(/^https*:$/).test(urlParsed.protocol)) {
        _onEventError(new Error('invalid url - ' + (options.proxy || options.url)));
        return;
      }
      options.hostname = urlParsed.hostname;
      options.path = options.proxy ? options.url : urlParsed.path;
      options.protocol = urlParsed.protocol || 'http:';
      options.rejectUnauthorized = options.rejectUnauthorized === undefined ? false : undefined;
      if (options.params) {
        options.path = EXPORTS.urlParamsParsedJoin({
          params: options.params,
          path: options.path
        });
      }
      options.port = urlParsed.port;
      /* simulate making ajax request and print debug info, but do not actually do anything */
      if (options.debugFlag === 'simulate') {
        console.log(['_ajaxNodejs', options]);
        return;
      }
      /* socks5 */
      if (required.utility2._socks5Ajax(options, _onEventError)) {
        return;
      }
      local._ajaxNodejsRequest(options, _onEventError);
    },

    _isTest: 1,

    _ajaxNodejs_cache_test: function (onEventError) {
      /*
        this function tests ajaxNodejs's cache behavior
      */
      var url;
      url = '/test/test.echo?' + EXPORTS.uuid4();
      EXPORTS.ajax({ cache: true, url: url }, function (error, data, options) {
        error = error || options.cache !== 'cached';
        EXPORTS.nop(error ? onEventError(error) : (function () {
          EXPORTS.ajax({ cache: true, url: url }, function (error, data, options) {
            onEventError(error || options.cache !== 'hit');
          });
        }()));
      });
    },

    _ajaxNodejs_fileUriScheme_test: function (onEventError) {
      /*
        this function tests ajaxNodejs's file uri scheme behavior
      */
      EXPORTS.ajax({
        url: 'file://localhost/' + state.fsFileTestHelloJson
      }, function (error, data) {
        onEventError(error || (data !== '"hello world"'));
      });
    },

    __ajaxNodejs_serverResumeError_test: function (onEventError) {
      /*
        this function tests _ajaxNodejs's server resume on error behavior
      */
      EXPORTS.deferCallback('serverDefer', 'resume');
      EXPORTS.deferCallback('serverDefer', 'error', new Error());
      EXPORTS.ajax({
        url: '/test/test.echo'
      }, function (error) {
        EXPORTS.deferCallback('serverDefer', 'reset');
        EXPORTS.deferCallback('serverDefer', 'resume');
        onEventError(error ? null : new Error());
      });
    },

    _ajaxNodejs_timeout_test: function (onEventError) {
      /*
        this function tests ajaxNodejs's timeout behavior
      */
      EXPORTS.ajax({
        timeout: 1,
        url: '/test/test.timeout'
      }, function (error) {
        onEventError(EXPORTS.isErrorTimeout(error) ? null : new Error());
      });
    },

    _ajaxNodejsFile: function (options, onEventError) {
      /*
        this function implements the ajax function in nodejs for the file uri scheme
      */
      required.fs.readFile(options.url.replace(/^file:\/\/[^\/]*/, ''),
        options,
        function (error, data) {
          local._onEventErrorData(options, onEventError, error, data);
        });
    },

    _ajaxNodejsRequest: function (options, onEventError) {
      /*
        this function runs the actual ajax request
      */
      var request;
      request = options.protocol === 'https:' ? required.https : required.http;
      request = request.request(options, function (response) {
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
        console.log(['_ajaxNodejs', options]);
      }
    },

    _onEventErrorData: function (options, onEventError, error, data) {
      /*
        this function handles error / data received by ajax request
      */
      if (error) {
        onEventError(error);
        return;
      }
      if (options.response && options.response.statusCode >= 400) {
        onEventError(new Error((options.method || 'GET') + ' - ' + options.url
          + ' - ' + options.response.statusCode + ' - ' + data.toString()));
        return;
      }
      /* cache data */
      if (options.cache === 'miss') {
        EXPORTS.fsWriteFileAtomic(EXPORTS.createFsCacheFilename(options.cacheDir, options.url0),
          data,
          null,
          function (error) {
            options.cache = error ? 'error' : 'cached';
            local._onEventErrorData(options, onEventError, error, data);
          });
        return;
      }
      switch (options.dataType) {
      case 'binary':
        break;
      /* try to JSON.parse the response */
      case 'json':
        data = EXPORTS.jsonParseOrError(data);
        if (data instanceof Error) {
          /* or if parsing fails, pass an error with offending url */
          onEventError(new Error('invalid json data from ' + options.url));
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
      options.response = response;
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
            onEventError(new Error('too many http redirects - '
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
          EXPORTS.ajax(options, onEventError);
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
      EXPORTS.streamReadOnEventError(readStream, function (error, data) {
        local._onEventErrorData(options, onEventError, error, data);
      });
    }

  };
  local._init();
}());



(function moduleLintNodejs() {
  /*
    this nodejs module exports the lint api
  */
  'use strict';
  var local;
  local = {

    _name: 'utility2.moduleLintNodejs',

    _init: function () {
      if (!state.isNodejs) {
        return;
      }
      EXPORTS.initModule(module, local);
    },

    _initTest: function () {
      EXPORTS.testModule(local);
    },

    _lintCss: function (file, script) {
      /*
        this function lints a css script for errors
      */
      console.log(global.CSSLint.getFormatter('text').formatResults(
        global.CSSLint.verify(
          script || '',
          { ignore: 'ids' }
        ),
        file,
        { quiet: true }
      ));
      return script;
    },

    _lintJs: function (file, script) {
      /*
        this function lints a js script for errors
      */
      var JSLINT, pad;
      JSLINT = global.JSLINT;
      if (!global.__coverage__ && !JSLINT(script)) {
        console.log('\n' + file);
        JSLINT.errors.forEach(function (error, ii) {
          pad = "#" + String(ii + 1);
          while (pad.length < 3) {
            pad = ' ' + pad;
          }
          if (error) {
            console.log(pad + ' ' + error.reason);
            console.log('    ' + (error.evidence || '').replace(/^\s+|\s+$/, "") + ' \/\/ Line '
              + error.line + ', Pos ' + error.character);
          }
        });
      }
      return script;
    },

    lintScript: function (file, script) {
      /*
        this function lints css / html / js / json scripts
      */
      switch (required.path.extname(file)) {
      case '.css':
        return local._lintCss(file, script);
      default:
        return local._lintJs(file, script);
      }
    },

    _lintScript_css_test: function (onEventError) {
      /*
        this function tests lintScript's css lint behavior
      */
      EXPORTS.lintScript('foo.css', '\n');
      onEventError();
    },

    _lintScript_js_test: function (onEventError) {
      /*
        this function tests lintScript's js lint behavior
      */
      var coverage;
      coverage = global.__coverage__;
      global.__coverage__ = null;
      EXPORTS.lintScript('foo.js', '\n');
      global.__coverage__ = coverage;
      onEventError();
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
      EXPORTS.initModule(module, local);
    },

    _initOnce: function () {
      EXPORTS.nop(require.main === module && required.utility2._rollupFileCommandLine());
    },

    _rollupFileCommandLine: function () {
      /*
        this function rollup files given by command-line
      */
      var _onEventError, remaining;
      if (!state.rollup) {
        return;
      }
      _onEventError = function (error) {
        if (remaining < 0) {
          return;
        }
        if (error) {
          remaining = -1;
          EXPORTS.onEventErrorDefault(error);
          process.exit();
          return;
        }
        remaining -= 1;
        if (remaining === 0) {
          remaining = -1;
          process.exit();
        }
      };
      remaining = 0;
      state.rollup.split(',').forEach(function (file) {
        if (!file) {
          return;
        }
        remaining += 1;
        local._rollupFile(file, _onEventError);
      });
      if (remaining === 0) {
        remaining += 1;
        _onEventError();
      }
    },

    _initTest: function () {
      EXPORTS.testModule(local);
    },

    _rollupFile: function (file, onEventError) {
      /*
        this function rolls up a css / js file
      */
      console.log('updating rollup file ... ' + file);
      required.fs.readFile(file, 'utf8', function (error, content) {
        if (error) {
          onEventError(error);
          return;
        }
        var dict, options;
        dict = {};
        content = (/[\S\s]+?\n\}\(\)\);\n/).exec(content);
        content = EXPORTS.lintScript(file + '.js', content && content[0].trim());
        EXPORTS.jsEvalOnEventError(file, content, function (error, data) {
          if (error) {
            onEventError(error);
            process.exit();
          }
          options = data;
        });
        EXPORTS.ajaxMultiUrls({
          cache: true,
          cacheDir: state.fsDirTmp + '/rollup',
          urls: options.urls
        }, function (error, data, options, remaining) {
          if (error) {
            onEventError(error);
            return;
          }
          dict[options.url0] = data;
          if (remaining === 0) {
            /* additional css parsing */
            if (file.slice(-4) === '.css') {
              local._rollupFileCss(file, onEventError, content, options, dict);
              return;
            }
            local._rollupFileConcat(file, onEventError, content, options, dict);
          }
        });
      });
    },

    __rollupFile_cssRollup_test: function (onEventError) {
      /*
        this function tests _rollupFile's css rollup behavior
      */
      var file = state.fsDirCache + '/test.rollup.css';
      EXPORTS.fsWriteFileAtomic(file, '(function () {\n'
        + '    "use strict";\n'
        + '    return { urls: ["/test/test.css", "' + state.localhost + '/test/test.css"] };\n'
        + '}());\n', null, function () {
          local._rollupFile(file, onEventError);
        });
    },

    __rollupFile_jsRollup_test: function (onEventError) {
      /*
        this function tests _rollupFile's js rollup behavior
      */
      var file = state.fsDirCache + '/test.rollup.js';
      EXPORTS.fsWriteFileAtomic(file, '(function () {\n'
        + '    "use strict";\n'
        + '    return { urls: ["/test/test.js", "' + state.localhost + '/test/test.js"] };\n'
        + '}());\n', null, function () {
          local._rollupFile(file, onEventError);
        });
    },

    _rollupFileCss: function (file, onEventError, content, options, dict) {
      /*
        this function runs additional rollup steps for css scripts
      */
      var remaining;
      remaining = 0;
      options.urls.forEach(function (url1) {
        var dataUris, text;
        dataUris = {};
        text = dict[url1];
        text.replace((/\burl\(([^)]+)\)/g), function (match, url2) {
          url2 = required.path.resolve('/' + EXPORTS.fsDirname(url1) + '/'
            + url2.replace((/["']/g), '')).replace((/^\/(https*:\/)/), '$1/');
          dataUris[url2] = dataUris[url2] || {};
          dataUris[url2][match] = null;
        });
        remaining += 1;
        EXPORTS.ajaxMultiUrls({
          cache: true,
          cacheDir: state.fsDirTmp + '/rollup',
          dataType: 'binary',
          urls: Object.keys(dataUris)
        }, function (error, data, options2, remaining2) {
          if (remaining < 0) {
            return;
          }
          if (error) {
            remaining = -1;
            onEventError(error);
            return;
          }
          data = 'url(\n"data:' + EXPORTS.mimeLookup(file) + ';base64,'
            + data.toString('base64') + '"\n)';
          Object.keys(dataUris[options2.url0]).forEach(function (match) {
            text = text.replace(new RegExp(match.replace((/(\W)/g), '\\$1'), 'g'), data);
          });
          dict[url1] = text;
          if (remaining2 === 0) {
            remaining -= 1;
            if (remaining === 0) {
              remaining = -1;
              local._rollupFileConcat(file, onEventError, content, options, dict);
            }
          }
        });
      });
    },

    _rollupFileConcat: function (file, onEventError, content, options, dict) {
      /*
        this function concats the rollup content and writes it back to file
      */
      /* concat data to content */
      options.urls.forEach(function (url) {
        content += '\n\n/* module - ' + url + ' */\n' + dict[url].trim();
      });
      /* remove trailing whitespace */
      content = content.replace((/[\t\r ]+$/gm), '').trim();
      /* write to file */
      EXPORTS.fsWriteFileAtomic(file, content, null, onEventError);
    }

  };
  local._init();
}());



(function moduleSocks5AjaxNodejs() {
  /*
    this nodejs module exports the socks5Ajax api
  */
  'use strict';
  var local;
  local = {

    _name: 'utility2.moduleSocks5AjaxNodejs',

    _init: function () {
      if (!state.isNodejs) {
        return;
      }
      EXPORTS.initModule(module, local);
    },

    _initTest: function () {
      EXPORTS.testModule(local);
    },

    _socks5Ajax: function (options, onEventError) {
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
        return;
      }
      EXPORTS.deferCallback('socks5Defer', 'defer', function (error) {
        if (error) {
          onEventError(error);
          return;
        }
        local._socks5AjaxResume(options, onEventError);
      });
      return true;
    },

    _socks5AjaxResume: function (options, onEventError) {
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
          onEventError(new Error('socks5Ajax - request failed'));
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
          EXPORTS.ajax(options, onEventError);
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
          EXPORTS.ajax(options, onEventError);
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

    __socks5Ajax_socks5_test: function (onEventError) {
      /*
        this function tests _socks5Ajax's socks5 behavior
      */
      if (!(state.socks5ServerPort && state.isNpmTest)) {
        onEventError('skip');
        return;
      }
      EXPORTS.ajax({ url: state.localhost2 + '/test/test.echo' }, onEventError);
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
    }

  };
  local._init();
}());



(function moduleSocks5ServerNodejs() {
  /*
    this nodejs module exports the socks5Server api
  */
  'use strict';
  var local;
  local = {

    _name: 'utility2.moduleSocks5ServerNodejs',

    _init: function () {
      if (!state.isNodejs) {
        return;
      }
      EXPORTS.initModule(module, local);
    },

    _initOnce: function () {
      /* create a random socks5 port for npm test */
      EXPORTS.socks5ServerRestart(state.socks5ServerPort, state.socks5SshHost);
    },

    _initTest: function () {
      EXPORTS.testModule(local);
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
        console.log('_socks5ServerOnEventSocket - proxying ' + host + ':' + port);
        proxy = required.net.connect(port, host).on('error', _onEventError);
        /* write leftover chunk from current read to proxy connection */
        proxy.write(chunk.slice(8 + chunk[7] + 2));
        proxy.pipe(self);
        self.pipe(proxy);
      };
      _onEventError = function (error) {
        if (!ended) {
          ended = true;
          EXPORTS.onEventErrorDefault(error);
          self.removeListener('data', _onEventData);
          self.end('HTTP/1.1 500 Internal Server Error\r\n\r\n');
          EXPORTS.nop(proxy && proxy.end());
        }
      };
      self
        .on('data', _onEventData)
        .on('error', _onEventError)
        .write('\u0005\u0000\u0005\u0000\u0000\u0001\u0000\u0000\u0000\u0000\u0000\u0000');
    },

    __socks5ServerOnEventSocket_errorHandling_test: function (onEventError) {
      /*
        this function tests _socks5ServerOnEventSocket's error-handling behavior
      */
      EXPORTS.testMock({ console: { error: EXPORTS.nop } }, function () {
        local._socks5ServerOnEventSocket({
          end: EXPORTS.nop,
          on: function (event, onEvent) {
            if (event === 'error') {
              this.onEventError = onEvent;
            }
            return this;
          },
          removeListener: EXPORTS.nop,
          write: function () {
            this.onEventError(new Error());
            onEventError();
          }
        });
      });
    },

    socks5ServerRestart: function (port, sshHost) {
      /*
        this function restarts the socks5 server
      */
      if (state.isNpmTest) {
        sshHost = null;
      }
      state.socks5ServerPort = port || state.socks5ServerPort || (sshHost ? 'random' : null);
      /* invalid port */
      if (!state.socks5ServerPort) {
        EXPORTS.deferCallback('socks5Defer', 'resume');
        return;
      }
      /* random server port */
      if (state.socks5ServerPort === 'random') {
        state.socks5ServerPort = EXPORTS.serverPortRandom();
      }
      /* pause socks5 proxy */
      EXPORTS.deferCallback('socks5Defer', 'pause');
      /* start ssh socks5 proxy server */
      if (sshHost) {
        local._socks5ServerRestartSsh(sshHost);
        return;
      }
      /* close old socks5 server */
      if (state.socks5Server) {
        state.socks5Server.close();
      }
      /* start socks5 proxy server */
      state.socks5Server = required.net.createServer(local._socks5ServerOnEventSocket);
      state.socks5Server.listen(state.socks5ServerPort, function () {
        EXPORTS.deferCallback('socks5Defer', 'resume');
        console.log('socks5 server started on port ' + state.socks5ServerPort);
      });
    },

    _socks5ServerRestartSsh: function (sshHost) {
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
      state.socks5SshPid = EXPORTS.shell({
        script: 'ssh -D ' + state.socks5ServerPort + ' -o StrictHostKeyChecking=no -p '
          + (state.socks5SshPort) + ' ' + state.socks5SshHostname,
        stdio: ['pipe', 'pipe', 'pipe']
      }).pid;
      EXPORTS.clearCallSetInterval('socks5Defer', function (timeout) {
        /* timeout error-handling */
        if (timeout) {
          EXPORTS.deferCallback(
            'socks5Defer',
            'error',
            EXPORTS.createErrorTimeout('socks5 proxy timeout')
          );
          return;
        }
        required.utility2._socks5AjaxResume({
          hostname: 'www.google.com',
          url: 'http://www.google.com'
        }, function (error) {
          if (!error) {
            EXPORTS.deferCallback('socks5Defer', 'resume');
            EXPORTS.clearCallSetInterval('socks5Defer', 'clear');
          }
        });
      }, 1000, state.timeoutDefault);
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
      EXPORTS.initModule(module, local);
      local._replStart();
    },

    _initTest: function () {
      EXPORTS.testModule(local);
    },

    _replParse: function (script) {
      /* optimization - cached callback */
      var aa, bb;
      /* null -> "(null\n)" */
      if (!/^\(.*\n\)$/.test(script)) {
        return script;
      }
      script = script.slice(1, -2);
      /* @@ syntax sugar */
      while (/\w@@ /.test(script)) {
        script = script.replace(/(\w)@@ ([\S\s]*)/, '$1($2)');
      }
      aa = script.split(' ');
      bb = aa.slice(1).join(' ');
      aa = aa[0];
      switch (aa) {
      /* eval in phantomjs */
      case 'ajaxDebug':
        EXPORTS.ajax({ debugFlag: true, redirect: false, url: bb },
          EXPORTS.onEventErrorDefault);
        return;
      case 'ajaxCache':
        EXPORTS.ajax({ cache: true, url: bb }, EXPORTS.onEventErrorDefault);
        return;
      case 'ajax':
        EXPORTS.ajax({ url: bb }, EXPORTS.onEventErrorDefault);
        return;
      case 'browser':
        EXPORTS.phantomjsEval(bb, EXPORTS.onEventErrorDefault);
        return;
      /* git commands */
      case 'git':
        switch (bb) {
        case 'diff':
          bb = '--no-pager diff';
          break;
        case 'log':
          bb = 'log | head -n 18';
          break;
        }
        EXPORTS.shell({ script: 'git ' + bb, verbose: false });
        return;
      case 'grep':
        EXPORTS.shell({ script: 'find . -type f | grep -v '
          + '"/\\.\\|.*\\b\\(\\.\\d\\|archive\\|artifacts\\|bower_components\\|build'
          + '\\|coverage\\|docs\\|external\\|git_modules\\|jquery\\|log\\|logs\\|min'
          + '\\|node_modules\\|rollup.*\\|swp\\|test\\|tmp\\)\\b" '
          + '| tr "\\n" "\\000" | xargs -0 grep -in ' + JSON.stringify(bb), verbose: false });
        return;
      /* print stringified object */
      case 'print':
        script = 'console.log(String(' + bb + '))';
        break;
      /* sqlite3 commands */
      case 'sql':
        if (bb === '_') {
          console.log(state.dbSqlite3Result);
        } else {
          state.dbSqlite3.all(bb, function (error, rows) {
            if (rows) {
              state.dbSqlite3Result = rows;
            }
            console.log(error || rows);
          });
        }
        return;
      /* execute /bin/sh script in console */
      case '$':
        EXPORTS.shell({ script: bb, verbose: false });
        return;
      }
      return '(' + script + '\n)';
    },

    _replParse_default_test: function (onEventError) {
      if (!state.repl) {
        onEventError('skip');
        return;
      }
      EXPORTS.testMock({
        EXPORTS: { ajax: EXPORTS.nop, phantomjsEval: EXPORTS.nop },
        console: { log: EXPORTS.nop },
        state: { dbSqlite3: { all: function (_, onEventError) {
          onEventError(null, true);
        } } }
      }, function () {
        /*jslint evil: true*/
        state.repl.eval(null, null, null, EXPORTS.nop);
        state.repl.eval('($ ls\n)', null, null, EXPORTS.nop);
        state.repl.eval('(ajax http://www.google.com\n)', null, null, EXPORTS.nop);
        state.repl.eval('(ajaxDebug http://www.google.com\n)', null, null, EXPORTS.nop);
        state.repl.eval('(console.log@@ "hello world"\n)', null, null, EXPORTS.nop);
        state.repl.eval('(browser state\n)', null, null, EXPORTS.nop);
        state.repl.eval('(git diff\n)', null, null, EXPORTS.nop);
        state.repl.eval('(git log\n)', null, null, EXPORTS.nop);
        state.repl.eval('(grep zxqj\n)', null, null, EXPORTS.nop);
        state.repl.eval('(print true\n)', null, null, EXPORTS.nop);
        state.repl.eval('(sql _\n)', null, null, EXPORTS.nop);
        state.repl.eval('(sql SELECT * from myTable\n)', null, null, EXPORTS.nop);
        state.repl.eval('(syntax error\n)', null, null, EXPORTS.nop);
        onEventError();
      });
    },

    _replStart: function () {
      /* start interactive interpreter / debugger */
      if (state.isRepl === true && !state.repl) {
        state.repl = required.repl.start({
          eval: function (script, context, file, onEventError) {
            EXPORTS.jsEvalOnEventError('', required.utility2._replParse(script), onEventError);
          },
          useGlobal: true
        });
        state.repl.context.EXPORTS = EXPORTS;
        state.repl.context.required = required;
      }
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
      EXPORTS.initModule(module, local);
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
      /* 5. middleware assets */
      state.middlewareAssets = state.middlewareAssets
        || local._createMiddleware(state.routerAssetsDict);
      /* 6. middleware test */
      global.routerTestDict = global.routerTestDict || {};
      state.middlewareTest = state.middlewareTest
        || local._createMiddleware(global.routerTestDict);
      /* start server */
      EXPORTS.serverStart();
    },

    _initTest: function () {
      EXPORTS.testModule(local);
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
      if (EXPORTS.securityBasicAuthValidate(request)) {
        next();
        return;
      }
      EXPORTS.serverRespondDefault(response, 303, 'text/plain', '/signin?redirect='
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
      if (EXPORTS.securityBasicAuthValidate(request)) {
        if (request.urlParsed.params.redirect) {
          redirect = EXPORTS.urlDecodeOrError(request.urlParsed.params.redirect);
          if (redirect instanceof Error) {
            next(redirect);
            return;
          }
          EXPORTS.serverRespondDefault(response, 303, 'text/plain', redirect);
          return;
        }
        next();
        return;
      }
      EXPORTS.serverRespondDefault(response, 401, 'text/plain', '401 Unauthorized');
    },

    '_routerSecurityDict_/signin_default_test': function (onEventError) {
      /*
        this function tests routerSecurityDict_/signin_default_test's default behavior
      */
      EXPORTS.testMock({
        routerTestDict: { '/signin': local['routerSecurityDict_/signin'] }
      }, function () {
        state.middlewareTest({
          headers: { host: 'localhost' },
          url: '/signin'
        }, {}, onEventError);
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
      headers = EXPORTS.objectCopyDeep(request.headers);
      url = request.url.replace('/proxy/proxy.ajax/', '');
      urlParsed = required.url.parse(url);
      /* update host header with actual destination */
      headers.host = urlParsed.host;
      EXPORTS.ajax({
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

    'routerAssetsDict_/public': function (request, response, next) {
      /*
        this function serves public assets
      */
      EXPORTS.serverRespondFile(response, process.cwd() + request.urlPathNormalized, next);
    },

    'routerAssetsDict_/public/assets/utility2-external': function (request, response, next) {
      /*
        this function serves public, external assets
      */
      EXPORTS.serverRespondFile(response, required.utility2_external.__dirname
        + request.urlPathNormalized.replace('/utility2-external', ''), next);
    },

    'routerAssetsDict_/public/assets/utility2-external.shared.js': function (request, response, next) {
      /*
        this function serves public, external assets
      */
      EXPORTS.serverRespondFile(response,
        required.utility2_external.__dirname + '/utility2-external.shared.js',
        next);
    },

    'routerAssetsDict_/public/assets/utility2.js': function (request, response) {
      /*
        this function serves the asset utility2.js
      */
      EXPORTS.serverRespondDefault(response, 200, 'application/javascript',
        required.utility2._fileContentBrowser);
    },

    _createMiddleware: function (routerDict) {
      /*
        this function creates a middleware app using the specified route dict
      */
      return function (request, response, next) {
        var path, path0;
        /* debug */
        state.request = request;
        state.response = response;
        /* security - validate path */
        path = request.urlPathNormalized = request.urlPathNormalized
          || EXPORTS.urlPathNormalizeOrError(request.url);
        if (path instanceof Error) {
          next(path);
          return;
        }
        /* parse url search params */
        request.urlParsed = request.urlParsed || EXPORTS.urlParamsParse(request.url);
        /* dyanamic path handler */
        for (path = request.urlPathNormalized; path !== path0; path = EXPORTS.fsDirname(path)) {
          path0 = path = path || '/';
          /* found a handler matching request path */
          if (routerDict[path]) {
            /* debug */
            request.handler = routerDict[path];
            /* process request with error-handling */
            try {
              routerDict[path](request, response, next);
            } catch (error) {
              next(error);
            }
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
        /* call error-handling middleware */
        if (error instanceof Error) {
          EXPORTS.serverRespondDefault(response, 500, 'plain/text', error, next);
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
              /* call static assets middleware */
              state.middlewareAssets(request, response, function (error) {
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
        this function validates a request's basic authentication.
        basic authentication format:
        btoa('Aladdin:open sesame')
        atob('QWxhZGRpbjpvcGVuIHNlc2FtZQ==')
      */
      /* ignore localhost */
      return (/^localhost\b/).test(request.headers.host)
        /* basic auth validation */
        || (/\S*$/).exec(request.headers.authorization || '')[0]
        === state.securityBasicAuthSecret;
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
      case 303:
        response.setHeader('location', data);
        break;
      case 401:
        response.setHeader('www-authenticate', 'Basic realm="Authorization Required"');
        break;
      /* error */
      case 500:
        data = data.stack || data;
        console.error(data);
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
      response.setHeader('content-type', EXPORTS.mimeLookup(file));
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
        state.serverPort = EXPORTS.serverPortRandom();
      }
      /* setup localhost */
      state.localhost = state.localhost || 'http://localhost:' + state.serverPort;
      /* create server */
      state.server = state.server || required.connect().use(EXPORTS.middlewareApplication);
      /* listen on specified port */
      if (state.serverListened) {
        return;
      }
      state.serverListened = true;
      _listen = function (port) {
        EXPORTS.deferCallback('serverDefer', 'pause');
        remaining = remaining || 0;
        remaining += 1;
        state.server.listen(port, function () {
          remaining -= 1;
          console.log('server started on port ' + port);
          if (remaining === 0) {
            EXPORTS.deferCallback('serverDefer', 'resume');
          }
        });
      };
      _listen(state.serverPort);
      state.serverPort2 = state.serverPort2 || EXPORTS.serverPortRandom();
      state.localhost2 = state.localhost2 || 'http://localhost:' + state.serverPort2;
      _listen(state.serverPort2);
    }

  };
  local._init();
}());



(function modulePhantomjsNodejs() {
  /*
    this nodejs module runs the phantomjs test server
  */
  'use strict';
  var local;
  local = {

    _name: 'utility2.modulePhantomjsNodejs',

    _init: function () {
      if (state.isNodejs) {
        EXPORTS.deferCallback('serverDefer', 'defer', function (error) {
          EXPORTS.nop(error
            ? EXPORTS.onEventErrorDefault(error)
            : EXPORTS.initModule(module, local));
        });
      }
    },

    _initOnce: function () {
      EXPORTS.phantomjsRestart();
    },

    _initTest: function () {
      EXPORTS.deferCallback('phantomjsDefer', 'defer', function (error) {
        if (!error) {
          EXPORTS.testModule(local);
        }
      });
    },

    _phantomjsAjax: function (options, onEventError) {
      /*
        this function makes ajax request to the phantomjs test server
      */
      EXPORTS.deferCallback('phantomjsDefer', 'defer', function (error) {
        if (error) {
          onEventError(error);
          return;
        }
        /* bug - headers are case-sensitive in phantomjs */
        options.headers = { 'Content-Length': Buffer.byteLength(options.data) };
        options.url = 'http://localhost:' + state.phantomjsPort + options.url;
        EXPORTS.ajax(options, onEventError);
      });
    },

    __phantomjsAjax_errorHandling_test: function (onEventError) {
      /*
        this function tests _phantomjsAjax's error-handling behavior
      */
      local._phantomjsAjax({ data: '', url: '/error' }, function (error) {
        onEventError(!error);
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

    _phantomjsEval_errorHandling_test: function (onEventError) {
      /*
        this function tests phantomjsEval's error-handling behavior
      */
      EXPORTS.phantomjsEval('syntax error', function (error) {
        onEventError(!error);
      });
    },

    phantomjsRestart: function (file) {
      /*
        this function spawns a phantomjs test server
      */
      EXPORTS.deferCallback('phantomjsDefer', 'reset');
      state.phantomjsPort = EXPORTS.serverPortRandom();
      /* instrument file if coverage is enabled */
      file = file || required.utility2.__filename;
      if (required.istanbul && global.__coverage__ && file === required.utility2.__filename) {
        required.fs.readFile(file, 'utf8', function (error, content) {
          /*jslint stupid: true*/
          var file2;
          file2 = EXPORTS.createFsCacheFilename() + '.js';
          state.phantomjsCoverageFile = EXPORTS.createFsCacheFilename() + '.json';
          EXPORTS.fsWriteFileAtomic(
            file2,
            required.istanbul_Instrumenter.instrumentSync(content, file),
            null,
            function () {
              EXPORTS.phantomjsRestart(file2);
            }
          );
        });
        return;
      }
      /* check every second to see if phantomjs spawn is ready */
      EXPORTS.clearCallSetInterval('phantomjsDefer', function (timeout) {
        /* timeout error */
        if (timeout) {
          EXPORTS.deferCallback('phantomjsDefer', 'error',
            EXPORTS.createErrorTimeout('phantomjs spawn timeout'));
          return;
        }
        EXPORTS.ajax({
          url: 'http://localhost:' + state.phantomjsPort + '/'
        }, function (error) {
          if (!error) {
            EXPORTS.deferCallback('phantomjsDefer', 'resume');
            EXPORTS.clearCallSetInterval('phantomjsDefer', 'clear');
          }
        });
      }, 1000, state.timeoutDefault);
      /* kill old phantomjs process */
      try {
        process.kill(state.phantomjsPid || 99999999);
      } catch (ignore) {
      }
      /* spawn phantomjs process */
      try {
        state.phantomjsPid = EXPORTS.shell(required.phantomjs.path + ' '
          + file + ' ' + EXPORTS.base64Encode(JSON.stringify({
            fsDirCache: state.fsDirCache,
            localhost: state.localhost,
            phantomjsCoverageFile: state.phantomjsCoverageFile,
            phantomjsPort: state.phantomjsPort,
            serverPort: state.serverPort,
            timeoutDefault: state.timeDefault
          })))
          .on('close', function (exitCode) {
            /* error-handling */
            if (exitCode) {
              EXPORTS.deferCallback('phantomjsDefer', 'error', new Error(exitCode));
              EXPORTS.clearCallSetInterval('phantomjsDefer', 'clear');
            }
          }).pid;
        /* phantomjs code coverage */
        setTimeout(function () {
          EXPORTS.phantomjsEval('global.__coverage__ || null', function (error, data) {
            EXPORTS.nop(error
              ? EXPORTS.onEventErrorDefault(error)
              : EXPORTS.coverageExtend(global.__coverage__, data));
          });
        }, EXPORTS.timeoutExitRemaining() - 1000);
      } catch (errorPhantomjs) {
        EXPORTS.deferCallback('phantomjsDefer', 'error', errorPhantomjs);
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
      EXPORTS.phantomjsTestUrl('/test/test.html#testOnce=1', onEventError);
    },

    _phantomjsTestUrl_testWatch_test: function (onEventError) {
      /*
        this function tests phantomjsTestUrl's testWatch behavior
      */
      EXPORTS.nop(state.isNpmTest
        ? EXPORTS.phantomjsTestUrl('/test/test.html#testWatch=1', onEventError)
        : onEventError('skip'));
    }

  };
  local._init();
}());



(function modulePhantomjsPhantomjs() {
  /*
    this phantomjs module runs the phantomjs test server
  */
  'use strict';
  var local;
  local = {

    _name: 'utility2.modulePhantomjsPhantomjs',

    _init: function () {
      if (state.isPhantomjs) {
        EXPORTS.initModule(module, local);
      }
    },

    _initOnce: function () {
      var tmp;
      /* exports */
      required.system = require('system');
      required.webpage = require('webpage');
      required.webserver = require('webserver');
      tmp = JSON.parse(EXPORTS.base64Decode(required.system.args[1]));
      Object.keys(tmp).forEach(function (key) {
        state[key] = tmp[key];
      });
      /* phantomjs server */
      required.webserver.create().listen(state.phantomjsPort, function (request, response) {
        try {
          /* debug */
          state.request = request;
          state.response = response;
          state.routerDict[request.url](request, response, JSON.parse(request.post || '{}'));
        } catch (error) {
          local._serverRespondError(request, response, error);
        }
      });
      console.log('phantomjs server started on port ' + state.phantomjsPort);
    },

    _initTest: function () {
      EXPORTS.testModule(local);
    },

    'routerDict_/': function (request, response) {
      local._serverRespondData(request, response);
    },

    'routerDict_/eval': function (request, response, data) {
      EXPORTS.jsEvalOnEventError('phantomjsEval.js', data.script, function (error, data) {
        if (error) {
          local._serverRespondError(request, response, error);
          return;
        }
        local._serverRespondData(request, response, EXPORTS.jsonStringifyCircular(data));
      });
    },

    'routerDict_/testUrl': function (request, response, data) {
      var page;
      local._serverRespondData(request, response);
      page = required.webpage.create();
      page.onConsoleMessage = console.log;
      page.open(data.url, function (status) {
        console.log('phantomjs open -', status, '-', data.url);
      });
      /* page timeout */
      setTimeout(page.close, state.timeoutDefault);
    },

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
      EXPORTS.onEventErrorDefault(error);
      response.statusCode = 500;
      local._serverRespondData(request, response);
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
      if (state.isNodejs) {
        local._assetTest1x1Png = new Buffer(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAA'
            + 'AApJREFUCB1jYAAAAAIAAc/INeUAAAAASUVORK5CYII=',
          'base64'
        );
        EXPORTS.initModule(module, local);
      }
    },

    _initOnce: function () {
      /*jslint stupid: true */
      /* create mock json test file */
      state.fsFileTestHelloJson = state.fsDirTmp + '/test.hello.json';
      required.fs.writeFileSync(state.fsFileTestHelloJson, '"hello world"');
      /* npm test */
      setTimeout(local._testNpm);
      /* upload coverage to http://coveralls.io */
      setTimeout(local._coverageCoverallsUpload);
    },

    _initTest: function () {
      EXPORTS.testModule(local);
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
        response.write(name + ': ' + JSON.stringify(request.headers[name]) + '\n');
      });
      response.write('\n');
      /* optimization - stream data */
      request.pipe(response);
    },

    'routerDict_/test/test.error': function (request, response) {
      /*
        this function responds with default 500
      */
      EXPORTS.serverRespondDefault(response, 500, null, 'testing server error');
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
        this function tests routerDict_/test/test.timeout's default behavior
      */
      EXPORTS.testMock({
        global: { setTimeout: EXPORTS.callCallback },
        routerTestDict: { '/test/test.timeout': local['routerDict_/test/test.timeout'] }
      }, function () {
        state.middlewareTest({ url: '/test/test.timeout' }, { end: onEventError });
      });
    },

    'routerDict_/test/test.upload': function (request, response, next) {
      /*
        this function receives and parses uploaded test objects
      */
      EXPORTS.streamReadOnEventError(request, function (error, data) {
        error = error || EXPORTS.jsonParseOrError(data);
        if (error instanceof Error) {
          next(error);
          return;
        }
        response.end();
        if (error.testSuiteList) {
          required.utility2._testReport(error.testSuiteList);
        }
        /* extend global.__coverage with uploaded code coverage object */
        EXPORTS.coverageExtend(global.__coverage__, error.coverage);
      });
    },

    '_routerDict_/test/test.upload_default_test': function (onEventError) {
      /*
        this function tests routerDict_/test/test.upload's default behavior
      */
      EXPORTS.testMock({
        EXPORTS: { streamReadOnEventError: function (_, onEventError) {
          onEventError(new Error());
        } },
        routerTestDict: { '/test/test.upload': local['routerDict_/test/test.upload'] }
      }, function () {
        state.middlewareTest({ url: '/test/test.upload' }, {}, function (error) {
          onEventError(!error);
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
        this function tests routerDict_/test/test.watch's default behavior
      */
      EXPORTS.testMock({
        routerTestDict: { '/test/test.watch': local['routerDict_/test/test.watch'] },
        state: { testWatchList: new global.Array(256) }
      }, function () {
        state.middlewareTest({
          headers: { accept: 'text/event-stream' },
          url: '/test/test.watch'
        }, {
          setHeader: EXPORTS.nop,
          write: EXPORTS.nop
        });
        state.middlewareTest({ headers: {}, url: '/test/test.watch' }, {}, onEventError);
      });
    },

    'routerAssetsDict_/test/test.1x1.png': function (request, response) {
      /*
        this function serves the asset test.1x1.png
      */
      EXPORTS.serverRespondDefault(response, 200, 'image/png', local._assetTest1x1Png);
    },

    'routerAssetsDict_/test/test.css': function (request, response) {
      /*
        this function serves the asset test.css
      */
      EXPORTS.serverRespondDefault(response, 200, 'text/css', local._assetTestCss);
    },

    'routerAssetsDict_/test/test.html': function (request, response) {
      /*
        this function serves the asset test.html
      */
      EXPORTS.serverRespondDefault(response, 200, 'text/html',
        EXPORTS.templateFormat(local._assetTestHtml, { globalOverride: JSON.stringify({ state: {
          localhost: state.localhost
        } }) }));
    },

    'routerAssetsDict_/test/test.js': function (request, response) {
      /*
        this function serves the asset test.css
      */
      EXPORTS.serverRespondDefault(response, 200, 'application/javascript',
        required.utility2._fileContentBrowser);
    },

    _assetTestCss: EXPORTS.lintScript('test.css', 'body {\n'
      + 'background-image:url("test.1x1.png");\n'
      + '}\n'),

    _assetTestHtml: '<!DOCTYPE html><html><head>\n'
      + [
        '/public/assets/utility2-external/external.rollup.auto.css'
      ].map(function (url) {
        return '<link href="' + url + '" rel="stylesheet" />\n';
      }).join('')

      + '<style>\n'
      + EXPORTS.lintScript('test.css', '\n')
      + '</style></head><body>\n'
      + '<div id="divTest"></div>\n'
      + '<script>window.globalOverride = {{globalOverride}};</script>\n'

      + [
        '/public/assets/utility2-external/external.rollup.auto.js',
        '/public/assets/utility2-external.shared.js',
        '/public/assets/utility2.js'
      ].map(function (url) {
        return '<script src="' + url + '"></script>\n';
      }).join('')
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
        this function tests coverageExtend's default behavior
      */
      EXPORTS.assert(JSON.stringify(EXPORTS.coverageExtend({}, { aa: 1 })) === '{"aa":1}');
      onEventError();
    },

    _coverageCoverallsUpload: function () {
      /*
        this function uploads code coverage info to http://coveralls.io
      */
      var script;
      if (state.isCoveralls) {
        if (process.env.TRAVIS) {
          script = 'cat tmp/test_coverage/lcov.info | node_modules/coveralls/bin/coveralls.js';
          EXPORTS.shell(script);
          setTimeout(process.exit, state.timeoutDefault);
        } else {
          process.exit();
        }
      }
    },

    _coverageCoverallsUpload_default_test: function (onEventError) {
      /*
        this function tests _coverageCoverallsUpload's default behavior
      */
      EXPORTS.testMock({
        process: { env: { TRAVIS: false } },
        state: { isCoveralls: true }
      }, function () {
        local._coverageCoverallsUpload();
        onEventError();
      });
    },

    _coverageCoverallsUpload_travisCi_test: function (onEventError) {
      /*
        this function tests _coverageCoverallsUpload's travis-ci behavior
      */
      EXPORTS.testMock({
        global: { setTimeout: EXPORTS.callCallback },
        process: { env: { TRAVIS: true } },
        state: { isCoveralls: true }
      }, function () {
        local._coverageCoverallsUpload();
        onEventError();
      });
    },

    _testMock: function (global2) {
      /*
        this function mocks the nodejs global state
      */
      EXPORTS.setOptionsDefaults(global2, {
        EXPORTS: { shell: local._testMock_shell },
        process: { exit: EXPORTS.nop }
      });
    },

    _testMock_shell: function () {
      /*
        this function mocks the nodejs function shell
      */
      return required.child_process.spawn('echo');
    },

    _testNpm: function () {
      /*
        this function runs npm test with code coverage
      */
      var script;
      if (!state.npmTest) {
        return;
      }
      /* run test */
      script = 'rm -r tmp/test_coverage 2>/dev/null;'
        + ' istanbul cover --dir tmp/test_coverage'
        + ' -x **.min.**'
        + ' -x **.rollup.**'
        + ' -x **/git_modules/**'
        + ' -x **/tmp/**'
        + ' ' + state.npmTest + ' --'
        + ' --npm-test'
        + ' --repl'
        + ' --socks5-server-port random'
        + ' --serverPort random'
        + ' --test'
        + ' --timeout-default ' + state.timeoutDefault
        + ' --time-exit ' + state.timeExit;
      EXPORTS.shell(script);
    },

    _testNpm_default_test: function (onEventError) {
      /*
        this function tests testNpm's default behavior
      */
      EXPORTS.testMock({
        global: { setTimeout: EXPORTS.callCallback },
        state: { npmTest: true }
      }, function () {
        local._testNpm();
        onEventError();
      });
    },

    _testReport: function (testSuiteList) {
      var xml;
      xml = '\n<testsuites>\n';
      testSuiteList.forEach(function (testSuite) {
        xml += '<testsuite ';
        ['failures', 'name', 'passed', 'skipped', 'tests'].forEach(function (attribute) {
          xml += attribute + '="' + testSuite[attribute] + '" ';
        });
        xml += '>\n<properties>\n';
        ['environment'].forEach(function (property) {
          xml += '<property name="' + property
            + '" value=' + JSON.stringify(testSuite[property]) + '/>\n';
        });
        xml += '</properties>\n';
        Object.keys(testSuite.testCases).forEach(function (test) {
          test = testSuite.testCases[test];
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
      /* write test report */
      EXPORTS.fsWriteFileAtomic(state.fsDirTmp
        + '/test/result.'
        + encodeURIComponent(EXPORTS.dateAndSalt())
        + '.xml', xml, null, EXPORTS.onEventErrorDefault);
    },

    testThrowError: function () {
      /*
        this function throws a new Error for testing purposes
      */
      throw new Error('testThrowError');
    },

    _testThrowError_default_test: function (onEventError) {
      /*
        this function tests testThrowError's default behavior
      */
      EXPORTS.tryCatch(function () {
        EXPORTS.testThrowError();
      }, function (error) {
        onEventError(!error);
      });
    }

  };
  local._init();
}());
