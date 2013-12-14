#!/usr/bin/env node
/*jslint browser: true, indent: 2, nomen: true, regexp: true, todo: true, unparam: true*/
/*global EXPORTS, global, required, state, underscore, $*/
/*
utility2.js
common, shared utilities for both browser and nodejs

todo:
add ajaxNodejsMaster
add heroku dynamic config server
add phantomjs code coverage
integrate forever-webui
db add admin webui
db auto-heal incorrectly indexed b-trees
db limit record to 256 fields
add db tableGet
add db recordsScan
create db http interface
add db indexing
*/



(function moduleInitializeFirstShared() {
  /*
    this shared module performs initialization before the below modules are loaded
  */
  'use strict';
  var local;
  try {
    window.global = window.global || window;
    window.module = window.module || null;
  } catch (ignore) {
  }
  global.EXPORTS = global.EXPORTS || {};
  global.required = EXPORTS.required = EXPORTS.required || global.required || {};
  global.state = EXPORTS.state = EXPORTS.state || global.state || {};
  local = {

    _name: 'utility2.moduleInitializeFirstShared',

    _init: function () {
      /*
        this function initializes the module
      */
      /* make console.log callable without context */
      console._log = console._log || console.log;
      console.log = function () {
        console._log.apply(console, arguments);
      };
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
        EXPORTS.state.serverPort = require('system').args[1];
      /* browser - requires jquery */
      } else if (global.document && global.jQuery) {
        state.isBrowser = true;
      }
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
      /*
        this function initializes the module
      */
      EXPORTS.moduleInit = local.moduleInit;
      EXPORTS.moduleInit(module, local);
    },

    _initOnce: function () {
      /*
        this function initializes the module once
      */
      /* exports */
      /* create object deferring code that requires server initialization first */
      state.serverResume = state.serverResume || EXPORTS.onEventResume('pause');
      /* misc ascii reference */
      state.string256 = '\u0000\u0001\u0002\u0003\u0004\u0005\u0006\u0007\b\t\n\u000b\f\r\u000e'
        + '\u000f\u0010\u0011\u0012\u0013\u0014\u0015\u0016\u0017\u0018\u0019\u001a\u001b\u001c'
        + '\u001d\u001e\u001f !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_'
        + '`abcdefghijklmnopqrstuvwxyz{|}~';
      /* global default timeout */
      state.timeoutDefault = state.timeoutDefault || 30 * 1000;
      if (!state.isNodejs) {
        /* don't wait for server initialization, because it doesn't exist! */
        state.serverResume('resume');
      }
      /* browser initialization */
      local._initOnceBrowser();
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
      /* browser test flag */
      state.isBrowserTest = (/\btestWatch=(\d+)\b/).exec(location.hash);
      if (state.isBrowserTest) {
        /* increment watch counter */
        location.hash = EXPORTS.urlSearchSetItem(location.hash, 'testWatch',
          (Number(state.isBrowserTest[1]) + 1).toString(), '#');
        state.isBrowserTest = 'watch';
        return;
      }
      /* browser test once flag */
      state.isBrowserTest = (/\btestOnce=/).exec(location.hash);
      if (state.isBrowserTest) {
        state.isBrowserTest = 'once';
        return;
      }
    },

    ajaxLocal: function (options, onEventError) {
      /*
        this function makes an ajax request on the localhost server
      */
      onEventError = onEventError || EXPORTS.onEventErrorDefault;
      if (options.data) {
        options.method = options.type = options.method || options.type || 'POST';
      }
      /* browser */
      if (state.isBrowser) {
        EXPORTS.ajaxProgressOnEventError(options, onEventError);
        return;
      }
      /* nodejs */
      state.serverResume(function (error) {
        if (error) {
          onEventError(error);
          return;
        }
        if (options.url[0] === '/') {
          options.url = state.localhost + options.url;
        }
        EXPORTS.ajaxNodejs(options, onEventError);
      });
    },

    _ajaxLocal_timeout_test: function (onEventError) {
      /*
        this function tests ajaxLocal's timeout behavior
      */
      EXPORTS.ajaxLocal({
        timeout: 1,
        url: '/test/test.timeout'
      }, function (error) {
        console.assert(EXPORTS.isErrorTimeout(error));
        onEventError();
      });
    },

    ajaxLocalMulti: function (options, onEventError) {
      /*
        this function makes multiple ajax calls for multiple params
      */
      var _onEventError, params, remaining, urlParsed;
      onEventError = onEventError || EXPORTS.onEventErrorDefault;
      remaining = 0;
      /* remove hash-tag from url */
      urlParsed = (/[^#]*/).exec(options.url)[0].split('?');
      _onEventError = function (error, data) {
        if (remaining < 0) {
          return;
        }
        if (error) {
          remaining = -1;
          onEventError(error);
          return;
        }
        remaining -= 1;
        onEventError(null, data, remaining);
      };
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
      params.forEach(function (dict) {
        var options2;
        options2 = EXPORTS.objectCopyDeep(options);
        options2.url = urlParsed[0] + '?' + Object.keys(dict).sort().map(function (key) {
          return key + '=' + dict[key];
        }).join('&');
        remaining += 1;
        EXPORTS.ajaxLocal(options2, _onEventError);
      });
    },

    _ajaxLocalMulti_error_test: function (onEventError) {
      /*
        this function tests ajaxLocalMulti's error-handling behavior
      */
      EXPORTS.ajaxLocalMulti({
        url: '/test/test.error'
      }, function (error) {
        if (error) {
          onEventError();
        }
      });
    },

    _ajaxLocalMulti_multi_test: function (onEventError) {
      /*
        this function tests ajaxLocalMulti's multi-ajax requests behavior
      */
      EXPORTS.ajaxLocalMulti({
        url: '/test/test.echo?aa=1&aa=2&bb=3&bb=4&cc=5#dd=6'
      }, function (error, data, _remaining) {
        console.assert((/^GET \/test\/test\.echo\?aa=.&bb=.&cc=. /).test(data));
        if (_remaining === 0) {
          onEventError();
        }
      });
    },

    _ajaxLocalMulti_multiError_test: function (onEventError) {
      /*
        this function tests ajaxLocalMulti's multi error-handling behavior
      */
      EXPORTS.ajaxLocalMulti({
        url: '/test/test.error?aa=1&aa=2&bb=3&bb=4&cc=5#dd=6'
      }, function (error) {
        if (error) {
          onEventError();
        }
      });
    },

    _ajaxLocalMulti_nullCase_test: function (onEventError) {
      /*
        this function tests ajaxLocalMulti's null-case behavior
      */
      EXPORTS.ajaxLocalMulti({
        url: '/test/test.echo'
      }, onEventError);
    },

    base64Decode: function (text) {
      /*
        this function base64 decodes text that was encoded in a uri-friendly format
      */
      return global.atob(text.replace((/-/g), '+').replace((/_/g), '/'));
    },

    base64Decode_default_test: function (onEventError) {
      /*
        this function tests base64Decode's default behavior
      */
      console.assert(EXPORTS.base64Decode('') === '');
      console.assert(EXPORTS.base64Encode('state.string256') === 'c3RhdGUuc3RyaW5nMjU2');
      onEventError();
    },

    base64Encode: function (text) {
      /*
        this function base64 encodes text in a uri-friendly manner
      */
      return global.btoa(text).replace((/\+/g), '-').replace((/\//g), '_')
        .replace((/\=+/g), '');
    },

    base64Encode_default_test: function (onEventError) {
      /*
        this function tests base64Encode's default behavior
      */
      console.assert(EXPORTS.base64Encode('') === '');
      console.assert(EXPORTS.base64Encode(state.string256)
        === 'AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD'
          + '0-P0BBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWltcXV5fYGFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6'
          + 'e3x9fg');
      onEventError();
    },

    clearCallSetInterval: function (key, callback, interval) {
      /*
        this function:
          1. clear interval key
          2. run callback
          3. set interval key to callback
      */
      var dict;
      dict = state.setIntervalDict = state.setIntervalDict || {};
      /* 1. clear interval key */
      clearInterval(dict[key]);
      /* 2. run callback */
      callback();
      /* 3. set interval key to callback */
      dict[key] = setInterval(callback, interval);
      return dict[key];
    },

    createErrorTimeout: function (message) {
      /*
        this function creates a new timeout error
      */
      var error;
      error = new Error(message);
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
      console.assert(EXPORTS.createUtc().toISOString().slice(0, 19)
        === new Date().toISOString().slice(0, 19));
      console.assert(EXPORTS.createUtc('oct 10 2010').toISOString().slice(0, 19)
        === '2010-10-10T00:00:00');
      console.assert(EXPORTS.createUtc('2010-10-10').toISOString().slice(0, 19)
        === '2010-10-10T00:00:00');
      console.assert(EXPORTS.createUtc('2010-10-10 00:00:00').toISOString().slice(0, 19)
        === '2010-10-10T00:00:00');
      console.assert(EXPORTS.createUtc('2010-10-10T00:00:00Z').toISOString().slice(0, 19)
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
      /* assert each call returns incrementing result */
      onEventError(!(EXPORTS.dateAndSalt(1) < EXPORTS.dateAndSalt(2)
        /* assert call can be converted to date */
        && new Date(EXPORTS.dateAndSalt()).getTime()));
    },

    fsDirname: function (file) {
      /*
        this function returns a file name's parent directory
      */
      return file.replace((/\/[^\/]+\/*$/), '');
    },

    ioAggregate: function (callbacks, onEventError) {
      /*
        this function aggregates the result from a list of async callbacks of the form:
        function (onEventError) {...}
      */
      var _onEventError, remaining;
      remaining = callbacks.length;
      if (!remaining) {
        onEventError();
        return;
      }
      _onEventError = function (error) {
        if (remaining < 0) {
          return;
        }
        remaining -= 1;
        if (error || !remaining) {
          remaining = -1;
          onEventError(error);
        }
      };
      callbacks.forEach(function (callback) {
        callback(_onEventError);
      });
    },

    _ioAggregate_default_test: function (onEventError) {
      /*
        this function tests ioAggregate's default behavior
      */
      var result;
      result = 0;
      EXPORTS.ioAggregate([function (onEventError) {
        setTimeout(function () {
          result += 1;
          onEventError();
        }, 1);
      }, function (onEventError) {
        setTimeout(function () {
          result += 1;
          onEventError();
        }, 1);
      }], function (error) {
        if (error) {
          onEventError(error);
          return;
        }
        onEventError(result === 2 ? null : new Error('test failed - ioAggregate'));
      });
    },

    ioChain: function (callbacks, onEventError) {
      /*
        this function synchronizes a chain of asynchronous io calls
      */
      var next, _onEventError;
      onEventError = onEventError || EXPORTS.onEventErrorDefault;
      next = 0;
      _onEventError = function (error) {
        next += 1;
        if (error || next === callbacks.length) {
          onEventError(error);
          return;
        }
        callbacks[next](_onEventError);
      };
      callbacks[next](_onEventError);
    },

    _ioChain_default_test: function (onEventError) {
      /*
        this function tests ioChain
      */
      var data;
      data = 0;
      EXPORTS.ioChain([function (next) {
        setTimeout(function () {
          data += 1;
          next();
        }, 1);
      }, function (next) {
        setTimeout(function () {
          data += 1;
          next();
        }, 1);
      }, function (next) {
        next(data === 2 ? null : new Error('test failed'));
      }], onEventError);
    },

    isError: function (object) {
      /*
        this function returns the object if it's an error
      */
      if (Error.prototype.isPrototypeOf(object)) {
        return object;
      }
    },

    isErrorTimeout: function (object) {
      /*
        this function returns the object if it's a timeout error
      */
      if (EXPORTS.isError(object) && object.code === 'ETIMEDOUT') {
        return object;
      }
    },

    jsEvalOnEventError: function (file, script, onEventError) {
      /*
        this function evals a script with auto error-handling
      */
      EXPORTS.tryCatchOnEventError(function () {
        /*jslint evil: true*/
        return state.isNodejs ? required.vm.runInThisContext(script, file) : eval(script);
      }, function (error, data) {
        if (error) {
          /* debug */
          state.error = error;
          console.error(file);
          onEventError(error);
          return;
        }
        onEventError(null, data);
      });
    },

    _jsEvalOnEventError_default_test: function (onEventError) {
      /*
        this function tests jsEvalOnEventError's default behavior
      */
      EXPORTS.jsEvalOnEventError('', 'null', onEventError);
    },

    _jsEvalOnEventError_syntaxError_test: function (onEventError) {
      /*
        this function tests jsEvalOnEventError's syntax error behavior
      */
      EXPORTS.jsEvalOnEventError('', 'syntax error', function (error) {
        EXPORTS.tryCatchOnEventError(function () {
          console.assert(EXPORTS.isError(error));
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

    _jsonParseOrError_syntaxError_test: function (onEventError) {
      /*
        this function tests jsonParseOrError's syntax error behavior
      */
      var error;
      error = EXPORTS.jsonParseOrError('syntax error!');
      if (EXPORTS.isError(error)) {
        onEventError();
      }
    },

    jsonStringifyOrError: function (data) {
      /*
        this function returns JSON.stringify(data) or error
      */
      try {
        return JSON.stringify(data);
      } catch (error) {
        return error;
      }
    },

    _jsonStringifyOrError_recursionError_test: function (onEventError) {
      /*
        this function tests jsonStringifyOrError's recursion error behavior
      */
      var error;
      error = {};
      error.error = error;
      error = EXPORTS.jsonStringifyOrError(error);
      if (EXPORTS.isError(error)) {
        onEventError();
      }
    },

    mimeLookup: function (file) {
      /*
        this function returns the mime-type for a given filename
      */
      if (required.mime) {
        return required.mime.lookup(file);
      }
      switch ((/[^\.]*$/).exec(file)[0]) {
      case 'css ':
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
      console.assert(EXPORTS.mimeLookup('css') === 'text/css');
      console.assert(EXPORTS.mimeLookup('html') === 'text/html');
      console.assert(EXPORTS.mimeLookup('js') === 'application/javascript');
      console.assert(EXPORTS.mimeLookup('json') === 'application/json');
      console.assert(EXPORTS.mimeLookup('txt') === 'text/plain');
      console.assert(EXPORTS.mimeLookup('') === 'application/octet-stream');
      onEventError();
    },

    moduleInit: function (module, local2) {
      /*
        this function initializes a module with the provided local2 dictionary
      */
      var exports, name;
      /* assert local2._name */
      console.assert(local2._name, [local2._name]);
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
        /* init document ready once */
        if (state.isBrowser && local2._initReadyOnce) {
          $(local2._initReadyOnce);
        }
      }
      /* run test */
      state.serverResume(function () {
        EXPORTS.testLocal(module, local2, exports);
      });
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

    onEventResume: function (mode) {
      var paused, queue, _resume, self;
      queue = [];
      _resume = function () {
        paused = false;
        queue.forEach(function (onEventResume) {
          onEventResume(self.error);
        });
        queue.length = 0;
      };
      self = function (error) {
        if (error === 'pause') {
          paused = !self.error;
        } else if (error === 'resume') {
          _resume();
        } else if (EXPORTS.isError(error)) {
          self.error = error;
          _resume();
        } else if (typeof error === 'function') {
          if (paused) {
            queue.push(error);
          } else {
            error(self.error);
          }
        } else {
          throw new Error('unknown error ' + [error]);
        }
      };
      self(mode);
      return self;
    },

    _onEventResume_default_test: function (onEventError) {
      var _onEventResume, tmp;
      _onEventResume = EXPORTS.onEventResume('pause');
      tmp = 0;
      _onEventResume(function () {
        if (tmp === 1) {
          onEventError();
          return;
        }
        onEventError(new Error('test failed - onEventResume'));
      });
      setTimeout(function () {
        tmp += 1;
        _onEventResume('resume');
      }, 1);
    },

    _onEventResume_error_test: function (onEventError) {
      var _onEventResume, tmp;
      _onEventResume = EXPORTS.onEventResume('pause');
      tmp = new Error();
      _onEventResume(function (error) {
        if (error === tmp) {
          onEventError();
          return;
        }
        onEventError(new Error('test failed - onEventResume error'));
      });
      _onEventResume(tmp);
    },

    scriptLint: function (file, script) {
      /*
        this function is a dummy substitute for the real function
      */
      return script;
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
          && JSON.stringify(options.cc) === '[]'
          ? null
          : new Error('test failed - setOptionsDefault'));
    },

    stringToCamelCase: function (text) {
      /*
        this function converts dashed names to camel-case
      */
      return text.replace((/-[a-z]/g), function (match) {
        return match[1].toUpperCase();
      });
    },

    _stringToCamelCase_default_test: function (onEventError) {
      try {
        console.assert(EXPORTS.stringToCamelCase('') === '');
        console.assert(EXPORTS.stringToCamelCase('aa-bb-cc') === 'aaBbCc');
        onEventError();
      } catch (error) {
        onEventError(error);
      }
    },

    templateFormat: function (template, dict) {
      return template.replace((/\{\{\w+\}\}/g), function (key) {
        var value;
        value = dict[key.slice(2, -2)];
        return typeof value === 'string' ? value : key;
      });
    },

    _templateFormat_default_test: function (onEventError) {
      if (EXPORTS.templateFormat('{{aa}}', { aa: 1 }) === '{{aa}}'
          && EXPORTS.templateFormat('{{aa}}', { aa: 'bb' }) === 'bb') {
        onEventError();
        return;
      }
      onEventError(new Error('test failed'));
    },

    testLocal: function (module, local2) {
      /* browser-side testing */
      if (state.isPhantomjs || (state.isBrowser && !state.isBrowserTest)) {
        return;
      }
      var environment, _onEventTest, remaining, testSuite;
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
            test.time = (new Date().getTime() - test.time) / 1000;
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
              test.time = new Date().getTime() - test.time;
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
          testSuite.testCases[test] = { name: test, time: new Date().getTime() };
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

    testAssert: function (test, onEventError) {
      /*
        this function helps achieve 100% code coverage
      */
      return function (error, data) {
        if (error) {
          onEventError(error);
          return;
        }
        try {
          test(data);
        } catch (errorAssert) {
          onEventError(errorAssert);
          return;
        }
        onEventError();
      };
    },

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
        EXPORTS.ajaxLocal({
          data: JSON.stringify({
            coverage: global.__coverage__,
            testSuites: state.testSuites
          }),
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

    urlSearchGetItem: function (url, key, delimiter) {
      return EXPORTS.urlSearchParse(url, delimiter).params[key] || '';
    },

    _urlSearchGetItem_default_test: function (onEventError) {
      onEventError(EXPORTS.urlSearchGetItem('/aa#bb=cc%2B', 'bb', '#') === 'cc+' ? null
        : new Error('test failed - urlSearchGetItem'));
    },

    urlSearchParse: function (url, delimiter) {
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
        if (!((EXPORTS.isError(key))
          || (EXPORTS.isError(value)))) {
          params[key] = value;
        }
      }
      return { params: params, path: url };
    },

    urlSearchParsedJoin: function (parsed, delimiter) {
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
      return path.replace('?&', '?');
    },

    urlSearchRemoveItem: function (url, key, delimiter) {
      var parsed;
      parsed = EXPORTS.urlSearchParse(url, delimiter);
      parsed.params[key] = null;
      return EXPORTS.urlSearchParsedJoin(parsed, delimiter);
    },

    urlSearchSetItem: function (url, key, value, delimiter) {
      var parsed;
      parsed = EXPORTS.urlSearchParse(url, delimiter);
      parsed.params[key] = value;
      return EXPORTS.urlSearchParsedJoin(parsed, delimiter);
    },

    _urlSearchSetItem_default_test: function (onEventError) {
      onEventError(EXPORTS.urlSearchSetItem('/aa#bb=1', 'cc', 'dd+', '#')
        === '/aa#bb=1&cc=dd%2B' ? null : new Error('test failed - urlSearchSetItem'));
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



(function moduleCommonBrowser() {
  /*
    this browser module exports common, shared utilities
   */
  'use strict';
  var local;
  local = {

    _name: 'utility2.moduleCommonBrowser',

    _init: function () {
      if (!state.isBrowser) {
        return;
      }
      EXPORTS.moduleInit(module, local);
    },

    _initOnce: function () {
      /* watch server for changes and reload via sse */
      if (state.isBrowserTest === 'watch') {
        new global.EventSource('/test/test.watch').addEventListener('message', function () {
          location.reload();
        });
      }
    },

    onEventErrorAlertDefault: function (error, data) {
      EXPORTS.onEventErrorDefault(error, data);
      if (error) {
        global.alert(error.stack || error.message || error);
      }
    },

  };
  local._init();
}());



(function moduleFtsShared() {
  /*
    this browser module exports fts api
   */
  'use strict';
  var local;
  local = {

    _name: 'utility2.moduleFtsShared',

    _init: function () {
      EXPORTS.moduleInit(module, local);
    },

    _ftsAddDatum: function (id, text, prefixTable) {
      id = ' ' + id.toString() + ' ';
      text = text.trim().toLowerCase();
      var match,
        /* optimization - 2 letter prefix */
        regexp = (/[^\s\-_]{2,}/g),
        tokens = ' ';
      while (true) {
        match = regexp.exec(text);
        if (!match) {
          break;
        }
        match = match[0] + ' ';
        tokens += match;
        /* optimization - 2 letter prefix */
        match = match.slice(0, 2);
        if (!prefixTable[match]) {
          prefixTable[match] = id;
        } else if (prefixTable[match].indexOf(id) < 0) {
          prefixTable[match] += id.slice(1);
        }
      }
      return tokens;
    },

    _Fts: function () {
      return;
    },

    createFts: function () {
      var self;
      self = new local._Fts();
      self.data = { prefixTable: {}, tokenTable: {} };
      return self;
    },

    _Fts_prototype_addData: function (data) {
      var _prefixTable, self, id, ii, key;
      _prefixTable = {};
      self = this.data;
      /* break data into smaller chunks if too big*/
      if (data.length > 256) {
        for (ii = 0; ii < data.length; ii += 256) {
          this.addData(data.slice(ii, ii + 256));
          if (state.debugFlag) {
            console.log('fts - indexed data range ' + ii + ' - ' + (ii + 255));
          }
        }
        return;
      }
      for (ii = 0; ii < data.length; ii += 1) {
        id = data[ii][0];
        if (!self.tokenTable[id]) {
          self.tokenTable[id] = local._ftsAddDatum(id, data[ii][1], _prefixTable);
        }
      }
      /* merge prefixTable */
      for (key in _prefixTable) {
        if (_prefixTable.hasOwnProperty(key)) {
          if (self.prefixTable[key]) {
            self.prefixTable[key] += _prefixTable[key].slice(1);
          } else {
            self.prefixTable[key] = _prefixTable[key];
          }
        }
      }
    },

    _Fts_prototype_query: function (query) {
      var list, lists, match, prefixes, regexp, result, self, shortestList;
      lists = [];
      prefixes = [];
      query = query.trim().toLowerCase();
      /* optimization - 2 letter prefix */
      regexp = (/[^\s]{2,}/g);
      result = [];
      self = this.data;
      while (true) {
        match = regexp.exec(query);
        if (!match) {
          break;
        }
        /* optimization - 2 letter prefix */
        match = match[0].slice(0, 2);
        if (prefixes.indexOf(match) < 0) {
          prefixes.push(match);
          list = self.prefixTable[match];
          /* quit search because of extraneous word */
          if (!list) {
            break;
          }
          list = list.trim().split(/\s+/);
          lists.push(list);
          if (!shortestList || list.length < shortestList.length) {
            shortestList = list;
          }
        }
      }
      if (!shortestList || lists.length < prefixes.length) {
        return [];
      }
      shortestList.forEach(function (id) {
        var ii, tokens;
        tokens = self.tokenTable[id];
        for (ii = 0; ii < lists.length; ii += 1) {
          if (lists[ii].indexOf(id) < 0) {
            return;
          }
        }
        /* optimization - 2 letter prefix */
        regexp = (/[^\s]{2,}/g);
        /* check all query terms match */
        while (true) {
          match = regexp.exec(query);
          if (!match) {
            break;
          }
          if (tokens.indexOf(' ' + match[0]) < 0) {
            return;
          }
        }
        result.push([id, tokens]);
      });
      return result;
    },

    _Fts_default_test: function (onEventError) {
      try {
        var result, self;
        self = EXPORTS.createFts();
        self.addData([[1, 'ab cc'], [2, 'aa bb- Cc aa'], [3, 'aBc']]);
        result = JSON.stringify(self.query('aa cc'));
        if (result !== '[["2"," aa bb cc aa "]]') {
          onEventError(new Error('test failed - ' + result));
          return;
        }
        onEventError();
      } catch (error) {
        onEventError(error);
      }
    },

  };
  local._init();
}());



(function moduleStateBrowser() {
  /*
    this browser module handles the global state and syncs it with localStorage and permalink
   */
  'use strict';
  var local;
  local = {

    _name: 'utility2.moduleStateBrowser',

    _init: function () {
      if (!state.isBrowser) {
        return;
      }
      EXPORTS.moduleInit(module, local);
    },

    _initOnce: function () {
      /* event handling */
      $(document.body)
        /* event change - update state key and refresh */
        .on('change', '[data-state]', local._onEventInputStateChange)
        /* event click - update and click action button in divSplitBtnDropdown */
        .on('click', '.divSplitBtnDropdown a[data-value]',
          local._onEventDivSplitBtnDropdownAClick);
      $(global).on('resize', EXPORTS.onEventDivSplitBtnDropdownRedrawAll);
      /* restore state */
      EXPORTS.stateRestore();
    },

    stateReset: function (defaults, overrides) {
      /*
        this function clears localStorage
        and then restores it with defaults and overrides
      */
      localStorage.clear();
      EXPORTS.stateRestore(defaults, overrides);
    },

    stateRestore: function (defaults, overrides) {
      /*
        this function retores localStorage with defaults and overrides
      */
      /* restore overrides */
      if (overrides) {
        Object.keys(overrides).forEach(function (key) {
          EXPORTS.stateSetItem(key, overrides[key]);
        });
      }
      /* restore defaults */
      if (defaults) {
        Object.keys(defaults).forEach(function (key) {
          if (!localStorage.hasOwnProperty(key)) {
            EXPORTS.stateSetItem(key, defaults[key]);
          }
        });
      }
      /* restore input state */
      $('[data-state]').each(function (ii, target) {
        EXPORTS.stateRestoreInput($(target));
      });
    },

    stateRestoreInput: function (target) {
      var key, parent, value;
      key = target.attr('data-state');
      parent = target.parent();
      if (localStorage.hasOwnProperty(key)) {
        value = localStorage[key];
        switch (target.prop('tagName').toLowerCase()) {
        case 'input':
        case 'textarea':
          target.val(value);
          break;
        case 'button':
          target.attr('data-value', value);
          if (parent.hasClass('divSplitBtnDropdown')) {
            target.html(parent.find('ul > li > a[data-value="' + value + '"]').html());
            /* redraw button */
            setTimeout(function () {
              local._onEventDivSplitBtnDropdownRedraw(parent);
            }, 1);
          }
          break;
        }
      }
    },

    stateSetItem: function (key, value) {
      /*
        this function sets key / value pair to the current state
      */
      /* assert key and value are both strings */
      console.assert(
        typeof key === 'string' && typeof value === 'string',
        [typeof key, typeof value]
      );
      try {
        localStorage[key] = value;
      } catch (error) {
        /* if error, then localStorage is probably full, so we clear it */
        localStorage.clear();
        throw error;
      }
      /* restore input state */
      EXPORTS.stateRestoreInput($('[data-state="' + key + '"]'));
      return value;
    },

    _onEventInputStateChange: function (event) {
      var target;
      target = $(event.target);
      switch (target.prop('tagName').toLowerCase()) {
      case 'input':
      case 'textarea':
        EXPORTS.stateSetItem(target.attr('data-state'), target.val());
        break;
      }
      target.trigger('state.changed');
    },

    _onEventDivSplitBtnDropdownRedraw: function (target) {
      var children, width;
      children = target.children();
      width = target.innerWidth();
      $(children[0]).outerWidth(width - 32);
      $(children[2]).outerWidth(width - 48);
    },

    onEventDivSplitBtnDropdownRedrawAll: function () {
      $('.divSplitBtnDropdown').each(function (ii, target) {
        local._onEventDivSplitBtnDropdownRedraw($(target));
      });
    },

    _onEventDivSplitBtnDropdownAClick: function (event) {
      var target, parent, btn, key, value;
      event.preventDefault();
      target = $(event.target);
      parent = target.parents('.divSplitBtnDropdown');
      btn = parent.children('button[data-state]');
      key = btn.attr('data-state');
      value = target.attr('data-value');
      /* save button state */
      if (key) {
        EXPORTS.stateSetItem(key, value);
        /* redraw button */
        local._onEventDivSplitBtnDropdownRedraw(btn);
      }
      /* click action button */
      btn.attr('data-value', value).html(target.html())
        .trigger('state.changed').trigger('click');
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
      if (!state.isBrowser || state.divXhrProgress) {
        return;
      }
      EXPORTS.moduleInit(module, local);
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
      global.local = local;
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
      if (typeof options === 'string') {
        options = { url: options };
      }
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
        options.url = EXPORTS.urlSearchParsedJoin({
          params: options.params,
          path: options.url
        });
      }
      /* debug */
      if (options.debugFlag || state.debugFlag) {
        console.log(options);
      }
      $.ajax(options).done(function (data, textStatus, xhr) {
        global.xhr = xhr;
        switch (options.dataType) {
        case 'statusCode':
          onEventError(null, xhr.status);
          return;
        }
        onEventError(null, data);
      }).fail(function (xhr, textStatus, errorMessage) {
        switch (options.dataType) {
        case 'statusCode':
          /* ignore error, if all we want is the status code */
          if (xhr.status) {
            onEventError(null, xhr.status);
            return;
          }
          break;
        }
        onEventError(new Error(xhr.status + ' ' + textStatus + ' - ' + options.url + '\n'
          + (xhr.responseText || errorMessage)));
      });
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
      var list = local._xhrProgressList, ii;
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
          = local._divXhrProgressBar[0].className.replace((/progress-bar-\w+/), type);
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
      EXPORTS.moduleInit(module, local);
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

    adminDebug: function (script, onEventError) {
      EXPORTS.ajaxLocal({ data: script, url: "/admin/admin.debug" }, onEventError);
    },

    adminShell: function (script, onEventError) {
      EXPORTS.ajaxLocal({ data: script, url: "/admin/admin.shell" }, onEventError);
    },

  };
  local._init();
}());



(function moduleDbShared() {
  /*
    this shared module exports key / value data store
  */
  'use strict';
  var local;
  local = {

    _name: 'utility2.moduleDbShared',

    _init: function () {
      EXPORTS.moduleInit(module, local);
    },

    createDb: function (name) {
      var self = new local._Db();
      self.name = name;
      return self;
    },

    createDbRandom: function () {
      /*
        this function creates a random db for tests
      */
      return EXPORTS.createDb('table test ' + EXPORTS.dateAndSalt());
    },

    _Db: function () {
      return;
    },

    _Db_prototype_ajax: function (options, onEventError) {
      var data = options.data;
      options.data = null;
      options.table = this.name;
      EXPORTS.ajaxLocal({ data: data, params: options, url: '/db/db.ajax' }, onEventError);
    },

    _Db_prototype_fieldAppend: function (record, field, data, onEventError) {
      this.ajax({ action: 'fieldAppend', data: data, field: field, record: record },
        onEventError);
    },

    _Db_prototype_fieldDelete: function (record, field, onEventError) {
      this.ajax({ action: 'fieldDelete', field: field, record: record }, onEventError);
    },

    _Db_prototype_fieldGet: function (record, field, onEventError) {
      this.ajax({ action: 'fieldGet', field: field, record: record }, onEventError);
    },

    _Db_prototype_recordDelete: function (record, onEventError) {
      this.ajax({ action: 'recordDelete', record: record }, onEventError);
    },

    _Db_prototype_recordDeleteAndUpdate: function (record, data, onEventError) {
      this.ajax({ action: 'recordDeleteAndUpdate', data: data, record: record },
        onEventError);
    },

    _Db_prototype_recordGet: function (record, onEventError) {
      this.ajax({ action: 'recordGet', record: record }, onEventError);
    },

    _Db_prototype_recordUpdate: function (record, data, onEventError) {
      this.ajax({ action: 'recordUpdate', data: data, record: record }, onEventError);
    },

    _Db_prototype_recordsDelete: function (records, onEventError) {
      this.ajax({ action: 'recordsDelete', data: records }, onEventError);
    },

    _Db_prototype_recordsDeleteAndUpdate: function (records, onEventError) {
      this.ajax({ action: 'recordsDeleteAndUpdate', data: records }, onEventError);
    },

    _Db_recordsDeleteAndUpdate_default_test: function (onEventError) {
      var self = EXPORTS.createDbRandom();
      EXPORTS.dbTestChain(self, [function (next) {
        self.recordsDeleteAndUpdate('{}', EXPORTS.testAssert(function (data) {
          console.assert(data === '');
        }, next));
      }], onEventError);
    },

    _Db_prototype_recordsGet: function (records, onEventError) {
      this.ajax({ action: 'recordsGet', data: records }, onEventError);
    },

    _Db_recordsGet_default_test: function (onEventError) {
      var self = EXPORTS.createDbRandom();
      EXPORTS.dbTestChain(self, [function (next) {
        self.recordsGet('{}', EXPORTS.testAssert(function (data) {
          console.assert(data === '{}');
        }, next));
      }], onEventError);
    },

    _Db_prototype_recordsUpdate: function (data, onEventError) {
      this.ajax({ action: 'recordsUpdate', data: data }, onEventError);
    },

    _Db_prototype_tableDelete: function (onEventError) {
      this.ajax({ action: 'tableDelete' }, onEventError);
    },

    _Db_prototype_tableDeleteAndUpdate: function (data, onEventError) {
      this.ajax({ action: 'tableDeleteAndUpdate', data: data }, onEventError);
    },

    _Db_prototype_tableGet: function (onEventError) {
      this.ajax({ action: 'tableGet' }, onEventError);
    },

    _Db_prototype_tableOptionsUpdateAndGet: function (options, onEventError) {
      this.ajax({ action: 'tableOptionsUpdateAndGet', data: JSON.stringify(options) }, onEventError);
    },

    _Db_tableOptionsUpdateAndGet_default_test: function (onEventError) {
      var self = EXPORTS.createDbRandom();
      EXPORTS.dbTestChain(self, [function (next) {
        self.tableOptionsUpdateAndGet(null, EXPORTS.testAssert(function (data) {
          console.assert(JSON.parse(data).dirMaxFiles === 1024);
        }, next));
      }, function (next) {
        self.tableOptionsUpdateAndGet({ 'dirMaxFiles': 16 },
          EXPORTS.testAssert(function (data) {
            console.assert(JSON.parse(data).dirMaxFiles === 16);
          }, next));
      }], onEventError);
    },

    _Db_prototype_tableScanBackward: function (record, limit, onEventError) {
      this.ajax({ action: 'tableScanBackward', record: record, limit: limit.toString() },
        onEventError);
    },

    _Db_prototype_tableScanForward: function (record, limit, onEventError) {
      this.ajax({ action: 'tableScanForward', record: record, limit: limit.toString() },
        onEventError);
    },

    _Db_prototype_tableUpdate: function (data, onEventError) {
      this.ajax({ action: 'tableUpdate', data: data }, onEventError);
    },

    _Db_prototype_tableUpdateRandom: function (limit, onEventError) {
      var data = {}, ii, jj, record;
      if (!limit || limit < 0) {
        onEventError();
        return;
      }
      for (ii = 0; ii < limit; ii += 1) {
        data['record ' + EXPORTS.dateAndSalt()] = record = {};
        for (jj = 0; jj < 2; jj += 1) {
          record['field ' + EXPORTS.dateAndSalt()] = Math.random();
        }
      }
      this.tableUpdate(JSON.stringify(data), onEventError);
    },

    dbTestAggregate: function (self, callbacks, onEventError) {
      EXPORTS.dbTestChain(self, [function (next) {
        EXPORTS.ioAggregate(callbacks, next);
      }], onEventError);
    },

    dbTestChain: function (self, callbacks, onEventError) {
      EXPORTS.ioChain(callbacks, function (error) {
        /* delete table after test */
        self.tableDelete(function (_error) {
          onEventError(error || _error);
        });
      });
    },

  };
  local._init();
}());



(function moduleCommonNodejs() {
  /*
    this nodejs module exports common, nodejs utilities
  */
  'use strict';
  var local;
  local = {

    _name: 'utility2.moduleCommonNodejs',

    _init: function () {
      if (!state.isNodejs) {
        return;
      }
      EXPORTS.moduleInit(module, local);
    },

    _initOnce: function () {
      if (state.initOnce) {
        return;
      }
      state.initOnce = true;
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
        var module2 = module.replace((/\W/g), '_');
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
        required.sqlite3_db = new required.sqlite3.cached.Database(':memory:');
      }
      /* exports */
      global.atob = function (text) {
        return new Buffer(text, 'base64').toString();
      };
      global.btoa = function (text) {
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
      /* process argv */
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
      /* load default config file */
      EXPORTS.tryCatchOnEventError(function () {
        /*jslint stupid: true*/
        state.configDefault = {};
        state.configDefault = JSON.parse(required.fs.readFileSync(process.cwd()
          + '/config_default.json'));
        EXPORTS.setOptionsDefaults(state, EXPORTS.objectCopyDeep(state.configDefault));
        console.log('loaded config_default.json');
      }, EXPORTS.nop);
      /* socks5 proxy */
      if (state.socks5) {
        state.socks5LocalPort = EXPORTS.serverPortRandom();
        EXPORTS.shell({
          script: 'ssh -D ' + state.socks5LocalPort + ' -o StrictHostKeyChecking=no -p '
            + (state.socks5.split(':')[1] || '22') + ' ' + state.socks5.split(':')[0],
          stdio: []
        });
      }
      /* load dynamic config from external url every 60 seconds */
      state.configOverride = state.configOverride || {};
      state.configOverrideUrl = state.configOverrideUrl || '/config/configOverride.json';
      EXPORTS.clearCallSetInterval('configLoadOverride', function () {
        EXPORTS.ajaxNodejs({
          dataType: 'json',
          headers: { authorization: 'Basic ' + state.securityBasicAuthSecret },
          url: state.configOverrideUrl
        }, function (error, data) {
          if (error) {
            EXPORTS.onEventErrorDefault(error);
            return;
          }
          state.configOverride = data;
          underscore.extend(state, EXPORTS.objectCopyDeep(state.configOverride));
          console.log('loaded override config from ' + state.configOverrideUrl);
        });
      }, 60 * 1000);
      if (state.isTest) {
        EXPORTS.debugProcessOnce();
        /* set test timeout */
        setTimeout(process.exit, state.timeoutDefault);
      }
    },

    _ajaxLocal_serverResumeError_test: function (onEventError) {
      /*
        this function tests ajaxLocal's server resume on error behavior
      */
      state.serverResume('resume');
      state.serverResume(new Error());
      EXPORTS.ajaxLocal({
        url: '/test/test.echo'
      }, function (error) {
        state.serverResume.error = null;
        state.serverResume('resume');
        onEventError(error ? null : new Error());
      });
    },

    ajaxNodejs: function (options, onEventError) {
      /*
        this function automatically concatenates the response stream
        as utf8 text, and passes the concatenated result to the callback
      */
      onEventError = onEventError || EXPORTS.onEventErrorDefault;
      if (typeof options === 'string') {
        options = { url: options };
      }
      /* default to localhost if missing http://<host> prefix in url */
      if (options.url[0] === '/') {
        EXPORTS.ajaxLocal(options, onEventError);
        return;
      }
      /* assert valid http / https url */
      console.assert(options.url && options.url.slice(0, 4) === 'http', [options.url]);
      var _onEventError,
        _onEventProgress,
        request,
        timeout,
        urlParsed;
      _onEventError = function (error, data) {
        if (timeout < 0) {
          return;
        }
        clearTimeout(timeout);
        onEventError(error, data);
      };
      _onEventProgress = options._onEventProgress || EXPORTS.nop;
      urlParsed = required.url.parse(options.proxy || options.url);
      options.hostname = urlParsed.hostname;
      options.path = options.proxy ? options.url : urlParsed.path;
      options.rejectUnauthorized = false;
      if (options.params) {
        options.path = EXPORTS.urlSearchParsedJoin({
          params: options.params,
          path: options.path
        });
      }
      options.port = urlParsed.port;
      _onEventProgress();
      /* simulate making ajax request and print debug info, but do not actually do anything */
      if (options.debugFlag === 'simulate') {
        console.log(['ajaxNodejs', options]);
        return;
      }
      /* set timeout */
      timeout = setTimeout(function () {
        timeout = -1;
        onEventError(EXPORTS.createErrorTimeout());
      }, options.timeout || state.timeoutDefault);
      /* socks5 */
      if ((options.socks5 || state.socks5) && options.socks5 !== false
          && !options.createConnection && options.url.indexOf(state.localhost) !== 0) {
        local._ajaxSocks5(options, _onEventError);
        return;
      }
      request = ((urlParsed.protocol === 'https:') ? required.https
        : required.http).request(options, function (response) {
        _onEventProgress();
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
            if (response.statusCode === 303) {
              options.data = null;
              options.method = 'GET';
            }
            EXPORTS.ajaxNodejs(options, _onEventError);
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
        var readStream = response;
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
            if (EXPORTS.isError(data)) {
              /* or if parsing fails, pass an error with offending url */
              _onEventError(new Error('invalid json data from ' + options.url));
              return;
            }
            break;
          default:
            data = data.toString();
          }
          _onEventError(null, data);
        }, _onEventProgress);
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
        console.log(['ajaxNodejs', options]);
      }
    },

    _ajaxSocks5: function (options, onEventError) {
      /*
        this function hooks the socks5 proxy protocol into EXPORTS.ajaxNodejs
      */
      var chunks = new Buffer(0),
        hostname = new Buffer(options.hostname),
        _onEventData,
        _onEventError,
        _onEventTimeout,
        port = Number(options.port || 80),
        socket;
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
        EXPORTS.ajaxNodejs(options, onEventError);
      };
      _onEventError = function (error) {
        onEventError(error);
        socket.destroy();
      };
      _onEventTimeout = setTimeout(_onEventError, state.timeoutDefault,
        new Error('socks5 timeout'));
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

    _ajaxSocks5_default_test: function (onEventError) {
      /*
        this function tests ajax requests through socks5
      */
      if (!state.socks5) {
        onEventError('skip');
        return;
      }
      EXPORTS.ajaxNodejs({ url: 'http://www.yahoo.com' }, onEventError);
    },

    _cssLint: function (file, script) {
      /*
        this function lints a css script for errors
      */
      if (!required.csslint) {
        return script;
      }
      console.log(required.csslint.CSSLint.getFormatter('text')
        .formatResults(required.csslint.CSSLint.verify(script, { ignore: 'ids' }), file, {
          quiet: true
        }));
      return script;
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
      var file2 = file, _onEventChange = function (stat2, stat1, mode) {
        /* execute following code only if modified timestamp has changed */
        if (stat2.mtime < stat1.mtime) {
          return;
        }
        required.fs.readFile(file.name, 'utf8', function (error, content) {
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
          var content2 = content.replace(/^#/, '//#');
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
              EXPORTS.scriptLint(file.name, content2);
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

    _jsLint: function (file, script) {
      /*
        this function lints a js script for errors
      */
      if (!required.jslint) {
        return script;
      }
      /* do not lint if code coverage is enabled */
      if (global.__coverage__) {
        return script;
      }
      var ast, lint;
      /* warn about unused variables */
      if (file.slice(-3) === '.js' && required.uglify_js) {
        try {
          ast = required.uglify_js.parse(script, { filename: file });
          ast.figure_out_scope();
          ast.transform(required.uglify_js.Compressor());
        } catch (errorUglifyjs) {
          EXPORTS.onEventErrorDefault(errorUglifyjs);
        }
      }
      /* jslint */
      if (required.jslint_linter) {
        lint = required.jslint_linter.lint(script, { maxerr: 8 });
        if (!lint.ok) {
          required.jslint_reporter.report(file, lint);
        }
      }
      return script;
    },

    jsUglify: function (file, script) {
      /*
        this function uglifies a js script
      */
      var ast = required.uglify_js.parse(script, { filename: file }),
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

    scriptLint: function (file, script) {
      /*
        this function lints css / html / js / json scripts
      */
      switch (required.path.extname(file)) {
      case '.css':
        return local._cssLint(file, script);
      default:
        return local._jsLint(file, script);
      }
    },

    shell: function (options) {
      /*
        this function provides a quick and dirty way to execute shell scripts
      */
      if (options.verbose !== false) {
        console.log(['shell', options]);
      }
      if (typeof options === 'string') {
        options = { script: options };
      }
      options.stdio = options.stdio || ['ignore', 1, 2];
      var child = required.child_process.spawn(
        options.argv ? options.argv[0] : '/bin/sh',
        options.argv ? options.argv.slice(1) : ['-c', options.script],
        options
      );
      /* log pid */
      if (state.pidDir) {
        required.fs.writeFile(state.pidDir + '/' + child.pid, '', EXPORTS.onEventErrorDefault);
      }
      return child;
    },

    streamReadOnEventError: function (readable, onEventError, onEventProgress) {
      /*
        this function concats data from readable stream and passes it to callback when done
      */
      var chunks = [];
      onEventProgress = onEventProgress || EXPORTS.nop;
      readable.on('data', function (chunk) {
        chunks.push(chunk);
        onEventProgress();
      }).on('error', onEventError).on('end', function () {
        onEventProgress();
        onEventError(null, Buffer.concat(chunks));
      });
    },

  };
  local._init();
}());



(function moduleFsNodejs() {
  /*
    this nodejs module exports filesystem api
  */
  'use strict';
  var local;
  local = {

    _name: 'utility2.moduleFsNodejs',

    _init: function () {
      if (!state.isNodejs) {
        return;
      }
      EXPORTS.moduleInit(module, local);
    },

    _initOnce: function () {
      /*jslint stupid: true*/
      /* exports */
      state.tmpDir = required.path.resolve(state.tmpDir || process.cwd() + '/tmp');
      try {
        /* create cache dir */
        state.cacheDir = state.tmpDir + '/cache';
        EXPORTS.fsMkdirpSync(state.cacheDir);
        /* create pid dir */
        state.pidDir = state.tmpDir + '/pid';
        EXPORTS.fsMkdirpSync(state.pidDir);
        /* kill stale pid's from previous process */
        required.fs.readdirSync(state.pidDir).forEach(function (file) {
          try {
            process.kill(file);
          } catch (ignore) {
          }
          required.fs.unlink(state.pidDir + '/' + file, EXPORTS.nop);
        });
      } catch (error) {
        EXPORTS.onEventErrorDefault(error);
      }
      /* periodically clean up cache directory */
      EXPORTS.clearCallSetInterval('fsCacheCleanup', local._fsCacheCleanup,
        60 * 60 * 1000);
      /* remove old coverage reports */
      EXPORTS.fsRmrAtomic(process.cwd() + '/tmp/coverage', EXPORTS.nop);
      /* remove old test reports */
      EXPORTS.fsRmrAtomic(process.cwd() + '/tmp/test', EXPORTS.nop);
    },

    fsAppendFile: function (file, data, onEventError) {
      /*
        this function append data to a file, while auto-creating missing directories
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
        local._fsRmr(state.cacheDir + '/' + file, EXPORTS.onEventErrorDefault);
      });
      /* get list of files to be removed for the next cycle */
      required.fs.readdir(state.cacheDir, function (error, files) {
        state.cacheFiles = files;
      });
    },

    fsCacheWritestream: function (readable, options, onEventError) {
      /*
        this function writes data from readable stream to a unique cache file
      */
      var cache = state.cacheDir + '/' + EXPORTS.dateAndSalt();
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
          if (error) {
            onEventError(error);
            return;
          }
          if (!files.length) {
            /* empty directory */
            required.fs.rmdir(dir, onEventError);
            return;
          }
          var _recurse, remaining = files.length;
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
      var cache = state.cacheDir + '/' + EXPORTS.dateAndSalt();
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
      var cache = state.cacheDir + '/' + EXPORTS.dateAndSalt();
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
        /* default error behavior */
        onEventError(error);
      });
    },

    _testReport: function (testSuites) {
      var xml = '\n<testsuites>\n';
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
      EXPORTS.fsWriteFileAtomic(state.tmpDir + '/test/' + EXPORTS.dateAndSalt()
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
      EXPORTS.moduleInit(module, local);
      /* start repl */
      if (state.isRepl) {
        EXPORTS.replStart();
      }
    },

    _replParse: function (script) {
      /* optimization - cached callback */
      var aa, bb;
      /* null -> "(null\n)" */
      if (!/^\(.*\n\)$/.test(script)) {
        return script;
      }
      script = script.slice(1, -2);
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
          + '"/\\.\\|.*\\b\\(\\.\\d\\|archive\\|artifacts\\|bower_components\\|build\\|coverage\\|docs\\|external\\|git_modules\\|jquery\\|log\\|logs\\|min\\|node_modules\\|rollup.*\\|swp\\|test\\|tmp\\)\\b" '
          + '| tr "\\n" "\\000" | xargs -0 grep -in ' + JSON.stringify(bb), verbose: false });
        return;
      /* print stringified object */
      case 'print':
        script = 'console.log(String(' + bb + '))';
        break;
      /* sqlite3 commands */
      case 'sql':
        if (!required.sqlite3_db) {
          break;
        }
        if (bb === '_') {
          console.log(required.sqlite3_dbResult);
        } else {
          required.sqlite3_db.all(bb, function (error, rows) {
            if (rows) {
              required.sqlite3_dbResult = rows;
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

    replStart: function () {
      /* start interactive interpreter / debugger */
      if (state.repl || state.repl === false) {
        return;
      }
      state.repl = required.repl.start({ eval: function (script, context, file,
        onEventError) {
        EXPORTS.jsEvalOnEventError('', required.utility2._replParse(script), onEventError);
      }, useGlobal: true });
      state.repl.context.EXPORTS = EXPORTS;
      state.repl.context.required = required;
    },

  };
  local._init();
}());



(function moduleRollupNodejs() {
  /*
    this nodejs module exports rollup api
  */
  'use strict';
  var local;
  local = {

    _name: 'utility2.moduleRollupNodejs',

    _init: function () {
      if (!state.isNodejs) {
        return;
      }
      EXPORTS.moduleInit(module, local);
    },

    _initOnce: function () {
      var _onEventError;
      /* run only in command-line */
      if (module !== require.main) {
        return;
      }
      _onEventError = function (error) {
        if (error) {
          throw error;
        }
        process.exit();
      };
      if (state.minify) {
        EXPORTS.scriptMinify(state.minify, _onEventError);
      } else if (state.rollup) {
        EXPORTS.scriptRollup(state.rollup, _onEventError);
      }
    },

    _cssRollupFile: function (file, content, onEventError) {
      /*
        this function performs additional css parsing
      */
      var dict,
        keys,
        remaining = 0;
      try {
        dict = (/\/\* listing start \*\/\n([\S\s]+?\n)\/\* listing end \*\/\n/).exec(content);
        EXPORTS.scriptLint('', (/\n\/\* (\{[\S\s]+?\n\}) \*\/\n/).exec(dict[1])[1]);
        dict = JSON.parse((/\n\/\* (\{[\S\s]+?\n\}) \*\/\n/).exec(dict[1])[1]);
        keys = Object.keys(dict).filter(function (regexp) {
          regexp = new RegExp(regexp);
          return regexp.test(content);
        });
        if (!keys.length) {
          onEventError();
          return;
        }
      } catch (errorContent) {
        onEventError(errorContent);
        return;
      }
      keys.forEach(function (regexp) {
        var _onEventError = function (error, data) {
          if (remaining < 0) {
            return;
          }
          if (error) {
            remaining = -1;
            onEventError(error);
            return;
          }
          content = content.replace(new RegExp(regexp, 'g'), function (_, file) {
            return '\n"data:' + EXPORTS.mimeLookup(file) + ';base64,'
              + data.toString('base64') + '"\n';
          });
          remaining -= 1;
          if (remaining === 0) {
            remaining = -1;
            local._scriptRollupFile(file, content, onEventError);
          }
        };
        remaining += 1;
        EXPORTS.ajaxNodejs({ dataType: 'binary', debugFlag: true, url: dict[regexp] },
          _onEventError);
      });
    },

    scriptRollup: function (file, onEventError) {
      /*
        this function rolls up a css / js file
      */
      console.log('updating rollup file ... ' + file);
      required.fs.readFile(file, 'utf8', function (error, content) {
        if (error) {
          onEventError(error);
          return;
        }
        var dict = {},
          keys,
          remaining = 0;
        try {
          content = (/\/\* listing start \*\/\n([\S\s]+\n)\/\* listing end \*\/\n/).exec(content);
          keys = content[1].trim().split('\n');
          /* assert non-empty keys */
          console.assert(keys.length);
          content = content[0];
        } catch (errorContent) {
          onEventError(errorContent);
          return;
        }
        keys.forEach(function (key) {
          var _onEventError, url;
          _onEventError = function (error, data) {
            /* concat data to content */
            if (dict[error]) {
              content += '\n' + error + '\n' + dict[error] + '\n';
              return;
            }
            if (remaining < 0) {
              return;
            }
            if (error) {
              remaining = -1;
              onEventError(error);
              return;
            }
            dict[key] = data.replace((/^\ufeff/), '');
            remaining -= 1;
            if (remaining === 0) {
              remaining = -1;
              /* concat data to content */
              keys.forEach(_onEventError);
              /* remove trailing whitespace */
              content = content.replace((/[ \t]+$/gm), '').trim();
              /* additional css parsing */
              if (file.slice(-4) === '.css') {
                local._cssRollupFile(file, content, onEventError);
                return;
              }
              local._scriptRollupFile(file, content, onEventError);
            }
          };
          url = (/[^"](https*:\/\/\S*)/).exec(key);
          if (url) {
            remaining += 1;
            EXPORTS.ajaxNodejs({ debugFlag: true, url: url[1] }, _onEventError);
          }
        });
      });
    },

    _scriptRollupFile: function (file, content, onEventError) {
      /*
        this function saves the file content into both raw and minified form
      */
      EXPORTS.fsWriteFileAtomic(file, content, null, function (error) {
        if (error) {
          onEventError(error);
          return;
        }
        EXPORTS.scriptMinify(file, onEventError);
      });
    },

    scriptMinify: function (file, onEventError) {
      /*
        this function minifies css / js scripts
      */
      required.fs.readFile(file, 'utf8', function (error, data) {
        if (error) {
          onEventError(error);
          return;
        }
        EXPORTS.fsWriteFileAtomic(
          file.replace('.css', '.min.css').replace('.js', '.min.js'),
          file.slice(-4) === '.css' ? required.cssmin(data) : EXPORTS.jsUglify(file, data),
          null,
          onEventError
        );
      });
    },

    _cssRollup_default_test: function (onEventError) {
      var file = state.tmpDir + '/test.rollup.css';
      required.fs.exists(file, function (exists) {
        /* skip test */
        if (!exists) {
          onEventError('skip');
          return;
        }
        local.cssRollup(file, onEventError);
      });
    },

    _jsRollup_default_test: function (onEventError) {
      var file = state.tmpDir + '/test.rollup.js';
      required.fs.exists(file, function (exists) {
        /* skip test */
        if (!exists) {
          onEventError('skip');
          return;
        }
        EXPORTS.jsRollup(file, onEventError);
      });
    },

  };
  local._init();
}());



(function moduleServerNodejs() {
  /*
    this nodejs module exports filesystem api
  */
  'use strict';
  var local;
  local = {

    _name: 'utility2.moduleServerNodejs',

    _init: function () {
      if (!state.isNodejs) {
        return;
      }
      EXPORTS.moduleInit(module, local);
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
          if (EXPORTS.isError(redirect)) {
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
      EXPORTS.ajaxNodejs({
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

    'routerDict_/config/configDefault.json': function (request, response) {
      /*
        this function returns the current default config
      */
      response.end(JSON.stringify(state.configDefault));
    },

    'routerDict_/config/configOverride.json': function (request, response) {
      /*
        this function returns the current override config
      */
      response.end(JSON.stringify(state.configOverride));
    },

    'routerDict_/eval/hashTag.html': function (request, response) {
      /*
        this function returns a script evaluating the hashtag
      */
      if (!response.headersSent) {
        response.writeHead(200, { 'content-type': 'text/html' });
      }
      response.end('<script>eval(decodeURIComponent(location.hash.slice(1)))</script>');
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
        if (EXPORTS.isError(error)) {
          next(error);
          return;
        }
        response.end();
        required.utility2._testReport(error.testSuites);
        /* merge uploaded code coverage object with global.__coverage__ */
        Object.keys(error.coverage || []).forEach(function (key) {
          var file1 = global.__coverage__[key], file2 = error.coverage[key];
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
              var ii, list1 = file1.b[key], list2 = file2.b[key];
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
      if (request.headers.accept !== 'text/event-stream') {
        response.end();
        return;
      }
      /* https://developer.mozilla.org/en-US/docs/Server-sent_events/Using_server-sent_events */
      response.setHeader('content-type', 'text/event-stream');
      response.write('retry: ' + state.timeoutDefault + '\n\n');
      var list = state.testWatch;
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
        if (EXPORTS.isError(path)) {
          next(path);
          return;
        }
        /* parse url search params */
        request.urlParsed = request.urlParsed || EXPORTS.urlSearchParse(request.url);
        /* dyanamic path handler */
        for (path = request.urlPathNormalized; path !== path0; path = EXPORTS.fsDirname(path)) {
          path0 = path = path || '/';
          /* found a handler matching request path */
          if (routerDict[path]) {
            /* debug */
            request.handler = routerDict[path];
            /* process request with error handling */
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
      var _onEventError = function (error) {
        /* call error-handling middleware */
        if (EXPORTS.isError(error)) {
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

    serverRespondOnEventProgress: function (response) {
      /*
        this function forces progress update, by writing blank padding to the server response
      */
      response.connection.setNoDelay(true);
      return function () {
        response.write(local._serverRespondOnEventProgressPadding);
      };
    },

    _serverRespondOnEventProgressPadding: new Array(1024).join(' '),

    serverRespondProxy: function (request, response, next, url) {
      /*
        this function reverse-proxies frontend request to backend network
      */
      var headers = EXPORTS.objectCopyDeep(request.headers),
        urlParsed = required.url.parse(url);
      /* update host header with actual destination */
      headers.host = urlParsed.host;
      EXPORTS.ajaxNodejs({
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
        state.serverResume('resume');
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
        '/public/assets/utility2.js',
      ].map(function (url) {
        return '<script src="' + url + '"></script>\n';
      }).join('')
      + '</body></html>\n',

  };
  local._init();
}());



(function moduleAdminNodejs() {
  /*
    this admin module exports the admin api
  */
  'use strict';
  var local;
  local = {

    _name: 'utility2.moduleAdminNodejs',

    _init: function () {
      if (!state.isNodejs) {
        return;
      }
      EXPORTS.moduleInit(module, local);
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

    'routerDict_/admin/admin.debug': function (request, response, next) {
      /*
        this function runs admin debug code
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
            data = EXPORTS.jsonStringifyOrError(data);
            if (EXPORTS.isError(data)) {
              next(data);
              return;
            }
            response.end(data);
          });
        });
      });
    },

    'routerDict_/admin/admin.exit': function () {
      /*
        this function causes the application to exit
      */
      process.exit();
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
        EXPORTS.fsRename(tmp, state.tmpDir + '/upload/' + request.headers['upload-filename']
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



(function moduleDbNodejs() {
  /*
    this nodejs module implements an asynchronous, b-tree, records / fields data store
  */
  'use strict';
  var local;
  local = {

    _name: 'utility2.moduleDbNodejs',

    _init: function () {
      if (!state.isNodejs) {
        return;
      }
      EXPORTS.moduleInit(module, local);
      /* exports */
      state.dbDir = state.dbDir || state.tmpDir + '/db/tables';
      EXPORTS.dbTables = EXPORTS.dbTables || {};
      /* read all current databases */
      required.fs.readdir(state.dbDir, function (error, files) {
        (files || []).forEach(local._dbTable);
      });
      local._dirMaxDepth = 4;
    },

    'routerDict_/db/db.ajax': function (request, response, next) {
      var _onEventError, options = EXPORTS.urlSearchParse(request.url).params, self;
      /* security - filter options */
      options = {
        action: options.action || '',
        field: options.field || '',
        limit: options.limit || '',
        onEventData: function (chunk) {
          response.write(chunk);
        },
        record: options.record || '',
        table: options.table || ''
      };
      /* get table */
      if (!options.table) {
        next(new Error('invalid table'));
        return;
      }
      self = local._dbTable(options.table);
      _onEventError = function (error) {
        /* rebalance directories if there are no active actions */
        if (self.rebalanceDepth && !self.actionLock) {
          /* pause db actions while re-balancing */
          self.actionResume('pause');
          local._dirRebalance(self);
        }
        if (error) {
          next(error);
          return;
        }
        response.end();
      };
      /* file upload */
      if (options.action === 'fileUpload') {
        EXPORTS.fsCacheWritestream(request, null, function (error, tmp) {
          if (error) {
            _onEventError(error);
            return;
          }
          options.tmp = tmp;
          local._dbAction(self, options, _onEventError);
        });
        return;
      }
      /* get options.json */
      if (request.method.toUpperCase() === 'POST') {
        EXPORTS.streamReadOnEventError(request, function (error, data) {
          if (error) {
            _onEventError(error);
            return;
          }
          options.json = EXPORTS.jsonParseOrError(data);
          if (EXPORTS.isError(options.json)) {
            _onEventError(options.json);
            return;
          }
          /* en-queue action if db is re-balancing */
          self.actionResume(function (error) {
            if (error) {
              _onEventError(error);
              return;
            }
            local._dbAction(self, options, _onEventError);
          });
        });
        return;
      }
      /* en-queue action if db is re-balancing */
      self.actionResume(function (error) {
        if (error) {
          _onEventError(error);
          return;
        }
        local._dbAction(self, options, _onEventError);
      });
    },

    'routerAssetsDict_/db/db.html': function (request, response) {
      /*
        this function serves the db.html asset file
      */
      response.setHeader('content-type', 'text/html');
      response.end(local._dbHtml);
    },

    _dbAction: function (self, options, onEventError) {
      var error, mode, _onEventError;
      error = local._dbOptionsValidate(options);
      if (EXPORTS.isError(error)) {
        onEventError(error);
        return;
      }
      if (typeof error === 'string') {
        options.onEventData(error);
        onEventError();
        return;
      }
      /* perform io */
      options.parents = [{ dir: self.dir }];
      self.actionLock += 1;
      _onEventError = function (error) {
        if (self.actionLock > 0) {
          self.actionLock -= 1;
        }
        onEventError(error);
      };
      switch (options.action) {
      case 'recordsGet':
      case 'tableDelete':
      case 'tableOptionsUpdateAndGet':
      case 'tableScanBackward':
      case 'tableUpdate':
        state.dbActionDict[options.action](self, options, _onEventError);
        return;
      case 'tableScanForward':
        if (options.mode === 'backward' && !options.record) {
          mode = 'backward';
        }
        break;
      }
      /* optimization - cached directory */
      if (options.dir) {
        state.dbActionDict[options.action](self, options, _onEventError);
        return;
      }
      local._dirWithRecord(self, options, mode, function (error) {
        if (error) {
          _onEventError(error);
          return;
        }
        options.dir = options.parents[0].dir + '/' + encodeURIComponent(options.record);
        state.dbActionDict[options.action](self, options, _onEventError);
      });

    },

    dbActionDict_fieldAppend: function (self, options, onEventError) {
      EXPORTS.fsAppendFile(options.dir + '/' + encodeURIComponent(options.field),
        ',' + encodeURIComponent(JSON.stringify(options.JSON)), onEventError);
    },

    dbActionDict_fieldDelete: function (self, options, onEventError) {
      EXPORTS.fsRmrAtomic(options.dir + '/' + encodeURIComponent(options.field), onEventError);
    },

    dbActionDict_fieldGet: function (self, options, onEventError) {
      var file = options.dir + '/' + encodeURIComponent(options.field);
      required.fs.readFile(file, function (error, data) {
        if (error) {
          if (error.code === 'ENOENT') {
            onEventError();
            return;
          }
          onEventError(error);
          return;
        }
        /* appended data */
        if (data[0] === ',') {
          data = EXPORTS.urlDecodeOrError('[' + data.slice(1) + ']');
          if (EXPORTS.isError(data)) {
            onEventError(data);
            return;
          }
        }
        // /* appended data */
        // if (data[0] === ','
            // && EXPORTS.isError(data = EXPORTS.urlDecodeOrError('[' + data.slice(1) + ']'))) {
          // onEventError(data);
          // return;
        // }
        if (EXPORTS.isError(EXPORTS.jsonParseOrError(data))) {
          local._onEventErrorCorruptFile(file, onEventError);
          return;
        }
        options.onEventData(data);
        onEventError(null);
      });
    },

    dbActionDict_recordDelete: function (self, options, onEventError) {
      EXPORTS.fsRmrAtomic(options.dir, local._dbOnEventError2(self, options, onEventError));
    },

    dbActionDict_recordDeleteAndUpdate: function (self, options, onEventError) {
      options.action = 'recordDelete';
      options.action2 = 'recordUpdate';
      local._dbAction(self, options, onEventError);
    },

    dbActionDict_recordGet: function (self, options, onEventError) {
      required.fs.readdir(options.dir, function (error, files) {
        if (error) {
          if (error.code === 'ENOENT') {
            options.onEventData('{}');
            onEventError();
            return;
          }
          onEventError(error);
          return;
        }
        /* empty record */
        if (!files.length) {
          onEventError();
          return;
        }
        options.onEventData('{');
        var remaining = 0;
        files.forEach(function (file) {
          var chunks = '', field = EXPORTS.urlDecodeOrError(file);
          if (EXPORTS.isError(field)) {
            local._onEventErrorCorruptFile(options.dir + '/' + file, onEventError);
            return;
          }
          remaining += 1;
          local._dbAction(self, {
            action: 'fieldGet',
            dir: options.dir,
            field: field,
            onEventData: function (chunk) {
              chunks += chunk;
            },
            record: options.record,
          }, function (error) {
            if (remaining < 0) {
              return;
            }
            if (error) {
              remaining = -1;
              onEventError(error);
              return;
            }
            remaining -= 1;
            var timestamp = 'null';
            if (chunks) {
              if (field === 'timestamp') {
                timestamp = chunks;
              } else {
                options.onEventData(JSON.stringify(field) + ':' + chunks + ',');
              }
            }
            if (!remaining) {
              remaining = -1;
              options.onEventData('"timestamp":' + timestamp + '}');
              onEventError();
            }
          });
        });
      });
    },

    dbActionDict_recordUpdate: function (self, options, onEventError) {
      var _onEventError, remaining = 0;
      _onEventError = function (error) {
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
          onEventError();
        }
      };
      local._dirTimestamp(options.dir, function (error) {
        if (error) {
          onEventError(error);
          return;
        }
        Object.keys(options.json).forEach(function (field) {
          if (field === 'timestamp') {
            return;
          }
          remaining += 1;
          EXPORTS.fsWriteFileAtomic(options.dir + '/' + encodeURIComponent(field),
            JSON.stringify(options.json[field]), null, _onEventError);
        });
      });
    },

    dbActionDict_recordsDelete: function (self, options, onEventError) {
      var _onEventError, remaining = 0;
      _onEventError = function (error) {
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
          onEventError();
        }
      };
      Object.keys(options.json).forEach(function (record) {
        remaining += 1;
        local._dbAction(self, {
          action: 'recordDelete',
          action2: options.action2,
          json: options.json[record],
          record: record
        }, _onEventError);
      });
    },

    dbActionDict_recordsDeleteAndUpdate: function (self, options, onEventError) {
      options.action = 'recordsDelete';
      options.action2 = 'recordsUpdate';
      local._dbAction(self, options, onEventError);
    },

    dbActionDict_recordsGet: function (self, options, onEventError) {
      var remaining = 0;
      options.onEventData('{');
      Object.keys(options.json).forEach(function (record) {
        remaining += 1;
        var chunks = '';
        local._dbAction(self, {
          action: 'recordGet',
          record: record,
          onEventData: function (chunk) {
            chunks += chunk;
          }
        }, function (error) {
          if (remaining < 0) {
            return;
          }
          if (error) {
            remaining = -1;
            onEventError(error);
            return;
          }
          remaining -= 1;
          options.onEventData(JSON.stringify(record) + ':' + chunks);
          if (remaining > 0) {
            options.onEventData(',');
            return;
          }
          options.onEventData('}');
          onEventError();
        });
      });
    },

    dbActionDict_recordsUpdate: function (self, options, onEventError) {
      options.action = 'recordsUpdate';
      local._dbAction(self, options, onEventError);
    },

    dbActionDict_tableDelete: function (self, options, onEventError) {
      EXPORTS.fsRmrAtomic(self.dir, local._dbOnEventError2(self, options, onEventError));
    },

    dbActionDict_tableDeleteAndUpdate: function (self, options, onEventError) {
      options.action = 'tableDelete';
      options.action2 = 'tableUpdate';
      local._dbAction(self, options, onEventError);
    },

    dbActionDict_tableOptionsUpdateAndGet: function (self, options, onEventError) {
      var data;
      /* update table options */
      Object.keys(options.json || {}).forEach(function (key) {
        self[key] = options.json[key];
      });
      /* get table options */
      data = EXPORTS.jsonStringifyOrError(self);
      if (EXPORTS.isError(data)) {
        onEventError(data);
        return;
      }
      options.onEventData(data);
      onEventError();
    },

    dbActionDict_tableScanBackward: function (self, options, onEventError) {
      options.action = 'tableScanForward';
      options.mode = 'backward';
      local._dbAction(self, options, onEventError);
    },

    dbActionDict_tableScanForward: function (self, options, onEventError) {
      var file = encodeURIComponent(options.record),
        _onEventError,
        remaining = Math.min(Number(options.limit) || 1024, 1024),
        written;
      _onEventError = function (error) {
        if (remaining < 0) {
          return;
        }
        if (error) {
          remaining = -1;
          onEventError(error);
          return;
        }
        if (!options.parents.length) {
          remaining = -1;
          options.onEventData(']');
          onEventError();
          return;
        }
        var parent = options.parents.shift(), ii = parent.ii, files = parent.files, record;
        /* backward */
        if (options.mode === 'backward') {
          if (file && files[ii] > file) {
            ii -= 1;
          }
          files = files.slice(0, ii + 1).reverse();
        /* forward */
        } else {
          if (files[ii] < file) {
            ii += 1;
          }
          files = files.slice(ii);
        }
        if (files.length > remaining) {
          files = files.slice(0, remaining);
          remaining = 0;
        } else {
          remaining -= files.length;
        }
        for (ii = 0; ii < files.length; ii += 1) {
          record = EXPORTS.urlDecodeOrError(files[ii]);
          if (EXPORTS.isError(record)) {
            local._onEventErrorCorruptFile(options.dir + '/' + files[ii], onEventError);
            return;
          }
          if (written) {
            options.onEventData(',');
          }
          written = true;
          options.onEventData(JSON.stringify(record));
        }
        if (!remaining) {
          remaining = -1;
          options.onEventData(']');
          onEventError();
          return;
        }
        local._dirNext(self, options, options.mode, _onEventError);
      };
      options.onEventData('[');
      _onEventError();
    },

    dbActionDict_tableUpdate: function (self, options, onEventError) {
      var _onEventError, remaining = 0;
      _onEventError = function (error) {
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
          onEventError();
        }
      };
      Object.keys(options.json).forEach(function (record) {
        remaining += 1;
        local._dbAction(self, {
          action: 'recordUpdate',
          json: options.json[record],
          record: record
        }, _onEventError);
      });
    },

    _dbOnEventError2: function (self, options, onEventError) {
      if (!options.action2) {
        return onEventError;
      }
      return function (error) {
        if (error) {
          onEventError(error);
          return;
        }
        options.action = options.action2;
        options.action2 = null;
        local._dbAction(self, options, onEventError);
      };
    },

    _dbOptionsValidate: function (options) {
      /* validate action */
      if (!state.dbActionDict[options.action]) {
        return new Error('unknown action ' + [options.action]);
      }
      switch ((/[a-z]+/).exec(options.action)[0]) {
      /* validate field */
      case 'field':
        if (!options.field) {
          return new Error('invalid field');
        }
        break;
      /* validate record */
      case 'record':
        if (!options.record) {
          return new Error('invalid record');
        }
        break;
      }
      /* validate data type */
      if (!options.json) {
        switch (options.action) {
        case 'fieldDelete':
        case 'fieldGet':
        case 'recordDelete':
        case 'recordGet':
        case 'tableDelete':
        case 'tableGet':
        case 'tableOptionsUpdateAndGet':
        case 'tableScanBackward':
        case 'tableScanForward':
          return;
        default:
          return new Error('required data missing');
        }
      }
      var tmp;
      switch (options.action) {
      case 'fieldAppend':
        if (options.json === undefined) {
          return new Error('invalid data');
        }
        return;
      /* convert list into dict */
      case 'recordsDelete':
      case 'recordsGet':
        if (Array.isArray(options.json)) {
          tmp = options.json;
          options.json = {};
          tmp.forEach(function (key) {
            if (typeof key !== 'string') {
              return new Error('invalid key');
            }
            options.json[key] = null;
          });
        }
        break;
      }
      if (typeof options.json !== 'object') {
        return new Error('invalid data type ' + [typeof options.json]);
      }
      /* empty options.json */
      if (!underscore.isEmpty(options.json)) {
        return;
      }
      switch (options.action) {
      case 'recordsGet':
        return '{}';
      default:
        return '';
      }
    },

    _dbTable: function (name) {
      /*
        this function creates a database with the given name
      */
      EXPORTS.dbTables[name] = EXPORTS.dbTables[name] || {
        dir: state.dbDir + '/' + encodeURIComponent(name),
        /* the default dirMaxFiles allows a table to reasonably handle one quadrillion records,
           assuming adequate disk space */
        dirMaxFiles: 1024,
        marked: {},
        actionLock: 0,
        actionResume: EXPORTS.onEventResume('resume'),
      };
      return EXPORTS.dbTables[name];
    },

    _dirNext: function (self, options, mode, onEventError) {
      var parent = options.parents[0];
      parent.ii += mode === 'backward' ? -1 : 1;
      if ((mode === 'backward' && parent.ii >= 0)
          || (mode !== 'backward' && parent.ii < parent.files.length)) {
        options.parents.unshift({ dir: parent.dir + '/' + parent.files[parent.ii] });
        local._dirWithRecord(self, options, mode, onEventError);
        return;
      }
      options.parents.pop();
      if (!options.parents.length) {
        onEventError();
        return;
      }
      /* recurse */
      local._dirNext(self, options, mode, onEventError);
    },

    _dirWithRecord: function (self, options, mode, onEventError) {
      /*
        this function looks up the directory where the record would exist
      */
      var _onEventError,
        parents = options.parents,
        record = encodeURIComponent(options.record);
      _onEventError = function (error, files) {
        if (error) {
          onEventError(error);
          return;
        }
        var ii;
        files.sort();
        if (mode === 'backward') {
          ii = files.length - 1;
        } else {
          for (ii = 0; ii < files.length; ii += 1) {
            if (files[ii] > record) {
              break;
            }
          }
          if (ii > 0) {
            ii -= 1;
          }
        }
        parents[0].files = files;
        parents[0].ii = ii;
        if (parents.length > local._dirMaxDepth) {
          onEventError();
          return;
        }
        /* recurse */
        parents.unshift({ dir: parents[0].dir + '/' + files[ii] });
        local._dirRead(self, parents[0].dir, _onEventError);
      };
      local._dirRead(self, parents[0].dir, _onEventError);
    },

    _dirDepth: function (dir) {
      /*
        this function returns a database directory's depth
      */
      return dir.slice(state.dbDir.length).split('/').length - 2;
    },

    _dirRead: function (self, dir, onEventError) {
      /*
        this function reads a directory and marks it if it's too big or too small
      */
      required.fs.readdir(dir, function (error, files) {
        if (error) {
          /* fallback - retry after creating missing directory */
          if (error.code === 'ENOENT' && dir === self.dir) {
            EXPORTS.fsMkdirp(dir + '/!/!/!/!', function (error) {
              if (error) {
                onEventError(error);
                return;
              }
              /* retry */
              local._dirRead(self, dir, onEventError);
            });
            return;
          }
          onEventError(error);
          return;
        }
        if (dir === self.dir) {
          onEventError(null, files);
          return;
        }
        var dict = self.marked;
        /* mark directory for splitting if too big */
        if (files.length > self.dirMaxFiles) {
          dict[dir] = self.rebalanceDepth = local._dirMaxDepth;
        /* mark directory for merging if too small */
        } else if (4 * files.length < self.dirMaxFiles && dir.slice(-2) !== '/!') {
          dict[dir] = self.rebalanceDepth = local._dirMaxDepth;
        /* unmark stale directory */
        } else if (dict[dir]) {
          dict[dir] = null;
        }
        onEventError(null, files);
      });
    },

    _dirRebalance: function (self) {
      /*
        this function re-balances sub-directories to have a certain range of files
      */
      var remaining = 0, _onEventError = function (error) {
        if (remaining < 0) {
          return;
        }
        /* finished re-balancing or encountered error */
        if (error || !self.rebalanceDepth) {
          remaining = -1;
          /* reset rebalance flag */
          self.rebalanceDepth = 0;
          self.marked = {};
          /* resume db actions */
          self.actionResume('resume');
          return;
        }
        if (!self.rebalanceDepthRepeat) {
          self.rebalanceDepth -= 1;
        }
        /* recurse */
        local._dirRebalanceDepth(self, _onEventError);
      };
      local._dirRebalanceDepth(self, _onEventError);
    },

    _dirRebalanceDepth: function (self, onEventError) {
      /* optimization - cached callback */
      if (state.debugFlag) {
        console.log([ 'db rebalance', self.rebalanceDepth, self.marked ]);
      }
      var marked = {}, _onEventError, remaining = 0;
      _onEventError = function (error) {
        if (remaining < 0) {
          return;
        }
        remaining -= 1;
        if (error || !remaining) {
          remaining = -1;
          onEventError(error);
        }
      };
      self.rebalanceDepthRepeat = false;
      Object.keys(self.marked).forEach(function (dir) {
        if (!(self.marked[dir] && local._dirDepth(dir) === self.rebalanceDepth)) {
          return;
        }
        remaining += 1;
        marked[dir] = true;
        self.rebalanceDepthRepeat = true;
        local._dirRead(self, dir, function (error, files) {
          var _join, tmp;
          _join = function (error, dirs) {
            var dir2, index, parent;
            if (remaining < 0) {
              return;
            }
            if (error) {
              _onEventError(error);
              return;
            }
            /* remove current directory after merging */
            if (!dirs) {
              EXPORTS.fsRmrAtomic(dir, _onEventError);
              return;
            }
            /* select previous directory */
            dirs.sort();
            parent = EXPORTS.fsDirname(dir);
            index = dirs.indexOf(dir.slice(parent.length + 1)) - 1;
            dir2 = parent + '/' + dirs[index];
            /* transfer contents from current directory to previous directory */
            if (index >= 0 && !marked[dir2]) {
              /* recurse */
              self.marked[dir2] = true;
              local._dirTransfer(dir, dir2, files, _join);
              return;
            }
            /* default */
            _onEventError();
          };
          if (remaining < 0) {
            return;
          }
          if (error) {
            _onEventError(error);
            return;
          }
          /* split directory into two */
          if (files.length > self.dirMaxFiles) {
            if (state.debugFlag) {
              console.log([ 'db rebalance split', self.rebalanceDepth, dir ]);
            }
            /*jslint bitwise: true*/
            files = files.slice(files.length >> 1);
            tmp = EXPORTS.fsDirname(dir) + '/' + files[0];
            /* recurse */
            if (files.length > self.dirMaxFiles) {
              self.marked[tmp] = true;
            }
            local._dirTransfer(dir, tmp, files, _onEventError);
          /* join directory with previous directory */
          } else if (4 * files.length < self.dirMaxFiles) {
            if (state.debugFlag) {
              console.log([ 'db rebalance join', self.rebalanceDepth, dir ]);
            }
            local._dirRead(self, EXPORTS.fsDirname(dir), _join);
          } else {
            _onEventError();
          }
        });
      });
      if (!remaining) {
        remaining = -1;
        onEventError();
      }
    },

    _dirTimestamp: function (dir, onEventError) {
      EXPORTS.fsWriteFileAtomic(dir + '/timestamp',
        new Date().getTime().toString().slice(0, -3), null, onEventError);
    },

    _dirTransfer: function (dir1, dir2, files, onEventError) {
      /*
        this function transfer files from one directory to another
      */
      var remaining = files.length, _onEventError = function (error) {
        if (remaining < 0) {
          return;
        }
        if (error && error.code !== 'ENOENT') {
          remaining = -1;
          onEventError(error);
          return;
        }
        remaining -= 1;
        if (!remaining) {
          remaining = -1;
          onEventError(error);
        }
      };
      files.forEach(function (file) {
        EXPORTS.fsRename(dir1 + '/' + file, dir2 + '/' + file, _onEventError);
      });
    },

    _onEventCorruptFile: function (file, onEventError) {
      onEventError(new Error('corrupt file ' + file));
      /* delete corrupt file */
      EXPORTS.fsRmrAtomic(file, EXPORTS.nop);
    },

    _dbHtml: '<!DOCTYPE html><html><head>\n'
      + [
        '/public/assets/utility2-external/external.rollup.auto.css'
      ].map(function (url) {
        return '<link href="' + url + '" rel="stylesheet" />\n';
      }).join('')

      + '<style>\n'
      + '</style></head><body>\n'

      + [
        '/public/assets/utility2-external/external.rollup.auto.js',
        '/public/assets/utility2.js',
      ].map(function (url) {
        return '<script src="' + url + '"></script>\n';
      }).join('')
      + '</body></html>\n',

  };
  local._init();
}());



(function moduleTestServerShared() {
  /*
    this shared module exports server-dependent tests
  */
  'use strict';
  var local;
  local = {

    _name: 'utility2.moduleTestServerShared',

    _init: function () {
      EXPORTS.moduleInit(module, local);
    },

    _ajaxLocal_default_test: function (onEventError) {
      EXPORTS.ajaxLocal({ url: '/test/test.echo' }, onEventError);
    },

  };
  local._init();
}());



(function modulePhantomjsShared() {
  /*
    this nodejs / phantomjs module runs a phantomjs server
  */
  'use strict';
  var local;
  local = {

    _name: 'utility2.modulePhantomjsShared',

    _init: function () {
      if (state.isNodejs) {
        state.serverResume(function (error) {
          if (error) {
            EXPORTS.onEventErrorDefault(error);
            return;
          }
          EXPORTS.moduleInit(module, local);
        });
      } else if (state.isPhantomjs) {
        EXPORTS.moduleInit(module, local);
      }
    },

    _initOnce: function () {
      /* nodejs */
      if (state.isNodejs) {
        EXPORTS.phantomjsSpawn();
      }
      /* phantomjs */
      if (!state.isPhantomjs) {
        return;
      }
      /* require */
      required.system = require('system');
      required.webpage = require('webpage');
      required.webserver = require('webserver');
      /* phantomjs server */
      required.webserver.create().listen(required.system.args[2], function (request, response) {
        response.write('200');
        response.close();
        EXPORTS.tryCatchOnEventError(function () {
          var page = required.webpage.create(), url = request.post;
          page.onConsoleMessage = console.log;
          page.open(url, function (status) {
            console.log('phantomjs open -', status, '-', url);
          });
          /* page timeout */
          setTimeout(function () {
            page.close();
          }, state.timeoutDefault);
        }, EXPORTS.onEventErrorDefault);
      });
      console.log('phantomjs server started on port ' + required.system.args[1]);
    },

    phantomjsSpawn: function () {
      /* start a new phantomjsResume for every spawn */
      state.phantomjsResume = EXPORTS.onEventResume('pause');
      state.phantomjsPort = state.phantomjsPort || EXPORTS.serverPortRandom();
      var timeout;
      /* check every second to see if phantomjs spawn is ready */
      EXPORTS.clearCallSetInterval('phantomjsSpawn', function () {
        local._phantomjsTest('/favicon.ico', function (error) {
          if (error) {
            return;
          }
          state.phantomjsResume('resume');
          clearInterval(state.setIntervalDict.phantomjsSpawn);
          clearTimeout(timeout);
        }, 1000);
      });
      /* phantomjs spawn timeout */
      timeout = setTimeout(function () {
        state.phantomjsResume(new Error('phantomjs spawn timeout'));
        clearInterval(state.setIntervalDict.phantomjsSpawn);
        clearTimeout(timeout);
      }, 10 * 1000);
      /* spawn phantomjs process */
      try {
        EXPORTS.shell(required.phantomjs.path + ' ' + required.utility2.file + ' '
          + state.serverPort + ' ' + state.phantomjsPort)
          .on('close', function (exitCode) {
            state.phantomjsResume(new Error(exitCode));
            clearInterval(state.setIntervalDict.phantomjsSpawn);
          });
      } catch (errorPhantomjs) {
        state.phantomjsResume(errorPhantomjs);
      }
    },

    phantomjsTest: function (url, onEventError) {
      state.phantomjsResume(function (error) {
        if (error) {
          onEventError(error);
          return;
        }
        local._phantomjsTest(url, onEventError);
      });
    },

    _phantomjsTest: function (url, onEventError) {
      url = state.localhost + url;
      EXPORTS.ajaxNodejs({
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
      state.phantomjsResume(function (error) {
        if (error) {
          onEventError('skip');
          return;
        }
        EXPORTS.phantomjsTest("/test/test.html#testOnce=1", onEventError);
      });
    },

  };
  local._init();
}());
