#!/usr/bin/env node
/*jslint browser: true, indent: 2, nomen: true, regexp: true, todo: true, unparam: true*/
/*global EXPORTS, global, required, state, underscore, $*/
/*
utility2.js
common, shared utilities for both browser and nodejs

todo:
add phantomjsEval
fix failure of browser to send code coverage data on test failure
revamp moduleRollup
emulate localStorage
add shared rollup
add heroku dynamic config server
integrate forever-webui
*/



(function moduleInitializeFirstShared() {
  /*
    this shared module performs initialization before the below modules are loaded
  */
  'use strict';
  var local;
  local = {

    _name: 'utility2.moduleInitializeFirstShared',

    _init: function () {
      try {
        window.global = window.global || window;
      } catch (ignore) {
      }
      /* exports */
      global.EXPORTS = global.EXPORTS || {};
      global.module = global.module || null;
      global.required = EXPORTS.required = EXPORTS.required || global.required || {};
      global.state = EXPORTS.state = EXPORTS.state || global.state || {};
      /* make console.log callable without context */
      console._log = console._log || console.log;
      console.log = function () {
        console._log.apply(console, arguments);
      };
      /* debugPrint */
      global.debugPrint = function (arg) {
        /*
          this global function is used purely for temporary debugging,
          and jslint will nag you to remove it
        */
        console._log.apply(console, arguments);
        return arg;
      };
      /* code coverage for debugPrint */
      global.debugPrint();
      /* underscore */
      global.underscore = global.underscore || global._;
      if (global.process && process.versions) {
        /* nodejs */
        if (process.versions.node) {
          state.isNodejs = true;
          EXPORTS.require = EXPORTS.require || require;
          /* nodejs underscore */
          global.underscore = global.underscore || require('underscore');
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
        if (key[0] === '_') {
          exports[key] = local2[key];
          return;
        }
        /* export global */
        EXPORTS[key] = local2[key];
      });
      /* first-time init */
      state.initOnceDict = state.initOnceDict || {};
      if (!state.initOnceDict[local2._name]) {
        state.initOnceDict[local2._name] = true;
        /* init once */
        if (local2._initOnce) {
          local2._initOnce();
        }
        /* require once */
        if (module && required.utility2._moduleInitOnceNodejs) {
          required.utility2._moduleInitOnceNodejs(module, local2, exports);
        }
      }
      /* run tests */
      setTimeout(function () {
        EXPORTS.deferCallback('serverResume', 'defer', function () {
          EXPORTS.testModule(module, local2, exports);
        });
      });
    },

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
        + 'ZmdoaWprbG1ub3BxcnN0dXZ3eHl6e3x9fg') === EXPORTS.string256);
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
      EXPORTS.assert(EXPORTS.base64Encode(EXPORTS.string256)
        === 'AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD'
          + '0-P0BBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWltcXV5fYGFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6'
          + 'e3x9fg');
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
        if (Date.now() < timeout) {
          callback();
          return;
        }
        callback(timeout);
        clearInterval(dict[key]);
        delete dict[key];
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
      if (Date.now() < timeout) {
        dict[key] = setInterval(_callback, interval);
      }
    },

    _clearCallSetInterval_timeout_test: function (onEventError) {
      /*
        this function tests clearCallSetInterval's timeout behavior
      */
      EXPORTS.clearCallSetInterval(EXPORTS.uuid4(), function (timeout) {
        if (timeout) {
          onEventError();
        }
      }, 100, 400);
    },

    createErrorTimeout: function (message) {
      /*
        this function creates a new timeout error
      */
      var error;
      error = new Error(message || 'timeout error');
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

    jsEvalOnEventError: function (file, script, onEventError) {
      /*
        this function evals a script with auto error-handling
      */
      /*jslint evil: true*/
      var data;
      try {
        data = state.isNodejs ? required.vm.runInThisContext(script, file) : eval(script);
      } catch (error) {
        state.error = error;
        console.error(file);
        onEventError(error);
        return;
      }
      onEventError(null, data);
    },

    _jsEvalOnEventError_default_test: function (onEventError) {
      /*
        this function tests jsEvalOnEventError's default behavior
      */
      EXPORTS.jsEvalOnEventError('', 'null', onEventError);
    },

    _jsEvalOnEventError_syntaxErrorHandling_test: function (onEventError) {
      /*
        this function tests jsEvalOnEventError's syntax error-handling behavior
      */
      EXPORTS.jsEvalOnEventError('', 'syntax error', function (error) {
        EXPORTS.tryCatchOnEventError(function () {
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
        this function performs no operation (nop)
      */
      return;
    },

    _nop_default_test: function (onEventError) {
      /*
        this function tests nop's default behavior
      */
      EXPORTS.nop();
      onEventError();
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
        /* debug */
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
      var error;
      /* mock state */
      error = console.error;
      console.error = EXPORTS.nop;
      /* run test */
      EXPORTS.onEventErrorDefault(new Error());
      /* restore state */
      console.error = error;
      onEventError();
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
        this function recursively walks through the options tree,
        and sets default values for unset leaf nodes
      */
      Object.keys(defaults).forEach(function (key) {
        var value, valueDefault;
        valueDefault = defaults[key];
        value = options[key];
        /* set default value */
        if (value === undefined) {
          options[key] = valueDefault;
        /* recurse if value and default value are both dictionaries */
        } else if (value
            && !Array.isArray(value)
            && typeof value === 'object'
            && typeof valueDefault === 'object') {
          EXPORTS.setOptionsDefaults(value, valueDefault);
        }
      });
      return options;
    },

    _setOptionsDefaults_default_test: function (onEventError) {
      var options;
      options = EXPORTS.setOptionsDefaults({ aa: 1, bb: {}, cc: [] },
        { aa: 2, bb: { cc: 2 }, cc: [1, 2] });
      onEventError(options.aa === 1
          && options.bb.cc === 2
          && JSON.stringify(options.cc) === '[]' ? null : new Error());
    },

    string256: '\u0000\u0001\u0002\u0003\u0004\u0005\u0006\u0007\b\t\n\u000b\f\r\u000e'
      + '\u000f\u0010\u0011\u0012\u0013\u0014\u0015\u0016\u0017\u0018\u0019\u001a\u001b\u001c'
      + '\u001d\u001e\u001f !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_'
      + '`abcdefghijklmnopqrstuvwxyz{|}~',

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
      return template.replace((/\{\{\w+\}\}/g), function (key) {
        var value;
        value = dict[key.slice(2, -2)];
        return typeof value === 'string' ? value : key;
      });
    },

    _templateFormat_default_test: function (onEventError) {
      EXPORTS.assert(EXPORTS.templateFormat('{{aa}}', { aa: 1 }) === '{{aa}}');
      EXPORTS.assert(EXPORTS.templateFormat('{{aa}}', { aa: 'bb' }) === 'bb');
      onEventError();
    },

    tryCatchOnEventError: function (callback, onEventError) {
      /*
        this function helps achieve 100% code coverage
      */
      try {
        onEventError(null, callback());
      } catch (error) {
        onEventError(error);
      }
    },

    _tryCatchOnEventError_errorHandling_test: function (onEventError) {
      /*
        this function tests tryCatchOnEventError's error-handling behavior
      */
      EXPORTS.tryCatchOnEventError(function () {
        throw new Error();
      }, function (error) {
        onEventError(!error);
      });
    },

    urlDecodeOrError: function (text) {
      /*
        this function returns an error if the text cannot be decoded
      */
      if (!text) {
        return '';
      }
      try {
        return decodeURIComponent(text);
      } catch (error) {
        return error;
      }
    },

    urlPathNormalizeOrError: function (url) {
      if (url.length <= 4096) {
        url = (/[^#&?]*/).exec(encodeURI(url))[0];
        if (url && url.length <= 256 && !(/\.\/|\.$/).test(url)) {
          return url.replace((/\/\/+/), '/').replace((/\/$/), '');
        }
      }
      return new Error('invalid url');
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
    },

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

    ajax: function (options, onEventError) {
      /*
        this function makes an ajax request, and auto-concats the response stream into utf8 text
      */
      onEventError = onEventError || EXPORTS.onEventErrorDefault;
      options.url0 = options.url0 || options.url;
      if (options.data) {
        options.method = options.type = options.method || options.type || 'POST';
      }
      /* browser */
      if (state.isBrowser) {
        /* ajax xss via proxy */
        if ((/^https*:/).test(options.url)) {
          options.url = '/proxy/proxy.ajax/' + options.url;
        }
        EXPORTS.ajaxProgressOnEventError(options, onEventError);
        return;
      }
      /* nodejs */
      required.utility2._ajaxNodejs(options, onEventError);
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
      onEventError = onEventError || EXPORTS.onEventErrorDefault;
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
    },

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

    Cache: function (name, size) {
      /*
        this Cache class has lru-like cache behavior,
        but with O(1) average case gets and sets
      */
      if (!(this instanceof local.Cache)) {
        return new local.Cache(name, size);
      }
      EXPORTS.assert(typeof name === 'string', 'name must be a string');
      EXPORTS.assert(size >= 2, 'size must be greater than or equal to 2');
      this.name = name || 'cache';
      this.size = size || 256;
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
      cache = EXPORTS.Cache('cache', 2);
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
    },

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

    deferCallback: function (key, action, callback) {
      /*
        this function defers a callback until a resume event is fired
      */
      var self;
      self = state.deferCallbackDict = state.deferCallbackDict || {};
      self = self[key] = self[key] || { callbacks: [], pause: true };
      switch (action) {
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
        throw new Error('unknown action - ' + action);
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

    _deferCallback_unknownAction_test: function (onEventError) {
      /*
        this function tests deferCallback's unknown action error-handling behavior
      */
      var key;
      key = EXPORTS.uuid4();
      try {
        EXPORTS.deferCallback(key, 'unknown action');
      } catch (error) {
        onEventError(!error);
        EXPORTS.deferCallback(key, 'delete');
      }
    },

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

    testModule: function (module, local2) {
      /*
        this function runs tests on a module
      */
      var environment, _onEventTest, remaining, testSuite;
      /* browser-side testing */
      if (state.isPhantomjs
          || (state.isBrowser && !state.isBrowserTest)
          || (state.isNodejs && !state.isTest)) {
        return;
      }
      environment = state.isBrowser ? 'browser' : 'nodejs';
      remaining = 0;
      testSuite = {
        environment: environment,
        failures: 0,
        name: environment + '.' + local2._name,
        passed: 0,
        skipped: 0,
        testCases: {},
        tests: 0,
        time: 0,
      };
      _onEventTest = function (test, mode) {
        var _onEventError;
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
          if (!remaining) {
            _onEventTest(null, 'finish');
          }
        };
        if (remaining < 0) {
          if (testSuite.testCases.hasOwnProperty(test)) {
            test = testSuite.testCases[test];
            /* test timeout */
            if (!test.finished) {
              test.time = Date.now() - test.time;
              testSuite.failures += 1;
              testSuite.tests += 1;
              console.error('\n' + testSuite.environment, 'test failed -',
                local2._name + '.' + test.name);
              test.failure = 'test timeout';
              EXPORTS.onEventErrorDefault(new Error(test.failure));

            }
            testSuite.time += test.time;
            return;
          }
          return;
        }
        switch (mode) {
        /* finish test cases */
        case 'finish':
          remaining = -1;
          state.testCounter -= 1;
          /* timeout remaining tests */
          Object.keys(testSuite.testCases).forEach(_onEventTest);
          /* finish test suites */
          if (state.testCounter <= 0) {
            state.testCounter = 0;
            EXPORTS.testReport();
          }
          return;
        /* start test */
        case 'start':
          try {
            local2[test.name](_onEventError);
          } catch (error) {
            _onEventError(error);
          }
          return;
        /* run single test */
        default:
          if (test.slice(-5) !== '_test') {
            return;
          }
          if (!remaining) {
            state.testCounter = state.testCounter || 0;
            state.testCounter += 1;
          }
          remaining += 1;
          /* en-queue test */
          testSuite.testCases[test] = { name: test, time: Date.now() };
          setTimeout(_onEventTest, 1, testSuite.testCases[test], 'start');
        }
      };
      Object.keys(local2).forEach(_onEventTest);
      if (remaining) {
        /* add test suite */
        state.testSuites = state.testSuites || [];
        state.testSuites.push(testSuite);
        /* add timeout to test suite */
        setTimeout(_onEventTest, state.timeoutDefault, null, 'finish');
      }
    },

    // testModule_default_test: function (onEventError) {
      // /*
        // this function tests testModule's default behavior
      // */
      // onEventError();
      // EXPORTS
    // },

    testReport: function () {
      var result;
      result = '\n';
      state.testSuites.forEach(function (testSuite) {
        result += [testSuite.environment, 'tests -', testSuite.failures, 'failed /',
          testSuite.skipped, 'skipped /', testSuite.passed, 'passed in', testSuite.name]
          .join(' ') + '\n';
      });
      console.log(result);
      if (state.isBrowser) {
        /* upload test report */
        EXPORTS.ajax({
          data: JSON.stringify({ coverage: global.__coverage__, testSuites: state.testSuites }),
          url: '/test/test.upload'
        });
        /* reset code coverage */
        if (global.__coverage__) {
          global.__coverage__ = {};
        }
      } else {
        required.utility2._testReport(state.testSuites);
      }
      /* reset test suites */
      state.testSuites.length = 0;
    },

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
    },

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
        EXPORTS.deferCallback('serverResume', 'resume');
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
      /*
        bug - phantomjs - new Blob() throws error
        https://github.com/ariya/phantomjs/issues/11013
      */
      try {
        EXPORTS.nop(new global.Blob());
      } catch (error) {
        global.Blob = local._Blob;
      }
      global.Blob = local._Blob;
      /* browser test flag - watch */
      state.isBrowserTest = (/\btestWatch=(\d+)\b/).exec(location.hash);
      if (state.isBrowserTest) {
        /* increment watch counter */
        location.hash = EXPORTS.urlParamsSetItem(location.hash, 'testWatch',
          (Number(state.isBrowserTest[1]) + 1).toString(), '#');
        state.isBrowserTest = 'watch';
        /* watch server for changes and reload via sse */
        new global.EventSource('/test/test.watch').addEventListener('message', function () {
          location.reload();
        });
        return;
      }
      /* browser test flag - once */
      state.isBrowserTest = (/\btestOnce=/).exec(location.hash);
      if (state.isBrowserTest) {
        state.isBrowserTest = 'once';
        return;
      }
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
    },

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
      /* initialize xhr progress container */
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

    ajaxProgressOnEventError: function (options, onEventError) {
      /*
        this function performs ajax calls with progress meter
        usage:
        EXPORTS.ajaxProgressOnEventError({
          data: 'hello world',
          type: 'POST',
          url: '/upload/foo.txt'
        }, EXPORTS.onEventErrorDefault);
      */
      /* binary file */
      if (options.file && !options.data) {
        local._ajaxProgressOnEventErrorFile(options, onEventError);
        return;
      }
      onEventError = onEventError || EXPORTS.onEventErrorDefault;
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
        EXPORTS.ajaxProgressOnEventError(options, onEventError);
      };
      reader.readAsBinaryString(options.file);
    },

    _onEventEnd: function (event) {
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
      var list, ii;
      list = local._xhrProgressList;
      for (ii = list.length - 1; ii >= 0; ii -= 1) {
        if (list[ii] === xhr) {
          list.splice(ii, 1);
          break;
        }
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
    },

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
        EXPORTS.ajaxProgressOnEventError({
          file: event.target.files[0],
          method: "POST",
          url: "/admin/admin.upload"
        });
        /* reset input */
        $(event.target).val('');
      });
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
    },

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

    _lintCss: function (file, script) {
      /*
        this function lints a css script for errors
      */
      if (required.csslint) {
        console.log(required.csslint.CSSLint.getFormatter('text')
          .formatResults(required.csslint.CSSLint.verify(script, { ignore: 'ids' }), file, {
            quiet: true
          }));
      }
      return script;
    },

    _lintJs: function (file, script) {
      /*
        this function lints a js script for errors
      */
      var lint;
      if (required.jslint_linter && !global.__coverage__) {
        lint = required.jslint_linter.lint(script, { maxerr: 8 });
        if (!lint.ok) {
          required.jslint_reporter.report(file, lint);
        }
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
    },

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
      required.child_process = required.child_process || require('child_process');
      required.fs = required.fs || require('fs');
      required.http = required.http || require('http');
      required.http.globalAgent.maxSockets = 256;
      required.https = required.https || require('https');
      required.https.globalAgent.maxSockets = 256;
      required.net = required.net || require('net');
      required.path = required.path || require('path');
      required.repl = required.repl || require('repl');
      required.url = required.url || require('url');
      required.util = required.util || require('util');
      required.vm = required.vm || require('vm');
      required.zlib = required.zlib || require('zlib');
      /* require external */
      [
        'coveralls',
        'csslint',
        'cssmin',
        'express',
        'graceful-fs',
        'istanbul',
        'jslint',
        'mime',
        'moment',
        'phantomjs',
        'sqlite3',
        'uglify-js',
        'utility2-external'
      ].forEach(function (module) {
        var module2;
        module2 = module.replace((/\W/g), '_');
        try {
          required[module2] = required[module2] || require(module);
        } catch (errorRequire) {
          console.log('module not loaded - ' + module);
        }
      });
      /* override required.fs with required.graceful_fs */
      if (required.graceful_fs) {
        required.fs = required.graceful_fs;
      }
      /* initialize istanbul */
      if (required.istanbul) {
        required.istanbul_Instrumenter = required.istanbul_Instrumenter
          || new required.istanbul.Instrumenter();
      }
      /* initialize jslint */
      if (required.jslint) {
        required.jslint_linter = required.jslint_linter || require('jslint/lib/linter');
        required.jslint_reporter = required.jslint_reporter || require('jslint/lib/reporter');
      }
      /* initialize sqlite3 */
      if (required.sqlite3) {
        state.dbSqlite3 = new required.sqlite3.cached.Database(':memory:');
      }
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
      /* process.argv */
      process.argv.forEach(function (arg, ii, argv) {
        if ((/^--[a-z]/).test(arg)) {
          /* --no-foo -> state.isFoo = false */
          if ((/^--no-[a-z]/).test(arg)) {
            state[EXPORTS.stringToCamelCase('is' + arg.slice(4))] = false;
          /* --foo bar -> state.isFoo = bar */
          } else if (argv[ii + 1] && !(/^--[a-z]/).test(argv[ii + 1])) {
            state[EXPORTS.stringToCamelCase(arg.slice(2))] = argv[ii + 1];
          /* --foo -> state.isFoo = true */
          } else {
            state[EXPORTS.stringToCamelCase('is' + arg.slice(1))] = true;
          }
        }
      });
      /* process.exit */
      process._exit = process._exit || process.exit;
      process.exit = function () {
        if (!state.isMock) {
          process._exit();
        }
      };
      /* load package.json file */
      EXPORTS.tryCatchOnEventError(function () {
        /*jslint stupid: true*/
        state.packageJson = {};
        state.packageJson = JSON.parse(required.fs.readFileSync(process.cwd()
          + '/package.json'));
      }, EXPORTS.nop);
      /* load default config file */
      state.stateDefault = state.packageJson.stateDefault || {};
      EXPORTS.setOptionsDefaults(state, EXPORTS.objectCopyDeep(state.stateDefault));
      /* load dynamic config from external url every 60 seconds */
      state.stateOverride = state.stateOverride || {};
      state.stateOverrideUrl = state.stateOverrideUrl || '/state/stateOverride.json';
      setTimeout(function () {
        EXPORTS.clearCallSetInterval('configLoadOverride', function () {
          EXPORTS.ajax({
            dataType: 'json',
            headers: { authorization: 'Basic ' + state.securityBasicAuthSecret },
            url: state.stateOverrideUrl
          }, function (error, data) {
            if (error) {
              EXPORTS.onEventErrorDefault(error);
              return;
            }
            state.stateOverride = data;
            underscore.extend(state, EXPORTS.objectCopyDeep(state.stateOverride));
            console.log('loaded override config from ' + state.stateOverrideUrl);
          });
        }, 5 * 60 * 1000);
      });
      if (state.isTest) {
        EXPORTS.debugProcessOnce();
      }
      /* exit on timeout */
      if (state.exitTimeout) {
        setTimeout(process.exit, state.exitTimeout);
      }
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
        this function watches a file and performs specified actions if it is modified.
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
          state.testWatch = state.testWatch || [];
          (state.testWatch).forEach(function (response) {
            response.write('data:\n\n');
          });
          content2 = content.replace(/^#/, '//#');
          /* code coverage instrumentation */
          if (required.istanbul && global.__coverage__ && file.name.slice(-3) === '.js') {
            /*jslint stupid: true*/
            content2 = required.istanbul_Instrumenter.instrumentSync(content2, file.name);
          }
          /* perform action */
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
          /* perform copy */
          (file.copy || []).forEach(function (file2) {
            EXPORTS.fsWriteFileAtomic(file2, content, null, EXPORTS.onEventErrorDefault);
          });
          /* perform copyx */
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
      result = required.uglify_js.OutputStream();
      /* compress */
      ast.figure_out_scope();
      ast.transform(required.uglify_js.Compressor());
      /* mangle */
      ast.figure_out_scope();
      ast.compute_char_frequency();
      ast.mangle_names();
      /* output */
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

    _moduleInitOnceNodejs: function (module, local2, exports) {
      /*
        this function performs extra nodejs initialization on the module
      */
      if (exports.file) {
        return;
      }
      exports.file = (module && module.filename) || 'undefined';
      exports.dir = EXPORTS.fsDirname(exports.file);
      module.exports = exports;
      /* watch module */
      EXPORTS.fsWatch({ action: ['lint', function (file, content, content2) {
        exports._fileContent = content2;
        exports._fileContentBrowser = global.__coverage__ ? content2
          : (content2 + '\n(function moduleNodejs() {\n}());\n')
            .replace((/\n\(function module\w*Nodejs\([\S\s]*/), '').trim();
      }, 'eval'], name: exports.file });
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
      if (state.isMock) {
        return;
      }
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
        this function serves the admin.html asset file
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
      + '</body></html>',

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

    _ajaxNodejs: function (options, onEventError) {
      /*
        this function is the nodejs implementation of the ajax function
      */
      /* localhost */
      if (options.url[0] === '/') {
        EXPORTS.deferCallback('serverResume', 'defer', function (error) {
          if (error) {
            onEventError(error);
            return;
          }
          options.url = state.localhost + options.url;
          EXPORTS.ajax(options, onEventError);
        });
        return;
      }
      /* assert valid http / https url */
      EXPORTS.assert(options.url && options.url.slice(0, 4) === 'http', [options.url]);
      var _onEventError,
        request,
        timeout,
        urlParsed;
      _onEventError = function (error, data) {
        if (timeout < 0) {
          return;
        }
        clearTimeout(timeout);
        if (options.debugFlag) {
          console.log(['_ajaxNodejs', options.url,
            options.response && options.response.headers]);
        }
        onEventError(error, data, options);
      };
      urlParsed = required.url.parse(options.proxy || options.url);
      urlParsed.protocol = urlParsed.protocol || 'http:';
      options.hostname = urlParsed.hostname;
      options.path = options.proxy ? options.url : urlParsed.path;
      options.rejectUnauthorized = false;
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
      /* set timeout */
      timeout = setTimeout(function () {
        _onEventError(EXPORTS.createErrorTimeout());
        timeout = -1;
      }, options.timeout || state.timeoutDefault);
      /* socks5 */
      if (required.utility2._socks5Ajax(options, _onEventError) !== 'skip') {
        return;
      }
      request = required[urlParsed.protocol.slice(0, -1)].request(options, function (response) {
        var readStream;
        options.response = response;
        if (options.onEventResponse && options.onEventResponse(response)) {
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
              _onEventError(new Error('too many http redirects - '
                + response.headers.location));
              return;
            }
            options.url = response.headers.location;
            if (options.url[0] === '/') {
              options.url = urlParsed.protocol + '//' + options.hostname + options.url;
            }
            if (response.statusCode === 303) {
              options.data = null;
              options.method = 'GET';
            }
            EXPORTS.ajax(options, _onEventError);
            return;
          }
        }
        switch (options.dataType) {
        case 'headers':
          _onEventError(null, response.headers);
          return;
        case 'response':
          _onEventError(null, response.on('error', _onEventError));
          return;
        case 'statusCode':
          _onEventError(null, response.statusCode);
          return;
        }
        readStream = response;
        switch (response.headers['content-encoding']) {
        case 'deflate':
          readStream = response.pipe(required.zlib.createInflate());
          break;
        case 'gzip':
          readStream = response.pipe(required.zlib.createGunzip());
          break;
        }
        readStream.on('error', _onEventError);
        EXPORTS.streamReadOnEventError(readStream, function (error, data) {
          if (error) {
            _onEventError(error);
            return;
          }
          if (response.statusCode >= 400) {
            _onEventError(new Error((options.method || 'GET') + ' - ' + options.url
              + ' - ' + response.statusCode + ' - ' + data.toString()));
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
              _onEventError(new Error('invalid json data from ' + options.url));
              return;
            }
            break;
          default:
            data = data.toString();
          }
          _onEventError(null, data);
        });
      }).on('error', _onEventError);
      if (options.file) {
        options.readStream = options.readStream || required.fs.createReadStream(options.file);
      }
      if (options.readStream) {
        options.readStream.on('error', _onEventError).pipe(request.on('error', _onEventError));
      } else {
        request.end(options.data);
      }
      /* debug */
      if (options.debugFlag || state.debugFlag) {
        console.log(['_ajaxNodejs', options]);
      }
    },

    _ajaxNodejs_default_test: function (onEventError) {
      /*
        this function tests _ajaxNodejs's default behavior
      */
      EXPORTS.ajax({ debugFlag: true, url: '/test/test.echo' }, onEventError);
    },

    _ajaxNodejs_serverResumeError_test: function (onEventError) {
      /*
        this function tests _ajaxNodejs's server resume on error behavior
      */
      EXPORTS.deferCallback('serverResume', 'resume');
      EXPORTS.deferCallback('serverResume', 'error', new Error());
      EXPORTS.ajax({
        url: '/test/test.echo'
      }, function (error) {
        EXPORTS.deferCallback('serverResume', 'reset');
        EXPORTS.deferCallback('serverResume', 'resume');
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
      EXPORTS.initModule(module, local);
    },

    _initOnce: function () {
      /* socks5 ssh proxy */
      state.socks5SshHost = process.env.SOCKS5_SSH_HOST || state.socks5SshHost;
      if (state.socks5SshHost) {
        state.socks5SshHostname = state.socks5SshHost.split(':')[0];
        state.socks5SshPort = state.socks5SshHost.split(':')[1] || 22;
        if (!state.socks5LocalPort) {
          state.socks5LocalPort = state.socks5LocalPort || EXPORTS.serverPortRandom();
          EXPORTS.shell({
            script: 'ssh -D ' + state.socks5LocalPort + ' -o StrictHostKeyChecking=no -p '
              + (state.socks5SshPort) + ' ' + state.socks5SshHostname,
            stdio: ['pipe', 'pipe', 'pipe']
          });
          EXPORTS.clearCallSetInterval('socks5Resume', function (timeout) {
            /* timeout error-handling */
            if (timeout) {
              EXPORTS.deferCallback(
                'socks5Resume',
                'error',
                EXPORTS.createErrorTimeout('socks5 proxy timeout')
              );
            }
            required.utility2._socks5Ajax({
              hostname: 'www.google.com',
              url: 'http://www.google.com'
            }, function (error) {
              if (!error) {
                EXPORTS.deferCallback('socks5Resume', 'resume');
                EXPORTS.clearCallSetInterval('socks5Resume', 'clear');
              }
            });
          }, 1000, state.timeoutDefault);
        } else {
          EXPORTS.deferCallback('socks5Resume', 'resume');
        }
      } else {
        EXPORTS.deferCallback('socks5Resume', 'resume');
      }
    },

    _socks5Ajax: function (options, onEventError) {
      /*
        this function hooks the socks5 proxy protocol into the function ajax
      */
      var chunks,
        hostname,
        _onEventData,
        _onEventError,
        _onEventTimeout,
        port,
        socket;
      if (!(state.socks5LocalPort
          && !options.createConnection
          && options.hostname !== state.socks5SshHostname
          && options.url.indexOf(state.localhost) !== 0
          && !(/^https*:\/\/localhost\b/).test(options.url))) {
        return 'skip';
      }
      chunks = new Buffer(0);
      hostname = new Buffer(options.hostname);
      _onEventData = function (chunk) {
        chunks = Buffer.concat([chunks, chunk]);
        var ii;
        for (ii = 0; ii < Math.min(chunks.length, 5); ii += 1) {
          /* socks5 version */
          switch (ii) {
          case 0:
          case 2:
            if (chunks[ii] !== 5) {
              _onEventError('socks5 - invalid socks version');
              return;
            }
            break;
          /* socks5 status */
          case 1:
          case 3:
          case 4:
            if (chunks[ii] !== 0) {
              _onEventError('socks5 - request failed');
              return;
            }
            break;
          /* socks5 address / port */
          case 5:
            switch (chunks[ii]) {
            /* ipv4 address */
            case 1:
              if (chunks.length < 8 + 4) {
                return;
              }
              break;
            /* case domain name */
            case 3:
              if (chunks.length < 8 + 1 + chunks[6]) {
                return;
              }
              break;
            /* ipv6 address */
            case 4:
              if (chunks.length < 8 + 16) {
                return;
              }
              break;
            }
            _onEventError('socks5 - invalid code');
            return;
          }
        }
        if (chunks.length < 6) {
          return;
        }
        /* cleanup socks5 listeners */
        socket.removeListener('data', _onEventData);
        socket.removeListener('error', onEventError);
        clearTimeout(_onEventTimeout);
        /* continue with ajax request as normal */
        options.createConnection = function () {
          /* bug - reset createConnection for http redirects */
          options.createConnection = null;
          return socket;
        };
        /* disable socket pooling */
        options.agent = false;
        EXPORTS.ajax(options, onEventError);
      };
      _onEventError = function (error) {
        onEventError(error);
        socket.destroy();
      };
      _onEventTimeout = setTimeout(_onEventError, state.timeoutDefault,
        new Error('socks5 timeout'));
      port = Number(options.port || 80);
      socket = required.net.createConnection({
        host: 'localhost',
        port: state.socks5LocalPort
      });
      socket.on('connect', function () {
        /*jslint bitwise: true*/
        try {
          socket.write(Buffer.concat([new Buffer([5, 1, 0, 5, 1, 0, 3, hostname.length]),
            hostname, new Buffer([port >> 8, port & 0xff])]));
        } catch (error) {
          _onEventError(error);
        }
      }).on('error', _onEventError).on('data', _onEventData);
    },

    _socks5Ajax_socks5_test: function (onEventError) {
      /*
        this function tests _socks5Ajax's socks5 behavior
      */
      if (!state.socks5LocalPort) {
        onEventError('skip');
        return;
      }
      EXPORTS.ajax({ url: 'http://www.google.com' }, onEventError);
    },

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

    createFsCacheFilename: function () {
      /*
        this function creates a temp filename in the cache directory
      */
      return state.fsDirCache + '/' + EXPORTS.dateAndSalt();
    },

    fsAppendFile: function (file, data, onEventError) {
      /*
        this function appends data to a file, while auto-creating missing directories
      */
      required.fs.appendFile(file, data, function (error) {
        if (!error) {
          onEventError();
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
            required.fs.appendFile(file, data, onEventError);
          });
          return;
        }
        /* default behavior */
        onEventError(error);
      });
    },

    _fsCacheCleanup: function () {
      /*
        this function cleans up the cache directory
      */
      /* remove files from cache directory */
      (state.cacheFiles || []).forEach(function (file) {
        local._fsRmr(state.fsDirCache + '/' + file, EXPORTS.onEventErrorDefault);
      });
      /* get list of files to be removed for the next cycle */
      required.fs.readdir(state.fsDirCache, function (error, files) {
        state.cacheFiles = files;
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
              if (!remaining) {
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
          if (error.code === 'ENOENT') {
            onEventError();
            return;
          }
          onEventError(error);
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
    },

    _testReport: function (testSuites) {
      var xml;
      xml = '\n<testsuites>\n';
      testSuites.forEach(function (testSuite) {
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
          if (test.failure) {
            xml += '<failure><![CDATA[' + test.failure + ']]></failure>\n';
          } else if (test.skipped) {
            xml += '<skipped></skipped>';
          }
          xml += '</testcase>\n';
        });
        xml += '</testsuite>\n';
      });
      xml += '</testsuites>\n';
      /* write test report */
      EXPORTS.fsWriteFileAtomic(state.fsDirTmp + '/test/' + EXPORTS.dateAndSalt()
        + '.xml', xml, null, EXPORTS.onEventErrorDefault);
    },

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
      case 'browser':
        EXPORTS.phantomjsEval(bb);
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
        if (!state.dbSqlite3) {
          break;
        }
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
      var phantomjsEval, sqlite3_db_all;
      /* mock state */
      state.isMock = true;
      phantomjsEval = EXPORTS.phantomjsEval;
      EXPORTS.phantomjsEval = EXPORTS.nop;
      sqlite3_db_all = state.dbSqlite3.all;
      state.dbSqlite3.all = EXPORTS.nop;
      /* run test */
      local._replParse('($ ls\n)');
      local._replParse('(console.log@@ "hello world"\n)');
      local._replParse('(browser state\n)');
      local._replParse('(git diff\n)');
      local._replParse('(git log\n)');
      local._replParse('(grep zxqj\n)');
      local._replParse('(print true\n)');
      local._replParse('(sql _\n)');
      local._replParse('(sql SELECT * from myTable\n)');
      local._replParse('(syntax error\n)');
      /* restore state */
      state.isMock = false;
      EXPORTS.phantomjsEval = phantomjsEval;
      state.dbSqlite3.all = sqlite3_db_all;
      onEventError();
    },

    _replStart: function () {
      /* start interactive interpreter / debugger */
      if (state.isRepl === true && !state.repl) {
        state.repl = required.repl.start({ eval: function (script, context, file,
          onEventError) {
          EXPORTS.jsEvalOnEventError('', required.utility2._replParse(script), onEventError);
        }, useGlobal: true });
        state.repl.context.EXPORTS = EXPORTS;
        state.repl.context.required = required;
      }
    },

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
      /* 1. middleware pre-logger */
      state.middlewarePrelogger = state.middlewarePrelogger
        || local._createMiddleware(state.routerPreloggerDict);
      /* 2. middleware logger */
      state.middlewareLogger = state.middlewareLogger || required.express.logger('dev');
      /* 3. middleware security */
      state.middlewareSecurity = state.middlewareSecurity
        || local._createMiddleware(state.routerSecurityDict);
      /* 4. middleware proxy */
      state.middlewareProxy = state.middlewareProxy
        || local._createMiddleware(state.routerProxyDict);
      /* 5. middleware backend */
      state.middleware = state.middleware || local._createMiddleware(state.routerDict);
      /* 6. middleware assets */
      state.middlewareAssets = state.middlewareAssets
        || local._createMiddleware(state.routerAssetsDict);
      /* start server */
      EXPORTS.serverStart();
    },

    'routerPreloggerDict_/favicon.ico': function (request, response, next) {
      EXPORTS.serverRespondFile(response, process.cwd() + '/public/assets/favicon.ico', next);
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

    'routerProxyDict_/': function (request, response, next) {
      next();
    },

    'routerProxyDict_/proxy/proxy.ajax': function (request, response, next) {
      /*
        this function proxies frontend request
      */
      var headers, url, urlParsed;
      headers = EXPORTS.objectCopyDeep(request.headers);
      url = EXPORTS.templateFormat(request.url.replace('/proxy/proxy.ajax/', ''));
      urlParsed = required.url.parse(url);
      headers.host = urlParsed.host;
      EXPORTS.ajax({
        headers: headers,
        onEventResponse: function (response2) {
          if (!response.headersSent) {
            response.writeHead(200, response2.headers);
          }
          response2.on('error', next).pipe(response.on('error', next));
          return true;
        },
        readStream: request,
        url: url
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
        if (error.testSuites) {
          required.utility2._testReport(error.testSuites);
        }
        /* merge uploaded code coverage object with global.__coverage__ */
        Object.keys(error.coverage || []).forEach(function (key) {
          var file1, file2;
          file1 = global.__coverage__[key];
          file2 = error.coverage[key];
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
            global.__coverage__[key] = file2;
          }
        });
      });
    },

    'routerDict_/test/test.watch': function (request, response) {
      /*
        this function informs the client about server file changes using server sent events
      */
      var list;
      if (request.headers.accept !== 'text/event-stream') {
        response.end();
        return;
      }
      /* https://developer.mozilla.org/en-US/docs/Server-sent_events/Using_server-sent_events */
      response.setHeader('content-type', 'text/event-stream');
      response.write('retry: ' + state.timeoutDefault + '\n\n');
      list = state.testWatch;
      if (list.length >= 256) {
        list.length = 0;
      }
      list.push(response);
    },

    'routerAssetsDict_/public': function (request, response, next) {
      /*
        this function serves public asset files
      */
      EXPORTS.serverRespondFile(response, process.cwd() + request.urlPathNormalized, next);
    },

    'routerAssetsDict_/public/assets/utility2-external': function (request, response, next) {
      /*
        this function serves public, external asset files
      */
      EXPORTS.serverRespondFile(response, required.utility2_external.__dirname
        + request.urlPathNormalized.replace('/utility2-external', ''), next);
    },

    'routerAssetsDict_/public/assets/utility2.js': function (request, response) {
      /*
        this function serves the utility2.js asset file
      */
      EXPORTS.serverRespondDefault(response, 200, 'application/javascript',
        required.utility2._fileContentBrowser);
    },

    'routerAssetsDict_/test/test.html': function (request, response) {
      /*
        this function serves the test.html asset file
      */
      EXPORTS.serverRespondDefault(response, 200, 'text/html', local._testHtml);
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
          EXPORTS.middlewareOnEventError(error, request, response, next);
          return true;
        }
      };
      /* call pre-logger middleware for things which don't require logging */
      state.middlewarePrelogger(request, response, function (error) {
        if (_onEventError(error)) {
          return;
        }
        /* call logging middleware */
        state.middlewareLogger(request, response, function (error) {
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
      });
    },

    middlewareOnEventError: function (error, request, response, next) {
      EXPORTS.serverRespondDefault(response, 500, 'plain/text', error, next);
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

    serverRespondProxy: function (request, response, next, url) {
      /*
        this function reverse-proxies frontend request to backend network
      */
      var headers, urlParsed;
      headers = EXPORTS.objectCopyDeep(request.headers);
      urlParsed = required.url.parse(url);
      /* update host header with actual destination */
      headers.host = urlParsed.host;
      EXPORTS.ajax({
        headers: headers,
        onEventResponse: function (response2) {
          if (!response.headersSent) {
            response.writeHead(200, response2.headers);
          }
          response2.on('error', next).pipe(response.on('error', next));
          return true;
        },
        readStream: request,
        url: url
      });
    },

    serverStart: function (port) {
      state.serverPort = process.env.PORT || state.serverPort || port;
      if (!state.serverPort) {
        return;
      }
      /* optional random server port */
      if (state.serverPort === 'random') {
        state.serverPort = EXPORTS.serverPortRandom();
      }
      /* setup localhost */
      state.localhost = state.localhost || 'http://localhost:' + state.serverPort;
      /* create server */
      state.server = state.server || required.express().use(EXPORTS.middlewareApplication);
      /* listen on specified port */
      if (state.serverListened) {
        return;
      }
      state.serverListened = true;
      state.server.listen(state.serverPort, function () {
        console.log('server started on port ' + state.serverPort);
        EXPORTS.deferCallback('serverResume', 'resume');
      });
    },

    _testHtml: '<!DOCTYPE html><html><head>\n'
      + [
        '/public/assets/utility2-external/external.rollup.auto.css'
      ].map(function (url) {
        return '<link href="' + url + '" rel="stylesheet" />\n';
      }).join('')

      + '<style>\n'
      + '</style></head><body>\n'
      + '<div id="divTest"></div>\n'

      + [
        '/public/assets/utility2-external/external.rollup.auto.js',
        '/public/assets/utility2.js'
      ].map(function (url) {
        return '<script src="' + url + '"></script>\n';
      }).join('')
      + '</body></html>\n',

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

    _name: 'utility2.modulePhantomjsShared',

    _init: function () {
      if (state.isNodejs) {
        EXPORTS.deferCallback('serverResume', 'defer', function (error) {
          EXPORTS.nop(error ? EXPORTS.onEventErrorDefault(error)
            : EXPORTS.initModule(module, local));
        });
      }
    },

    _initOnce: function () {
      EXPORTS.phantomjsRestart();
    },

    phantomjsRestart: function (file) {
      /*
        this function spawns a phantomjs test server
      */
      EXPORTS.deferCallback('phantomjsResume', 'reset');
      state.phantomjsPort = EXPORTS.serverPortRandom();
      /* instrument file if coverage is enabled */
      file = file || required.utility2.file;
      if (global.__coverage__ && file === required.utility2.file) {
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
      EXPORTS.clearCallSetInterval('phantomjsResume', function (timeout) {
        /* timeout error */
        if (timeout) {
          EXPORTS.deferCallback(
            'phantomjsResume',
            'error',
            EXPORTS.createErrorTimeout('phantomjs spawn timeout')
          );
          return;
        }
        local._phantomjsTest('/favicon.ico', function (error) {
          if (error) {
            return;
          }
          EXPORTS.deferCallback('phantomjsResume', 'resume');
          EXPORTS.clearCallSetInterval('phantomjsResume', 'clear');
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
            if (exitCode) {
              EXPORTS.deferCallback('phantomjsResume', 'error', new Error(exitCode));
              EXPORTS.clearCallSetInterval('phantomjsResume', 'clear');
            }
          }).pid;
        /* phantomjs code coverage */
        if (global.__coverage__) {
          EXPORTS.clearCallSetInterval('phantomjsCoverage', function () {
            required.fs.readFile(state.phantomjsCoverageFile, 'utf8', function (error, data) {
              if (error) {
                return;
              }
              /* upload phantomjs code coverage report */
              EXPORTS.ajax({
                data: '{"coverage":' + data + '}',
                url: '/test/test.upload'
              });
              EXPORTS.clearCallSetInterval('phantomjsCoverage', 'clear');
            });
          }, 1000);
        }
      } catch (errorPhantomjs) {
        EXPORTS.deferCallback('phantomjsResume', 'error', errorPhantomjs);
      }
    },

    phantomjsTest: function (url, onEventError) {
      /*
        this function sends a url to phantomjs server for testing
      */
      EXPORTS.deferCallback('phantomjsResume', 'defer', function (error) {
        EXPORTS.nop(error ? onEventError(error) : local._phantomjsTest(url, onEventError));
      });
    },

    _phantomjsTest: function (url, onEventError) {
      /*
        this function sends a url to phantomjs server for testing
      */
      url = state.localhost + url;
      EXPORTS.ajax({
        data: url,
        /* bug - headers are case-sensitive in phantomjs */
        headers: { 'Content-Length': Buffer.byteLength(url) },
        method: 'POST',
        url: 'http://localhost:' + state.phantomjsPort
      }, onEventError);
    },

    _phantomjsTest_testOnce_test: function (onEventError) {
      /*
        this function tests phantomjsTest's testOnce behavior
      */
      EXPORTS.deferCallback('phantomjsResume', 'defer', function (error) {
        EXPORTS.nop(error ? onEventError('skip')
          : EXPORTS.phantomjsTest('/test/test.html#testOnce=1', onEventError));
      });
    },

    _phantomjsTest_testWatch_test: function (onEventError) {
      /*
        this function tests phantomjsTest's testWatch behavior
      */
      EXPORTS.deferCallback('phantomjsResume', 'defer', function (error) {
        EXPORTS.nop(error || !global.__coverage ? onEventError('skip')
          : EXPORTS.phantomjsTest('/test/test.html#testWatch=1', onEventError));
      });
    },

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

    _name: 'utility2.modulePhantomjsShared',

    _init: function () {
      if (state.isPhantomjs) {
        EXPORTS.initModule(module, local);
      }
    },

    _initOnce: function () {
      var tmp;
      /* exports */
      required.fs = require('fs');
      required.system = require('system');
      required.webpage = require('webpage');
      required.webserver = require('webserver');
      tmp = JSON.parse(EXPORTS.base64Decode(required.system.args[1]));
      Object.keys(tmp).forEach(function (key) {
        state[key] = tmp[key];
      });
      /* phantomjs server */
      required.webserver.create().listen(state.phantomjsPort, function (request, response) {
        response.write('200');
        response.close();
        EXPORTS.tryCatchOnEventError(function () {
          var isFavicon, page, url;
          page = required.webpage.create();
          url = request.post;
          page.onConsoleMessage = console.log;
          page.open(url, function (status) {
            console.log('phantomjs open -', status, '-', url);
          });
          /* page timeout */
          isFavicon = url === state.localhost + '/favicon.ico';
          setTimeout(function () {
            page.close();
            if (isFavicon && global.__coverage__) {
              required.fs.write(
                state.phantomjsCoverageFile,
                JSON.stringify(global.__coverage__),
                'w'
              );
            }
          }, isFavicon ? 1000 : state.timeoutDefault);
        }, EXPORTS.onEventErrorDefault);
      });
      console.log('phantomjs server started on port ' + state.phantomjsPort);
    },

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
        EXPORTS.initModule(module, local);
      }
    },

    _initOnce: function () {
      setTimeout(local._testNpm);
    },

    _testNpm: function () {
      /*
        this function runs npm test with code coverage
      */
      if (!state.npmTest) {
        return;
      }
      EXPORTS.shell('rm -r tmp/test_coverage 2>/dev/null;'
        + 'istanbul cover --dir tmp/test_coverage'
        + ' -x **.min.**'
        + ' -x **.rollup.**'
        + ' -x **/git_modules/**'
        + ' -x **/tmp/**'
        + ' ' + state.npmTest + ' --'
        + ' --exitTimeout ' + 1.25 * state.timeoutDefault
        + ' --repl'
        + ' --serverPort random'
        + ' --test'
        + ' --timeoutDefault ' + state.timeoutDefault
        + (process.env.TRAVIS
          ? '; cat tmp/test_coverage/lcov.info | node_modules/coveralls/bin/coveralls.js'
          : ''));
      /* exit */
      setTimeout(process.exit, state.timeoutDefault);
    },

    _testNpm_default_test: function (onEventError) {
      /*
        this function tests testNpm's default behavior
      */
      var npmTest, setTimeout;
      /* mock state */
      state.isMock = true;
      npmTest = state.npmTest;
      state.npmTest = true;
      setTimeout = global.setTimeout;
      global.setTimeout = EXPORTS.callCallback;
      /* run test */
      local._initOnce();
      /* restore state */
      state.isMock = false;
      state.npmTest = npmTest;
      global.setTimeout = setTimeout;
      onEventError();
    },

  };
  local._init();
}());
