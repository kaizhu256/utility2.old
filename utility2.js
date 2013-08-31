#!/usr/bin/env node
/*
utility2.js
common, shared utilities for both browser and nodejs
https://git.corp.yahoo.com/gist/2230

todo:
add password protection for admin module
migrate argv processing to commander
db add webui
db auto-heal incorrectly indexed b-trees
db limit record to 256 fields
add db tableGet
add db recordsScan
create db http interface
add db indexing
*/



/*jslint browser: true, indent: 2, nomen: true, regexp: true*/
(function moduleInitializeFirstShared() {
  /*
    this shared module performs initialization before the below modules are loaded
  */
  'use strict';
  if (typeof global === 'undefined') {
    window.global = window;
  }
  var EXPORTS = global.EXPORTS = global.EXPORTS || {}, local = {
    _init: function () {
      global.module = global.module || null;
      global.required = EXPORTS.required = EXPORTS.required || {};
      /* debug */
      console._log = console._log || console.log;
      console.log = global.printDebug = function () {
        console._log.apply(console, arguments);
      };
      if (global.process && process.versions) {
        /* nodejs */
        if (process.versions.node) {
          EXPORTS.isNodejs = true;
          EXPORTS.require = require;
        }
        /* node-webkit */
        if (process.versions['node-webkit']) {
          EXPORTS.isNodeWebkit = true;
        }
      }
      /* browser */
      if (global.document && document.body) {
        EXPORTS.isBrowser = true;
        if (!global.jQuery) {
          require('./jquery.js');
        }
      }
      /* phantomjs */
      if (global.phantom) {
        EXPORTS.isPhantomjs = true;
        EXPORTS.serverPort = require('system').args[1];
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
  var EXPORTS = global.EXPORTS = global.EXPORTS || {},
    required = EXPORTS.required = EXPORTS.required || {},
    $ = global.jQuery,
    local;
  local = {

    _name: 'utility2.moduleCommonShared',

    _init: function () {
      /* exports */
      Object.keys(local).forEach(function (key) {
        if (key[0] !== '_') {
          EXPORTS[key] = local[key];
        }
      });
      EXPORTS.serverResume = EXPORTS.serverResume || EXPORTS.onEventResume('pause');
      if (EXPORTS.isBrowser) {
        /* browser test flag */
        if ((EXPORTS.isBrowserTest = (/\btestWatch=(\d+)\b/).exec(location.hash)) !== null) {
          /* increment watch counter */
          location.hash = EXPORTS.urlSearchSetItem(location.hash, 'testWatch',
            (Number(EXPORTS.isBrowserTest[1]) + 1).toString(), '#');
          EXPORTS.isBrowserTest = 'watch';
        } else if ((EXPORTS.isBrowserTest = (/\btestOnce=/).exec(location.hash)) !== null) {
          EXPORTS.isBrowserTest = 'once';
        } else if (EXPORTS.isPhantomjs) {
          EXPORTS.isBrowserTest = 'phantomjs';
        }
      }
      if (!EXPORTS.isNodejs) {
        EXPORTS.serverResume('resume');
      }
      /* exports */
      EXPORTS.moduleInit = local.moduleInit;
      EXPORTS.string256 = '\u0000\u0001\u0002\u0003\u0004\u0005\u0006\u0007\b\t\n\u000b\f\r\u000e\u000f\u0010\u0011\u0012\u0013\u0014\u0015\u0016\u0017\u0018\u0019\u001a\u001b\u001c\u001d\u001e\u001f !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';
      EXPORTS.timeoutDefault = 30 * 1000;
      /* init module */
      EXPORTS.moduleInit(module, local);
      /* browser */
      if (EXPORTS.isBrowser) {
        /* cache element id */
        $('[id]').each(function (ii, target) {
          EXPORTS[target.id] = EXPORTS[target.id] || $(target);
        });
        /* ajax */
        EXPORTS.ajaxProgressOnEventError = EXPORTS.ajaxProgressOnEventError
          || function (options, onEventError) {
            onEventError = onEventError || EXPORTS.onEventErrorDefault;
            options.contentType = options.contentType || 'application/octet-stream';
            options.dataType = options.dataType || 'text';
            options.type = options.type || options.method;
            $.ajax(options).done(function (data) {
              onEventError(null, data);
            }).fail(function (xhr, textStatus, errorMessage) {
              onEventError(new Error(xhr.responseText || errorMessage));
            });
          };
      }
    },

    ajaxLocal: function (options, onEventError) {
      if (options.data) {
        options.method = options.type = 'POST';
      }
      /* browser */
      if (EXPORTS.isBrowser) {
        EXPORTS.ajaxProgressOnEventError(options, onEventError);
        return;
      }
      /* nodejs */
      EXPORTS.serverResume(function (error) {
        if (error) {
          onEventError(error);
        }
        options.url = 'http://localhost:' + EXPORTS.serverPort + options.url;
        EXPORTS.ajaxNodejs(options, onEventError);
      });
    },

    _test_ajaxLocal: function (onEventError) {
      EXPORTS.serverResume(function (error) {
        if (error) {
          onEventError('skip');
          return;
        }
        EXPORTS.ajaxLocal({ url: '/test/test.echo' }, onEventError);
      });
    },

    base64Decode: function (text) {
      return global.atob(text.replace((/-/g), '+').replace((/_/g), '/'));
    },

    base64Encode: function (text) {
      return global.btoa(text).replace((/\+/g), '-').replace((/\//g), '_')
        .replace((/\=+/g), '');
    },

    dateAndSalt: function () {
      /*
        this function generates a unique, incrementing date counter with a random salt
      */
      if (!local._dateAndSaltCounter || local._dateAndSaltCounter >= 9999) {
        local._dateAndSaltCounter = 1000;
      }
      /* timestamp field */
      return (new Date().toISOString().slice(0, 20)
        /* counter field */
        + (local._dateAndSaltCounter += 1)
        /* random number field */
        + Math.random().toString().slice(2))
        /* bug - phantomjs can only parse dates less than 30 characters long */
        .slice(0, 29);
    },

    _test_dateAndSalt: function (onEventError) {
      /* assert each call returns incrementing result */
      onEventError(!(EXPORTS.dateAndSalt(1) < EXPORTS.dateAndSalt(2)
        /* assert call can be converted to date */
        && new Date(EXPORTS.dateAndSalt()).getTime()));
    },

    dictIsEmpty: function (dict) {
      /*
        this function return true if dict is empty and false otherwise
      */
      var key;
      for (key in dict) {
        if (dict.hasOwnProperty(key)) {
          return false;
        }
      }
      return true;
    },

    fsDirname: function (file) {
      /*
        this function returns a file name's parent directory
      */
      return file.replace((/\/[^\/]+\/*$/), '');
    },

    htmlEscape: function (text) {
      return text.replace((/&/g), '&amp;').replace((/</g), '&lt;').replace((/>/g), '&gt;');
    },

    ioChain: function (chain, onEventError) {
      /*
        this function synchronizes a chain of asynchronous io calls of the form
        function (state, data, next, onEventError)
        usage:
        EXPORTS.ioChain(function (state, data, onEventError) {
          switch (state) {
          case 0:
            required.fs.writeFile('/tmp/foo.txt', 'hello world', onEventError);
            break;
          case 1:
            required.fs.readFile('/tmp/foo.txt', 'utf8', onEventError);
            break;
          case 2:
            onEventError(data === 'hello world' ? 'finish' : new Error('test failed'));
            break;
          }
        }, onEventError);
      */
      onEventError = onEventError || EXPORTS.onEventErrorDefault;
      var _onEventError, state = 0;
      _onEventError = function (error, data) {
        if (!error) {
          chain(state += 1, data, _onEventError);
        } else if (EXPORTS.isError(error)) {
          onEventError(error);
        } else if (error === 'finish') {
          onEventError(null, error);
        } else {
          onEventError(new Error('unknown error ' + [error]));
        }
      };
      chain(state, null, _onEventError);
    },

    _test_ioChain: function (onEventError) {
      if (!EXPORTS.isNodejs) {
        onEventError('skip');
        return;
      }
      EXPORTS.ioChain(function (state, data, onEventError) {
        switch (state) {
        case 0:
          required.fs.writeFile('/tmp/foo.txt', 'hello world', onEventError);
          break;
        case 1:
          required.fs.readFile('/tmp/foo.txt', 'utf8', onEventError);
          break;
        case 2:
          onEventError(data === 'hello world' ? 'finish' : new Error('test failed'));
          break;
        }
      }, onEventError);
    },

    isError: function (object) {
      /*
        this function returns the object if it's an error
      */
      if (Error.prototype.isPrototypeOf(object)) {
        return object;
      }
    },

    jsEvalOnEventError: function (script, file, onEventError) {
      var data;
      try {
        /*jslint evil: true*/
        data = EXPORTS.isNodejs ? required.vm.runInThisContext(script, file) : eval(script);
      } catch (error) {
        /* debug */
        EXPORTS.error = error;
        console.error(file);
        onEventError(error);
        return;
      }
      onEventError(null, data);
    },

    jsonCopy: function (data) {
      return JSON.parse(JSON.stringify(data));
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

    moduleInit: function (module, local2) {
      /* assert local2._name */
      console.assert(local2._name, [local2._name]);
      /* exports */
      var name = local2._name.split('.'),
        exports = EXPORTS.required[name[0]] = EXPORTS.required[name[0]] || {};
      /* nodejs middleware routes */
      if (EXPORTS.isNodejs) {
        local2._routesDict = required.utility2_routesDict = required.utility2_routesDict || {};
      }
      Object.keys(local2).forEach(function (key) {
        var match;
        /* dict item */
        if ((match = (/(.+Dict)_(.+)/).exec(key)) !== null) {
          local2[match[1]][match[2]] = local2[key];
        /* prototype item */
        } else if ((match = (/(.+)_prototype_(.+)/).exec(key)) !== null) {
          local2[match[1]].prototype[match[2]] = local2[key];
        /* export local2 */
        } else if (key[0] === '_') {
          exports[key] = local2[key];
        /* export global */
        } else {
          EXPORTS[key] = local2[key];
        }
      });
      /* first-time init */
      required.utility2_initOnceDict = required.utility2_initOnceDict || {};
      if (!required.utility2_initOnceDict[local2._name]) {
        required.utility2_initOnceDict[local2._name] = true;
        /* init once */
        if (local2._initOnce) {
          local2._initOnce();
        }
        /* require once */
        if (required.utility2._moduleRequireOnce) {
          required.utility2._moduleRequireOnce(module, local2, exports);
        }
      }
      /* init nodejs */
      if (EXPORTS.moduleInitNodejs) {
        EXPORTS.moduleInitNodejs(module, local2, exports);
      }
      /* run test */
      EXPORTS.testLocal(module, local2, exports);
    },

    nop: function () {
      /*
        this function performs no operation (nop)
      */
    },

    _test_nop: function (onEventError) {
      var error = !(EXPORTS.nop() === undefined
        && EXPORTS.nop(1, 2) === undefined);
      onEventError(error);
    },

    onEventErrorDefault: function (error, data) {
      /*
        this function provides a common, default error / data callback.
        on error, it will print the error statck.
        on data, it will print the data.
      */
      if (error) {
        /* debug */
        EXPORTS.error = error;
        console.error(error.stack || error.message || error);
        return;
      }
      if (data === undefined) {
        return;
      }
      console.log((global.Buffer && global.Buffer.isBuffer(data)) ? data.toString() : data);
    },

    onEventResume: function (mode) {
      var _error, paused, queue = [], _resume, self;
      _resume = function () {
        paused = false;
        queue.forEach(function (onEventResume) {
          onEventResume(_error);
        });
        queue.length = 0;
      };
      self = function (error) {
        if (error === 'pause') {
          if (!_error) {
            paused = true;
          }
        } else if (error === 'resume') {
          _resume();
        } else if (EXPORTS.isError(error)) {
          _error = error;
          _resume();
        } else if (typeof error === 'function') {
          if (paused) {
            queue.push(error);
          } else {
            error(_error);
          }
        } else {
          throw new Error('unknown error ' + [error]);
        }
      };
      self(mode);
      return self;
    },

    _test_onEventResume: function (onEventError) {
      var _onEventResume = EXPORTS.onEventResume('pause'), tmp = 0;
      _onEventResume(function () {
        if (tmp === 1) {
          onEventError();
          return;
        }
        onEventError(new Error('test failed'));
      });
      setTimeout(function () {
        tmp += 1;
        _onEventResume('resume');
      }, 1);
    },

    _test_onEventResumeError: function (onEventError) {
      var _onEventResume = EXPORTS.onEventResume('pause'), tmp = new Error();
      _onEventResume(function (error) {
        if (error === tmp) {
          onEventError();
          return;
        }
        onEventError(new Error('test failed'));
      });
      _onEventResume(tmp);
    },

    setOptionsDefaults: function (options, defaults) {
      /*
        this function recursively walks through the options tree
        and sets default values if the are not set.
        usage:
        setOptionsDefaults(
          options = { foo: 1, bar: {} },
          defaults = { bar: { baz: 2 } }
        );
        return:
        { foo: 1, bar: { baz: 2 } }
      */
      var key, value;
      for (key in defaults) {
        if (defaults.hasOwnProperty(key)) {
          value = defaults[key];
          if (!options.hasOwnProperty(key)) {
            options[key] = value;
          } else if (
            options[key] && typeof options[key] === 'object' && typeof value === 'object'
          ) {
            EXPORTS.setOptionsDefaults(options[key], value);
          }
        }
      }
      return options;
    },

    templateFormat: function (template, dict) {
      return template.replace((/\{\{\w+\}\}/g), function (key) {
        var value = dict[key.slice(2, -2)];
        return typeof value === 'string' ? value : key;
      });
    },

    _test_templateFormat: function (onEventError) {
      if (EXPORTS.templateFormat('{{aa}}', { aa: 1 }) === '{{aa}}'
          && EXPORTS.templateFormat('{{aa}}', { aa: 'bb' }) === 'bb') {
        onEventError();
        return;
      }
      onEventError(new Error('test failed'));
    },

    testLocal: function (module, local2) {
      /* browser-side testing */
      if (EXPORTS.isPhantomjs || (EXPORTS.isBrowser && !EXPORTS.isBrowserTest)) {
        return;
      }
      var environment, _onEventTest, remaining = 0, testSuite;
      environment = EXPORTS.isBrowser ? 'browser' : 'nodejs';
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
              EXPORTS.onEventErrorDefault(new Error(test.failure = 'test timeout'));
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
          required.utility2_testCounter -= 1;
          /* timeout remaining tests */
          Object.keys(testSuite.testCases).forEach(_onEventTest);
          /* finish test suites */
          if (required.utility2_testCounter <= 0) {
            required.utility2_testCounter = 0;
            EXPORTS.testReport();
          }
          return;
        /* start test */
        case 'start':
          local2[test.name](function (error) {
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
          });
          return;
        default:
          if (test.slice(0, 6) !== '_test_') {
            return;
          }
          if (!remaining) {
            required.utility2_testCounter = required.utility2_testCounter || 0;
            required.utility2_testCounter += 1;
          }
          remaining += 1;
          /* en-queue test */
          setTimeout(_onEventTest, 100, testSuite.testCases[test]
            = { name: test, time: new Date().getTime() }, 'start');
        }
      };
      Object.keys(local2).forEach(_onEventTest);
      if (remaining) {
        /* add test suite */
        required.utility2_testSuites = required.utility2_testSuites || [];
        required.utility2_testSuites.push(testSuite);
        /* add timeout to test suite */
        setTimeout(_onEventTest, EXPORTS.timeoutDefault, null, 'finish');
      }
    },

    testReport: function () {
      var result = '\n';
      required.utility2_testSuites.forEach(function (testSuite) {
        result += [testSuite.environment, 'tests -', testSuite.failures, 'failed /',
          testSuite.skipped, 'skipped /', testSuite.passed, 'passed in', testSuite.name]
          .join(' ') + '\n';
      });
      console.log(result);
      if (EXPORTS.isBrowser) {
        /* upload test report */
        EXPORTS.ajaxLocal({
          data: JSON.stringify({
            coverage: global.__coverage__,
            testSuites: required.utility2_testSuites
          }),
          url: '/test/test.upload'
        });
        /* reset code coverage */
        if (global.__coverage__) {
          global.__coverage__ = {};
        }
      } else {
        required.utility2._testReport(required.utility2_testSuites);
      }
      /* reset test suites */
      required.utility2_testSuites.length = 0;
    },

    tryOnEventError: function (callback, onEventError) {
      try {
        callback();
        onEventError();
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
      return (url.length > 4096
          || (url = (/[^#&?]*/).exec(encodeURI(url))[0]) === ''
          || url.length > 256
          || (/\.\/|\.$/).test(url)) ? new Error('invalid url') : url
        .replace((/\/\/+/), '/').replace((/\/$/), '');
    },

    urlSearchParse: function (url, delimiter) {
      delimiter = delimiter || '?';
      var key,
        match = url.indexOf(delimiter),
        params = {},
        regexp = (/([^&]+)=([^&]+)/g),
        search,
        value;
      if (match < 0) {
        return { params: params, path: url };
      }
      search = url.slice(match + 1);
      url = url.slice(0, match + 1);
      while (true) {
        match = regexp.exec(search);
        if (!match) {
          return { params: params, path: url };
        }
        key = EXPORTS.urlDecodeOrError(match[1]);
        value = EXPORTS.urlDecodeOrError(match[2]);
        /* validate key / value */
        if (!(EXPORTS.isError(key) || EXPORTS.isError(value))) {
          params[key] = value;
        }
      }
    },

    urlSearchParsedJoin: function (parsed, delimiter) {
      delimiter = delimiter || '?';
      if (parsed.path.indexOf(delimiter) < 0) {
        parsed.path += delimiter;
      }
      Object.keys(parsed.params).sort().forEach(function (key, ii) {
        if (typeof parsed.params[key] === 'string') {
          if (ii) {
            parsed.path += '&';
          }
          parsed.path += encodeURIComponent(key) + '=' + encodeURIComponent(parsed.params[key]);
        }
      });
      return parsed.path;
    },

    urlSearchGetItem: function (url, key, delimiter) {
      return EXPORTS.urlSearchParse(url, delimiter).params[key] || '';
    },

    urlSearchRemoveItem: function (url, key, delimiter) {
      var parsed = EXPORTS.urlSearchParse(url, delimiter);
      parsed.params[key] = null;
      return EXPORTS.urlSearchParsedJoin(parsed, delimiter);
    },

    urlSearchSetItem: function (url, key, value, delimiter) {
      var parsed = EXPORTS.urlSearchParse(url, delimiter);
      parsed.params[key] = value;
      return EXPORTS.urlSearchParsedJoin(parsed, delimiter);
    },

    _test_urlSearch: function (onEventError) {
      if (EXPORTS.urlSearchGetItem('/aa#bb=cc%2B', 'bb', '#') === 'cc+'
          && EXPORTS.urlSearchSetItem('/aa', 'bb', 'cc+', '#') === '/aa#bb=cc%2B') {
        onEventError();
        return;
      }
      onEventError(new Error('test failed'));
    },

    uuid4: function () {
      /*
        this function returns uuid4 string of form xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      */
      /*jslint bitwise: true*/
      var id = '', ii;
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
}(global));



(function moduleCommonBrowser(global) {
  /*
    this browser module exports common, shared utilities
   */
  'use strict';
  var EXPORTS = global.EXPORTS = global.EXPORTS || {},
    $ = global.jQuery,
    local;
  local = {

    _name: 'utility2.moduleCommonBrowser',

    _onEventModalHide: function (event) {
      $(event.target).parents('.modal').modal('hide');
    },

    _init: function () {
      if (!EXPORTS.isBrowser) {
        return;
      }
      /* init module */
      EXPORTS.moduleInit(module, local);
    },

    _initOnce: function () {
      /* event handling */
      $(document.body).on('click', '.modal [data-dismiss="modal"]', local._onEventModalHide);
      /* reload page if server code is modified */
      if (EXPORTS.isBrowserTest === 'watch') {
        setInterval(function () {
          $.ajax({ url: '/test/test.timestamp' }).done(function (timestamp) {
            /* if timestamp is greater than current saved timestamp, then reload */
            if (timestamp > (local._timestamp = local._timestamp || timestamp)) {
              location.reload();
            }
          });
        /* 4000 ms poll */
        }, 4000);
      }
    },

  };
  local._init();
}(global));



(function moduleStateBrowser(global) {
  /*
    this browser module handles the global state and syncs it with localStorage and permalink
   */
  'use strict';
  var EXPORTS = global.EXPORTS = global.EXPORTS || {},
    $ = global.jQuery,
    local;
  local = {

    _name: 'utility2.moduleStateBrowser',

    _init: function () {
      if (!EXPORTS.isBrowser) {
        return;
      }
      /* init module */
      EXPORTS.moduleInit(module, local);
    },

    _initOnce: function () {
      /* event handling */
      $(document.body)
        /* event change - update state key and refresh */
        .on('change', '[data-state]', local._onEventInputStateChange)
        /* event click - update and click action button in divSplitBtnDropdown */
        .on('click', 'div.divSplitBtnDropdown > ul.dropdown-menu > li > a[data-value]',
          local._onEventDivSplitBtnDropdownAClick);
      $(global).on('resize', function () {
        $('div.divSplitBtnDropdown > button[data-state]').each(function (ii, target) {
          local._onEventDivSplitBtnDropdownBtnRedraw($(target));
        });
      });
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
      /* restore defaults */
      if (defaults) {
        Object.keys(defaults).forEach(function (key) {
          if (!localStorage.hasOwnProperty(key)) {
            EXPORTS.stateSetItem(key, defaults[key]);
          }
        });
      }
      /* restore overrides */
      if (overrides) {
        Object.keys(overrides).forEach(function (key) {
          EXPORTS.stateSetItem(key, overrides[key]);
        });
      }
      /* restore input state */
      $('[data-state]').each(function (ii, target) {
        EXPORTS.stateRestoreInput($(target));
      });
    },

    stateRestoreInput: function (target) {
      var key = target.attr('data-state'), parent = target.parent(), value;
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
              local._onEventDivSplitBtnDropdownBtnRedraw(target);
            }, 1);
          }
          break;
        case 'select':
          target.attr('data-value', value);
          target.find('option[data-value="' + value + '"]').prop('selected', true);
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
      var target = $(event.target);
      switch (target.prop('tagName').toLowerCase()) {
      case 'input':
      case 'textarea':
        EXPORTS.stateSetItem(target.attr('data-state'), target.val());
        break;
      case 'select':
        EXPORTS.stateSetItem(
          target.attr('data-state'),
          target.find('option:selected').attr('data-value')
        );
        break;
      }
      target.trigger('changed');
    },

    _onEventDivSplitBtnDropdownBtnRedraw: function (target) {
      var parent = target.parent();
      target.outerWidth(
        parent.innerWidth() - parent.find('button.dropdown-toggle').outerWidth() - 1
      );
    },

    _onEventDivSplitBtnDropdownAClick: function (event) {
      event.preventDefault();
      var target = $(event.target),
        value = target.attr('data-value'),
        btn = target.parents('div.divSplitBtnDropdown').children('button[data-state]'),
        key = btn.attr('data-state');
      /* save button state */
      if (key) {
        EXPORTS.stateSetItem(key, value);
      }
      /* click action button */
      btn.attr('data-value', value).html(target.html()).trigger('changed').trigger('click');
      /* redraw button */
      local._onEventDivSplitBtnDropdownBtnRedraw(btn);
    },

  };
  local._init();
}(global));



(function moduleXhrProgressBrowser(global) {
  /*
    this browser module provides a drop-in replacement for jQuery.ajax
    with an automatic progress meter
  */
  'use strict';
  var EXPORTS = global.EXPORTS = global.EXPORTS || {},
    $ = global.jQuery,
    local;
  local = {

    _name: 'utility2.moduleXhrProgressBrowser',

    _init: function () {
      if (!EXPORTS.isBrowser) {
        return;
      }
      /* init module */
      EXPORTS.moduleInit(module, local);
    },

    _initOnce: function () {
      /* css */
      $(document.head).append('<style>\n'
        + 'div#divXhrProgress {\n'
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
        + 'div#divXhrProgress > div.progress {\n'
          + 'background-color: #777;\n'
          + 'margin: 10px;\n'
        + '}\n'
        + 'div#divXhrProgress > div.progress {\n'
          + 'background-color: #777;\n'
          + 'margin: 10px;\n'
        + '}\n'
        + '</style>\n');
      /* initialize xhr progress container */
      $(document.body).append(local._divXhrProgress = $('<div id="divXhrProgress">\n'
        + '<div class="active progress progress-striped">\n'
          + '<div class="progress-bar progress-bar-info">loading\n'
        + '</div></div></a>\n'));
      local._divXhrProgressBar = local._divXhrProgress.find('div.progress-bar');
      /* event handling */
      local._divXhrProgress.on('click', function () {
        while (local._xhrProgressList.length) {
          local._xhrProgressList.pop().abort();
        }
      });
      global.local = local;
    },

    ajaxProgress: function (options) {
      /*
        this convenience function serves as a drop-in replacement for jQuery.ajax.
        usage:
        EXPORTS.ajaxProgress({
          contentType: 'application/octet-stream',
          data: 'hello world',
          dataType: 'text',
          type: 'POST',
          url: '/upload/foo.txt'
        }).done(function (data, textStatus, xhr) {
          EXPORTS.onEventErrorDefault(null, data);
        }).fail(function (xhr, textStatus, errorMessage) {
          EXPORTS.onEventErrorDefault(new Error(errorMessage));
        });
      */
      if (typeof options === 'string') {
        options = { url: options };
      }
      options.contentType = options.contentType || 'application/octet-stream';
      options.dataType = options.dataType || 'text';
      options.type = options.type || options.method;
      if (options.params) {
        options.url = EXPORTS.urlSearchParsedJoin({
          params: options.params,
          path: options.url
        });
      }
      options.xhr = options.xhr || local._xhrProgress;
      return $.ajax(options);
    },

    ajaxProgressOnEventError: function (options, onEventError) {
      /*
        this convenience function simplifies the callback
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
      EXPORTS.ajaxProgress(options).done(function (data) {
        onEventError(null, data);
      }).fail(function (xhr, textStatus, errorMessage) {
        onEventError(new Error(xhr.status + ' ' + textStatus + ' - ' + options.url + '\n'
          + (xhr.responseText || errorMessage)));
      });
    },

    _ajaxProgressOnEventErrorFile: function (options, onEventError) {
      options.headers = options.headers || {};
      options.headers['upload-filename'] = options.file.name;
      options.processData = false;
      var reader = new global.FileReader();
      reader.onload = function (event) {
        /*jslint bitwise: true*/
        var data = event.target.result,
          ii,
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
      local._xhrProgressStatus(
        100 - 100 / (local._progress += 0.25) + '%',
        'progress-bar-info',
        'loading'
      );
    },

    _xhrProgress: function () {
      var xhr = new XMLHttpRequest();
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
}(global));



(function moduleAdminBrowser() {
  /*
    this browser module exports key / value data store
  */
  'use strict';
  var EXPORTS = global.EXPORTS = global.EXPORTS || {},
    local;
  local = {

    _name: 'utility2.moduleAdminBrowser',

    _init: function () {
      if (!(EXPORTS.isBrowser && location.pathname === '/admin/admin.html')) {
        return;
      }
      /* init module */
      EXPORTS.moduleInit(module, local);
    },

    _initOnce: function () {
      /* event handling */
      EXPORTS.inputAdminUpload.on("change", function (event) {
        EXPORTS.ajaxProgressOnEventError({
          file: event.target.files[0],
          method: "POST",
          url: "/admin/admin.upload"
        });
      });
    },

    ajaxAdminDebug: function (script, onEventError) {
      EXPORTS.ajaxLocal({ data: script, url: "/admin/admin.debug" }, onEventError);
    },

    ajaxAdminShell: function (script, onEventError) {
      EXPORTS.ajaxLocal({ data: script, url: "/admin/shell" }, onEventError);
    },

  };
  local._init();
}(global));



(function moduleDbShared() {
  /*
    this shared module exports key / value data store
  */
  'use strict';
  var EXPORTS = global.EXPORTS = global.EXPORTS || {},
    local;
  local = {

    _name: 'utility2.moduleDbShared',

    _init: function () {
      /* init module */
      EXPORTS.moduleInit(module, local);
    },

    _Db: function () {
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

    _Db_prototype_fileDownload: function (file, onEventError) {
      this.ajax({ action: 'fileDownload', record: file }, onEventError);
    },

    _Db_prototype_fileUpload: function (file, data, onEventError) {
      this.ajax({ action: 'fileUpload', data: data, record: file }, onEventError);
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

    _Db_prototype_recordsGet: function (records, onEventError) {
      this.ajax({ action: 'recordsGet', data: records }, onEventError);
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
      for (ii = 0; ii < limit; ii += 1) {
        data['record ' + EXPORTS.dateAndSalt()] = record = {};
        for (jj = 0; jj < 2; jj += 1) {
          record['field ' + EXPORTS.dateAndSalt()] = Math.random();
        }
      }
      this.tableUpdate(JSON.stringify(data), onEventError);
    },

    createDb: function (name) {
      var self = new local._Db();
      self.name = name;
      return self;
    },

  };
  local._init();
}(global));



(function moduleCommonNodejs(global) {
  /*
    this nodejs module exports common, nodejs utilities
  */
  'use strict';
  var EXPORTS = global.EXPORTS = global.EXPORTS || {},
    required = EXPORTS.required = EXPORTS.required || {},
    local;
  local = {

    _name: 'utility2.moduleCommonNodejs',

    _init: function () {
      if (!EXPORTS.isNodejs) {
        return;
      }
      local._initOnceNodejs();
      /* init module */
      EXPORTS.moduleInit(module, local);
    },

    _initOnceNodejs: function () {
      if (required.utility2_initOnce) {
        return;
      }
      required.utility2_initOnce = true;
      /* require */
      required.child_process = required.child_process || require('child_process');
      required.fs = required.fs || require('graceful-fs');
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
      /* require external */
      required.commander = required.commander || require('commander');
      required.istanbul = required.istanbul || require('istanbul');
      required.istanbul_Instrumenter = required.istanbul_Instrumenter
        || new required.istanbul.Instrumenter();
      required.jslint_linter = required.jslint_linter || require('jslint/lib/linter');
      required.jslint_reporter = required.jslint_reporter || require('jslint/lib/reporter');
      required.mime = required.mime || require('mime');
      required.uglifyjs = required.uglifyjs || require('uglify-js');
      try {
        required.sqlite3 = required.sqlite3 || require('sqlite3');
        required.sqlite3_db = new required.sqlite3.cached.Database(':memory:');
      } catch (errorSqlite3) {
        console.log('module not loaded - sqlite3');
      }
      /* exports */
      global.atob = function (text) {
        return new Buffer(text, 'base64').toString();
      };
      global.btoa = function (text) {
        return new Buffer(text).toString('base64');
      };
      /* argv */
      process.argv.forEach(function (arg, ii) {
        switch (arg) {
        case '--server-port':
          EXPORTS.serverPort = process.argv[ii + 1];
          break;
        case '--socks5':
          required.utility2_ajaxsocks5Flag = true;
          break;
        case '--test':
          /* set test server port */
          EXPORTS.serverPort = parseInt('f' + Math.random().toString(16).slice(-3), 16);
          /* set test timeout */
          setTimeout(process.exit, Number(process.argv[ii + 1]) || EXPORTS.timeoutDefault);
          break;
        }
      });
      /* check for code coverage */
      if (!global.__coverage__) {
        Object.keys(global).forEach(function (key) {
          if ((/^\$\$cov_.*\$\$$/).test(key)) {
            global.__coverage__ = global[key];
          }
        });
      }
    },

    ajaxNodejs: function (options, onEventError) {
      /*
        this convenience function automatically concatenates the response stream
        as utf8 text, and passes the concatenated result to the callback
      */
      onEventError = onEventError || EXPORTS.onEventErrorDefault;
      if (typeof options === 'string') {
        options = { url: options };
      }
      var onEventProgress = options.onEventProgress || EXPORTS.nop,
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
      onEventProgress();
      /* socks5 */
      if ((options.socks5 || required.utility2_ajaxsocks5Flag) && options.hostname !== 'localhost'
          && !options.createConnection) {
        local._ajaxSocks5(options, onEventError);
        return;
      }
      ((urlParsed.protocol === 'https:') ? required.https
        : required.http).request(options, function (response) {
        onEventProgress();
        if (options.onEventResponse && options.onEventResponse(response)) {
          return;
        }
        EXPORTS.streamReadOnEventError(response, function (error, data) {
          if (error) {
            onEventError(error);
            return;
          }
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
            if (response.statusCode === 303) {
              options.data = null;
              options.method = 'GET';
            }
            EXPORTS.ajaxNodejs(options, onEventError);
            return;
          case 500:
            onEventError(new Error(data.toString() || response.statusCode));
            return;
          }
          switch (options.dataType) {
          /* try to JSON.parse the response */
          case 'binary':
            break;
          case 'json':
            if (EXPORTS.isError(data = EXPORTS.jsonParseOrError(data))) {
              /* or if parsing fails, pass an error with offending url */
              onEventError(new Error('invalid json data from ' + options.url));
              return;
            }
            break;
          default:
            data = data.toString();
          }
          onEventError(null, data);
        }, onEventProgress);
      }).on('error', onEventError).end(options.data);
      /* debug */
      if (EXPORTS.debug) {
        console.log(['ajaxNodejs', options]);
      }
    },

    _ajaxSocks5: function (options, onEventError) {
      var chunks = new Buffer(0),
        hostname = new Buffer(options.hostname),
        _onEventData,
        _onEventError,
        _onEventTimeout,
        port = Number(options.port || 80),
        socket;
      _onEventError = function (error) {
        onEventError(error);
        socket.destroy();
      };
      socket = required.net.createConnection({ host: 'localhost', port: 1080 });
      _onEventTimeout = setTimeout(_onEventError, EXPORTS.timeoutDefault, new Error('socks5 timeout'));
      socket.on('connect', function () {
        /*jslint bitwise: true*/
        try {
          socket.write(Buffer.concat([new Buffer([5, 1, 0, 5, 1, 0, 3, hostname.length]),
            hostname, new Buffer([port >> 8, port & 0xff])]));
        } catch (error) {
          _onEventError(error);
        }
      }).on('error', _onEventError).on('data', _onEventData = function (chunk) {
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
      });
    },

    _test_ajaxSocks5: function (onEventError) {
      /*
        this function tests ajax requests through socks5
      */
      if (!required.utility2_ajaxsocks5Flag) {
        onEventError('skip');
        return;
      }
      EXPORTS.ajaxNodejs({ url: 'http://www.google.com' }, onEventError);
    },

    fsWatch: function (file) {
      /*
        this function watches a file and performs specified actions if it is modified.
        usage:
        fsWatch({ action: ['jslint', 'eval'], name: 'foo.js' });
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
          var content2 = content.replace(/^#/, '//#');
          /* code coverage instrumentation */
          if (global.__coverage__ && file.name.slice(-3) === '.js') {
            /*jslint stupid: true*/
            content2 = required.istanbul_Instrumenter.instrumentSync(content2, file.name);
          }
          /* perform action */
          (file.action || []).forEach(function (action) {
            switch (action) {
            /* eval the file in global context */
            case 'eval':
              if (mode !== 'noEval') {
                EXPORTS.jsEvalOnEventError(content2, file.name, EXPORTS.onEventErrorDefault);
              }
              break;
            /* jslint file - jslint npm module must be installed */
            case 'jslint':
              EXPORTS.jsLint(file.name, content2);
              break;
            default:
              /* action is a function call */
              action(file.name, content, content2);
            }
          });
          /* perform copy */
          (file.copy || []).forEach(function (file2) {
            EXPORTS.fsWriteFileAtomic(file2, content, {}, EXPORTS.onEventErrorDefault);
          });
          /* perform copyx */
          (file.copyx || []).forEach(function (file2) {
            EXPORTS.fsWriteFileAtomic(file2, content, { mode: '777' },
              EXPORTS.onEventErrorDefault);
          });
        });
      };
      file.name = required.path.resolve(file.name);
      required.utility2_fsWatchDict = required.utility2_fsWatchDict || {};
      file = required.utility2_fsWatchDict[file.name]
        = (required.utility2_fsWatchDict = required.utility2_fsWatchDict || {})[file.name]
          || file2;
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

    jsLint: function (file, script) {
      /* do not lint if code coverage is enabled */
      if (global.__coverage__) {
        return script;
      }
      var ast, lint;
      /* warn unused variables */
      if (file.slice(-3) === '.js' && required.uglifyjs) {
        try {
          ast = required.uglifyjs.parse(script, { filename: file });
          ast.figure_out_scope();
          ast.transform(required.uglifyjs.Compressor());
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

    moduleInitNodejs: function (module, local2, exports) {
      /* imports */
      ['_fileContent', '_fileContentBrowser'].forEach(function (key) {
        local2[key] = exports[key];
      });
      /* main module */
      if (require.main !== module) {
        return;
      }
    },

    _moduleRequireOnce: function (module, local2, exports) {
      if (exports.file) {
        return;
      }
      exports.file = module.filename;
      exports.dir = EXPORTS.fsDirname(exports.file);
      module.exports = exports;
      /* watch module */
      EXPORTS.fsWatch({ action: ['jslint', function (file, content, content2) {
        exports._fileContent = content2;
        exports._fileContentBrowser = global.__coverage__ ? content2
          : (content2 + '\n(function moduleNodejs() {\n}(global));\n')
            .replace((/\n\(function module\w*Nodejs\([\S\s]*/), '').trim();
      }, 'eval'], name: exports.file });
    },

    _serverPort: 6710,

    shell: function (command, mode) {
      /*
        this convenience function provides a quick and dirty way to execute shell commands
      */
      if (mode !== 'silent') {
        console.log(['shell', command]);
      }
      return required.child_process.spawn('/bin/sh', ['-c', command], { stdio: [0, 1, 2] });
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

    jsUglify: function (file, script) {
      /*
        this function uglifies a script
      */
      var ast = required.uglifyjs.parse(script, { filename: file }),
        result = required.uglifyjs.OutputStream();
      /* compress */
      ast.figure_out_scope();
      ast.transform(required.uglifyjs.Compressor());
      /* mangle */
      ast.figure_out_scope();
      ast.compute_char_frequency();
      ast.mangle_names();
      /* output */
      ast.print(result);
      return result.toString();
    },

  };
  local._init();
}(global));



(function moduleFsNodejs(global) {
  /*
    this nodejs module exports filesystem api
  */
  'use strict';
  var EXPORTS = global.EXPORTS = global.EXPORTS || {},
    required = EXPORTS.required = EXPORTS.required || {},
    local;
  local = {

    _name: 'utility2.moduleFsNodejs',

    _init: function () {
      if (!EXPORTS.isNodejs) {
        return;
      }
      /* init module */
      EXPORTS.moduleInit(module, local);
    },

    _initOnce: function () {
      /*jslint stupid: true*/
      /* exports */
      EXPORTS.tmpDir = required.path.resolve(EXPORTS.tmpDir || process.cwd() + '/tmp');
      /* create cache directory */
      try {
        EXPORTS.fsMkdirpSync(required.utility2_cacheDir = EXPORTS.tmpDir + '/cache');
      } catch (error) {
        EXPORTS.onEventErrorDefault(error);
      }
      /* periodically clean up cache directory */
      setInterval(local._cacheCleanup, EXPORTS.timeoutDefault);
      /* remove old coverage reports */
      EXPORTS.fsRmrAtomic(process.cwd() + '/tmp/coverage', EXPORTS.nop);
      /* remove old test reports */
      EXPORTS.fsRmrAtomic(process.cwd() + '/tmp/test', EXPORTS.nop);
    },

    _cacheCleanup: function () {
      /*
        this function cleans up the cache directory
      */
      /* remove files from cache directory */
      (required.utility2_cacheFiles || []).forEach(function (file) {
        local._fsRmr(required.utility2_cacheDir + '/' + file, EXPORTS.onEventErrorDefault);
      });
      /* get list of files to be removed for the next cycle */
      required.fs.readdir(required.utility2_cacheDir, function (error, files) {
        required.utility2_cacheFiles = files;
      });
    },

    cacheWriteStream: function (readable, options, onEventError) {
      /*
        this function writes data from readable stream to a unique cache file
      */
      var cache = required.utility2_cacheDir + '/' + EXPORTS.dateAndSalt();
      options.flag = 'wx';
      /* write stream */
      readable.on('error', onEventError).pipe(
        /* create cache writable stream */
        required.fs.createWriteStream(cache, options).on('close', function () {
          onEventError(null, cache);
        }).on('error', onEventError)
      );
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
      var cache = required.utility2_cacheDir + '/' + EXPORTS.dateAndSalt();
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
      var cache = required.utility2_cacheDir + '/' + EXPORTS.dateAndSalt();
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
      EXPORTS.fsWriteFileAtomic(EXPORTS.tmpDir + '/test/' + EXPORTS.dateAndSalt()
        + '.xml', xml, {}, EXPORTS.onEventErrorDefault);
    },

  };
  local._init();
}(global));



(function moduleReplNodejs(global) {
  /*
    this nodejs module starts up an interactive console debugger
  */
  'use strict';
  var EXPORTS = global.EXPORTS = global.EXPORTS || {},
    required = EXPORTS.required = EXPORTS.required || {},
    local;
  local = {

    _name: 'utility2.moduleReplNodejs',

    _init: function () {
      if (!EXPORTS.isNodejs) {
        return;
      }
      /* init module */
      EXPORTS.moduleInit(module, local);
    },

    _initOnce: function () {
      /* init module */
      EXPORTS.moduleInit(module, local);
      /* start interactive interpreter / debugger */
      if (!required.utility2_repl) {
        required.utility2_repl = required.repl.start({ eval: function (script, context, file,
          onEventError) {
          EXPORTS.jsEvalOnEventError(required.utility2._replParse(script), '', onEventError);
        }, useGlobal: true });
        required.utility2_repl.context.EXPORTS = EXPORTS;
        required.utility2_repl.context.required = required;
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
        EXPORTS.shell('git ' + bb, 'silent');
        return;
      case 'grep':
        EXPORTS.shell('find . -type f | grep -v '
          + '"/\\.\\|.*\\b\\(\\.\\d\\|archive\\|artifacts\\|build\\|coverage\\|docs\\|\\git_modules\\|jquery\\|log\\|logs\\|min\\|node_modules\\|rollup.*\\|swp\\|test\\|tmp\\)\\b" '
          + '| tr "\\n" "\\000" | xargs -0 grep -in ' + JSON.stringify(bb), 'silent');
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
      /* execute /bin/sh commands in console */
      case '$':
        EXPORTS.shell(bb, 'silent');
        return;
      }
      return '(' + script + '\n)';
    },

  };
  local._init();
}(global));



(function moduleRollupNodejs(global) {
  /*
    this nodejs module exports rollup api
  */
  'use strict';
  var EXPORTS = global.EXPORTS = global.EXPORTS || {},
    required = EXPORTS.required = EXPORTS.required || {},
    local;
  local = {

    _name: 'utility2.moduleRollupNodejs',

    _init: function () {
      if (!EXPORTS.isNodejs) {
        return;
      }
      /* init module */
      EXPORTS.moduleInit(module, local);
    },

    cssRollup: function (file, onEventError) {
      EXPORTS.jsRollup(file, function (error) {
        if (error) {
          onEventError(error);
          return;
        }
        local._cssRollup(file, onEventError);
      });
    },

    _cssRollup: function (file, onEventError) {
      required.fs.readFile(file, 'utf8', function (error, content) {
        if (error) {
          onEventError(error);
          return;
        }
        var dict,
          keys,
          remaining = 0;
        try {
          dict = (/\/\* listing start \*\/\n([\S\s]+?\n)\/\* listing end \*\/\n/).exec(content);
          EXPORTS.jsLint('', (/\n\/\* (\{[\S\s]+?\n\}) \*\/\n/).exec(dict[1])[1]);
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
            remaining -= 1;
            content = content.replace(new RegExp(regexp, 'g'), function (_, file) {
              return '\n"data:' + required.mime.lookup(file) + ';base64,'
                + data.toString('base64') + '"\n';
            });
            if (!remaining) {
              remaining = -1;
              EXPORTS.fsWriteFileAtomic(file, content, {}, onEventError);
            }
          };
          remaining += 1;
          EXPORTS.ajaxNodejs({ dataType: 'binary', url: dict[regexp] }, _onEventError);
        });
      });
    },

    jsRollup: function (file, onEventError) {
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
        keys.forEach(function (url) {
          var _onEventError = function (error, data) {
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
            remaining -= 1;
            dict[url] = data.replace((/^\ufeff/), '');
            if (!remaining) {
              remaining = -1;
              keys.forEach(_onEventError);
              EXPORTS.fsWriteFileAtomic(file, content, {}, onEventError);
            }
          };
          if (url.slice(3, 7) === 'http') {
            remaining += 1;
            EXPORTS.ajaxNodejs({ url: url.slice(3, -3) }, _onEventError);
          }
        });
      });
    },

    _test_cssRollup: function (onEventError) {
      var file = EXPORTS.tmpDir + '/test.rollup.css';
      required.fs.exists(file, function (exists) {
        /* skip test */
        if (!exists) {
          onEventError('skip');
          return;
        }
        local.cssRollup(file, onEventError);
      });
    },

    _test_jsRollup: function (onEventError) {
      var file = EXPORTS.tmpDir + '/test.rollup.js';
      required.fs.exists(file, function (exists) {
        /* skip test */
        if (!exists) {
          onEventError('skip');
          return;
        }
        local.jsRollup(file, onEventError);
      });
    },

  };
  local._init();
}(global));



(function moduleServerNodejs(global) {
  /*
    this nodejs module exports filesystem api
  */
  'use strict';
  var EXPORTS = global.EXPORTS = global.EXPORTS || {},
    required = EXPORTS.required = EXPORTS.required || {},
    local;
  local = {

    _name: 'utility2.moduleServerNodejs',

    _init: function () {
      if (!EXPORTS.isNodejs) {
        return;
      }
      /* exports */
      local._routesDict = required.utility2_routesDict
        = required.utility2_routesDict || {};
      /* middleware */
      required.utility2_middleware = required.utility2_middleware
        || local.createMiddleware(required.utility2_routesDict);
      /* init module */
      EXPORTS.moduleInit(module, local);
    },

    createMiddleware: function (routesDict) {
      return function (request, response, next) {
        var path;
        /* debug */
        EXPORTS.request = request;
        EXPORTS.response = response;
        /* security - validate path */
        if (EXPORTS.isError(path = request.urlPathNormalized = request.urlPathNormalized
            || EXPORTS.urlPathNormalizeOrError(request.url))) {
          next(path);
          return;
        }
        /* parse url search params */
        request.urlParsed = request.urlParsed || EXPORTS.urlSearchParse(request.url);
        /* dyanamic path handler */
        for (path = request.urlPathNormalized; path.length > 1; path = EXPORTS.fsDirname(path)) {
          if (routesDict.hasOwnProperty(path)) {
            routesDict[path](request, response, next);
            return;
          }
        }
        /* fallback to next middleware */
        next();
      };
    },

    middlewareOnEventError: function (error, request, response, next) {
      EXPORTS.serverRespondDefault(response, 500, 'plain/text', error, next);
    },

    '_routesDict_/assets/rollup.css': function (request, response, next) {
      EXPORTS.serverRespondFile(response, next,
        required.utility2.dir + '/assets.rollup.css');
    },

    '_routesDict_/assets/rollup.js': function (request, response, next) {
      EXPORTS.serverRespondFile(response, next,
        required.utility2.dir + '/assets.rollup.js');
    },

    '_routesDict_/assets/utility2.js': function (request, response) {
      EXPORTS.serverRespondDefault(response, 200, 'application/javascript',
        required.utility2._fileContentBrowser);
    },

    '_routesDict_/test/test.echo': function (request, response) {
      /*
        this convenience function echoes the request back to the response
      */
      var headers, name;
      response.writeHead(200, { 'content-type': 'text/plain' });
      response.write(request.method + ' ' + request.url + ' http/' + request.httpVersion
        + '\n');
      headers = request.headers;
      for (name in headers) {
        if (headers.hasOwnProperty(name)) {
          response.write(name + ': ' + JSON.stringify(headers[name]) + '\n');
        }
      }
      response.write('\n');
      /* optimization - stream data */
      request.pipe(response);
    },

    '_routesDict_/test/test.html': function (request, response) {
      EXPORTS.serverRespondDefault(response, 200, 'text/html', local._testHtml);
    },

    '_routesDict_/test/test.upload': function (request, response, next) {
      EXPORTS.streamReadOnEventError(request, function (error, data) {
        if (error || EXPORTS.isError(error = EXPORTS.jsonParseOrError(data))) {
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

    '_routesDict_/test/test.timestamp': function (request, response) {
      response.end(EXPORTS.timestamp);
    },

    coverageReport: function (coverage) {
      if (!(global.__coverage__ && required.istanbul && required.utility2_coverageDir)
          || required.utility2_coverageReportLock) {
        return;
      }
      required.utility2_coverageReportLock = setTimeout(function () {
        console.log('writing coverage report to ' + required.utility2_coverageDir);
        required.utility2_coverageReportLock = null;
        required.istanbul_Collector.add(global.__coverage__);
        if (coverage) {
          required.istanbul_Collector.add(coverage);
        }
        ['json', 'lcov'].forEach(function (reportType) {
          required.istanbul.Report.create(reportType, { dir: required.utility2_coverageDir })
            .writeReport(required.istanbul_Collector);
        });
      }, 1000);
    },

    serverRespondDefault: function (response, statusCode, contentType, data) {
      /*
        this convenience function give an appropriate response for a given status code
      */
      if (!response._header) {
        response.writeHead(statusCode, { 'content-type': contentType });
      }
      data = data || statusCode + ' '
        + (required.http.STATUS_CODES[statusCode] || 'Unknown Status Code');
      switch (statusCode.toString()) {
      /* error */
      case '500':
        console.error(data = data.stack || data);
        break;
      }
      response.end(data);
    },

    serverRespondFile: function (response, next, file) {
      response.setHeader('content-type', required.mime.lookup(file));
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

    serverStart: function () {
      if (!EXPORTS.serverPort) {
        return;
      }
      EXPORTS.server = EXPORTS.server || required.express()
        .use(required.express.logger('dev'))
        .use(required.utility2_middleware)
        .use(EXPORTS.middlewareOnEventError);
      required.utility2_serverListen = required.utility2_serverListen = EXPORTS.ajaxNodejs({
        url: 'http://localhost:' + EXPORTS.serverPort
      }, function (error) {
        if (!(error && error.code === 'ECONNREFUSED')) {
          EXPORTS.serverResume(error || new Error('server port ' + EXPORTS.serverPort
            + ' not available'));
          return;
        }
        EXPORTS.server.listen(EXPORTS.serverPort, function () {
          console.log('server started on port ' + EXPORTS.serverPort);
          EXPORTS.serverResume('resume');
        });
      });

    },

    _testHtml: '<!DOCTYPE html><html><head>\n'
      + [
        '/assets/rollup.css'
      ].map(function (url) {
        return '<link href="' + url + '" rel="stylesheet" />\n';
      }).join('')

      + '<style>\n'
      + '</style></head><body>\n'

      + [
        '/assets/rollup.js',
        '/assets/utility2.js',
      ].map(function (url) {
        return '<script src="' + url + '"></script>\n';
      }).join('')
      + '</body></html>\n',

  };
  local._init();
}(global));



(function moduleAdminNodejs(global) {
  /*
    this admin module exports admin api
  */
  'use strict';
  var EXPORTS = global.EXPORTS = global.EXPORTS || {},
    required = EXPORTS.required = EXPORTS.required || {},
    local;
  local = {

    _name: 'utility2.moduleAdminNodejs',

    _init: function () {
      if (!EXPORTS.isNodejs) {
        return;
      }
      /* init module */
      EXPORTS.moduleInit(module, local);
      /* jslint */
      EXPORTS.jsLint('admin.html', local._adminHtml);
    },

    _adminHtml: '<!DOCTYPE html><html><head>\n'
      + '<link href="/assets/rollup.css" rel="stylesheet"/>\n'
      + '<style>\n'
      + '</style></head><body>\n'
      + '<input id="inputAdminUpload" type="file"/>\n'
      + '<script src="/assets/rollup.js"></script>\n'
      + '<script src="/assets/utility2.js"></script>\n'
      + '<script>\n'
      + '/*jslint browser: true, indent: 2*/\n'
      + '</script>\n'
      + '</body></html>',

    _ajaxAdminDebug: function (script, onEventError) {
      EXPORTS.ajaxLocal({ data: script, url: '/admin/admin.debug' }, onEventError);
    },

    _ajaxAdminShell: function (script, onEventError) {
      EXPORTS.ajaxLocal({ data: script, url: '/admin/admin.shell' }, onEventError);
    },

    '_routesDict_/admin/admin.debug': function (request, response, next) {
      EXPORTS.cacheWriteStream(request, {}, function (error, tmp) {
        if (error) {
          next(error);
          return;
        }
        required.fs.readFile(tmp, function (error, data) {
          if (error) {
            next(error);
            return;
          }
          EXPORTS.jsEvalOnEventError(data, tmp, function (error, data) {
            if (error) {
              next(error);
              return;
            }
            if (EXPORTS.isError(data = EXPORTS.jsonStringifyOrError(data))) {
              next(data);
              return;
            }
            response.end(data);
          });
        });
      });
    },

    '_routesDict_/admin/admin.html': function (request, response) {
      EXPORTS.serverRespondDefault(response, 200, 'text/html', local._adminHtml);
    },

    '_routesDict_/admin/admin.shell': function (request, response, next) {
      EXPORTS.cacheWriteStream(request, {}, function (error, tmp) {
        if (error) {
          next(error);
          return;
        }
        var _onEventData, proc;
        _onEventData = function (chunk) {
          process.stdout.write(chunk);
          response.write(chunk);
        };
        proc = required.child_process.spawn('/bin/sh', [tmp])
          .on('close', function (exitCode) {
            response.end('exit code: ' + exitCode);
          }).on('error', next);
        proc.stderr.on('data', _onEventData);
        proc.stdout.on('data', _onEventData);
      });
    },

    '_routesDict_/admin/admin.upload': function (request, response, next) {
      EXPORTS.cacheWriteStream(request, {}, function (error, tmp) {
        if (error) {
          next(error);
          return;
        }
        EXPORTS.fsRename(tmp, EXPORTS.tmpDir + '/upload/' + request.headers['upload-filename']
          || '', function (error) {
            if (error) {
              next(error);
              return;
            }
            response.end();
          });
      });
    },

  };
  local._init();
}(global));



(function moduleDbNodejs() {
  /*
    this nodejs module implements an asynchronous, b-tree, records / fields data store
  */
  'use strict';
  var EXPORTS = global.EXPORTS = global.EXPORTS || {},
    required = EXPORTS.required = EXPORTS.required || {},
    local;
  local = {

    _name: 'utility2.moduleDbNodejs',

    _init: function () {
      if (EXPORTS.isBrowser) {
        return;
      }
      /* init module */
      EXPORTS.moduleInit(module, local);
      /* exports */
      EXPORTS.dbDir = EXPORTS.dbDir || EXPORTS.tmpDir + '/db/tables';
      EXPORTS.dbTables = EXPORTS.dbTables || {};
      /* read all current databases */
      required.fs.readdir(EXPORTS.dbDir, function (error, files) {
        (files || []).forEach(local._dbTable);
      });
      local._dirMaxDepth = 4;
    },

    _test_db: function (onEventError) {
      EXPORTS.serverResume(function (error) {
        if (error) {
          onEventError('skip');
          return;
        }
        var self = EXPORTS.createDb('table test ' + EXPORTS.dateAndSalt()), sorted;
        self.dirMaxFiles = 16;
        EXPORTS.ioChain(function (state, data, onEventError) {
          var _state = -1;
          if ((_state += 1) === state) {
            self.tableDelete(onEventError);
            return;
          }
          /* test tableOptionsUpdateAndGet */
          if ((_state += 1) === state) {
            self.tableOptionsUpdateAndGet(null, onEventError);
            return;
          }
          if ((_state += 1) === state) {
            if (JSON.parse(data).dirMaxFiles !== 1024) {
              onEventError(new Error('test failed - tableOptionsUpdateAndGet'));
            } else {
              onEventError();
            }
            return;
          }
          if ((_state += 1) === state) {
            self.tableOptionsUpdateAndGet({ 'dirMaxFiles': 16 }, onEventError);
            return;
          }
          if ((_state += 1) === state) {
            if (JSON.parse(data).dirMaxFiles !== 16) {
              onEventError(new Error('test failed - tableOptionsUpdateAndGet'));
            } else {
              onEventError();
            }
            return;
          }
          /* test tableUpdateRandom */
          if ((_state += 1) === state) {
            self.tableUpdateRandom(64, onEventError);
            return;
          }
          /* test tableScanForward */
          if ((_state += 1) === state) {
            self.tableScanForward('record ', 0, onEventError);
            return;
          }
          if ((_state += 1) === state) {
            if (JSON.parse(data).length !== 64) {
              onEventError(new Error('test failed - tableUpdateRandom'));
            } else if ((sorted = JSON.stringify(JSON.parse(data).sort())) !== data) {
              onEventError(new Error('test failed - tableScanForward'));
            } else {
              onEventError();
            }
            return;
          }
          /* test tableScanBackward */
          if ((_state += 1) === state) {
            self.tableScanBackward('record z', 0, onEventError);
            return;
          }
          if ((_state += 1) === state) {
            if (JSON.stringify(JSON.parse(data).reverse()) !== sorted) {
              onEventError(new Error('test failed - tableScanBackward'));
            } else {
              onEventError();
            }
            return;
          }
          /* test fieldAppend */
          if ((_state += 1) === state) {
            self.fieldAppend('record fieldAppend', 'fieldAppend', '1', onEventError);
            return;
          }
          // if ((_state += 1) === state) {
            // if (JSON.stringify(JSON.parse(data).reverse()) !== sorted) {
              // onEventError(new Error('test failed - tableScanBackward'));
            // } else {
              // onEventError();
            // }
            // return;
          // }
          /* finish testing */
          onEventError('finish');
        }, function (error) {
          self.tableDelete(function (_error) {
            onEventError(error || _error);
          });
        });
      });
    },

    _dbTable: function (name) {
      /*
        this function creates a database with the given name
      */
      return (EXPORTS.dbTables[name] = EXPORTS.dbTables[name] || {
        dir: EXPORTS.dbDir + '/' + encodeURIComponent(name),
        /* the default dirMaxFiles allows a table to reasonably handle one quadrillion records,
           assuming adequate disk space */
        dirMaxFiles: 1024,
        marked: {},
        actionLock: 0,
        actionResume: EXPORTS.onEventResume('resume'),
      });
    },

    _dbAction: function (self, options, onEventError) {
      /* validate action */
      if (!local._dbActionDict[options.action]) {
        onEventError(new Error('unknown action ' + [options.action]));
        return;
      }
      switch ((/[a-z]+/).exec(options.action)[0]) {
      /* validate field */
      case 'field':
        if (!options.field) {
          onEventError(new Error('invalid field'));
          return;
        }
        break;
      /* validate record */
      case 'record':
        if (!options.record) {
          onEventError(new Error('invalid record'));
          return;
        }
        break;
      }
      /* validate data type */
      if (options.json && typeof options.json !== 'object') {
        switch (options.action) {
        case 'fieldAppend':
          break;
        default:
          onEventError(new Error('invalid data type ' + [typeof options.json]));
          return;
        }
      }
      /* empty options.json */
      switch (options.action) {
      case 'fieldAppend':
        if (options.json === undefined) {
          onEventError();
          return;
        }
        break;
      case 'recordUpdate':
      case 'recordsDelete':
      case 'tableUpdate':
        if (EXPORTS.dictIsEmpty(options.json)) {
          onEventError();
          return;
        }
        break;
      case 'recordsGet':
        if (EXPORTS.dictIsEmpty(options.json)) {
          options.onEventData('{}');
          onEventError();
          return;
        }
        break;
      }
      /* perform io */
      options.parents = [{ dir: self.dir }];
      self.actionLock += 1;
      var mode, _onEventError = function (error) {
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
        local._dbActionDict[options.action](self, options, _onEventError);
        return;
      case 'tableScanForward':
        if (options.mode === 'backward' && !options.record) {
          mode = 'backward';
        }
        break;
      }
      /* optimization - cached directory */
      if (options.dir) {
        local._dbActionDict[options.action](self, options, _onEventError);
        return;
      }
      local._dirWithRecord(self, options, mode, function (error) {
        if (error) {
          _onEventError(error);
          return;
        }
        options.dir = options.parents[0].dir + '/' + encodeURIComponent(options.record);
        local._dbActionDict[options.action](self, options, _onEventError);
      });

    },

    _dbActionDict: {},

    _dbActionDict_fieldAppend: function (self, options, onEventError) {
      EXPORTS.fsAppendFile(options.dir + '/' + encodeURIComponent(options.field),
        ',' + encodeURIComponent(JSON.stringify(options.JSON)), onEventError);
    },

    _dbActionDict_fieldDelete: function (self, options, onEventError) {
      EXPORTS.fsRmrAtomic(options.dir + '/' + encodeURIComponent(options.field), onEventError);
    },

    _dbActionDict_fieldGet: function (self, options, onEventError) {
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
          data = '[' + decodeURIComponent(data.slice(1)) + ']';
        }
        if (EXPORTS.isError(EXPORTS.jsonParseOrError(data))) {
          local._onEventErrorCorruptFile(file, onEventError);
          return;
        }
        options.onEventData(data);
        onEventError(null);
      });
    },

    _dbActionDict_fileDownload: function (self, options, onEventError) {
      required.fs.createReadStream(options.dir + '/file').on('data', options.onEventData)
        .on('end', onEventError).on('error', onEventError);
    },

    _dbActionDict_fileUpload: function (self, options, onEventError) {
      EXPORTS.fsRename(options.tmp, options.dir + '/file', onEventError);
    },

    _dbActionDict_recordDelete: function (self, options, onEventError) {
      EXPORTS.fsRmrAtomic(options.dir, local._dbOnEventError2(self, options, onEventError));
    },

    _dbActionDict_recordDeleteAndUpdate: function (self, options, onEventError) {
      options.action = 'recordDelete';
      options.action2 = 'recordUpdate';
      local._dbAction(self, options, onEventError);
    },

    _dbActionDict_recordGet: function (self, options, onEventError) {
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

    _dbActionDict_recordUpdate: function (self, options, onEventError) {
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
            JSON.stringify(options.json[field]), {}, _onEventError);
        });
      });
    },

    _dbActionDict_recordsDelete: function (self, options, onEventError) {
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

    _dbActionDict_recordsDeleteAndUpdate: function (self, options, onEventError) {
      options.action = 'recordsDelete';
      options.action2 = 'recordsUpdate';
      local._dbAction(self, options, onEventError);
    },

    _dbActionDict_recordsGet: function (self, options, onEventError) {
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

    _dbActionDict_recordsUpdate: function (self, options, onEventError) {
      options.action = 'recordsUpdate';
      local._dbAction(self, options, onEventError);
    },

    _dbActionDict_tableDelete: function (self, options, onEventError) {
      EXPORTS.fsRmrAtomic(self.dir, local._dbOnEventError2(self, options, onEventError));
    },

    _dbActionDict_tableDeleteAndUpdate: function (self, options, onEventError) {
      options.action = 'tableDelete';
      options.action2 = 'tableUpdate';
      local._dbAction(self, options, onEventError);
    },

    _dbActionDict_tableOptionsUpdateAndGet: function (self, options, onEventError) {
      /* update table options */
      Object.keys(options.json || {}).forEach(function (key) {
        self[key] = options.json[key];
      });
      /* get table options */
      var data;
      if (EXPORTS.isError(data = EXPORTS.jsonStringifyOrError(self))) {
        onEventError(data);
        return;
      }
      options.onEventData(data);
      onEventError();
    },

    _dbActionDict_tableScanBackward: function (self, options, onEventError) {
      options.action = 'tableScanForward';
      options.mode = 'backward';
      local._dbAction(self, options, onEventError);
    },

    _dbActionDict_tableScanForward: function (self, options, onEventError) {
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

    _dbActionDict_tableUpdate: function (self, options, onEventError) {
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

    _dirNext: function (self, options, mode, onEventError) {
      var parent = options.parents[0];
      if ((mode === 'backward' && (parent.ii -= 1) >= 0)
          || (mode !== 'backward' && (parent.ii += 1) < parent.files.length)) {
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
      return dir.slice(EXPORTS.dbDir.length).split('/').length - 2;
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
      if (EXPORTS.debug) {
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
          var dir2, _join = function (error, dirs) {
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
            var parent = EXPORTS.fsDirname(dir),
              index = dirs.indexOf(dir.slice(parent.length + 1)) - 1,
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
            if (EXPORTS.debug) {
              console.log([ 'db rebalance split', self.rebalanceDepth, dir ]);
            }
            /*jslint bitwise: true*/
            files = files.slice(files.length >> 1);
            dir2 = EXPORTS.fsDirname(dir) + '/' + files[0];
            /* recurse */
            if (files.length > self.dirMaxFiles) {
              self.marked[dir2] = true;
            }
            local._dirTransfer(dir, dir2, files, _onEventError);
          /* join directory with previous directory */
          } else if (4 * files.length < self.dirMaxFiles) {
            if (EXPORTS.debug) {
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
        new Date().getTime().toString().slice(0, -3), {}, onEventError);
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

    '_routesDict_/db/db.html': function (request, response) {
      response.setHeader('content-type', 'text/html');
      response.end(local._dbHtml);
    },

    '_routesDict_/db/db.ajax': function (request, response, next) {
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
        EXPORTS.cacheWriteStream(request, {}, function (error, tmp) {
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
          if (EXPORTS.isError(options.json = EXPORTS.jsonParseOrError(data))) {
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

    _dbHtml: '<!DOCTYPE html><html><head>\n'
      + [
        '/assets/rollup.css'
      ].map(function (url) {
        return '<link href="' + url + '" rel="stylesheet" />\n';
      }).join('')

      + '<style>\n'
      + '</style></head><body>\n'

      + [
        '/assets/rollup.js',
        '/assets/utility2.js',
      ].map(function (url) {
        return '<script src="' + url + '"></script>\n';
      }).join('')
      + '</body></html>\n',

  };
  local._init();
}(global));



(function modulePhantomjsShared(global) {
  /*
    this nodejs / phantomjs module runs a phantomjs server
  */
  'use strict';
  var EXPORTS = global.EXPORTS = global.EXPORTS || {},
    required = EXPORTS.required = EXPORTS.required || {},
    local;
  local = {

    _name: 'utility2.modulePhantomjsShared',

    _init: function () {
      if (!(EXPORTS.isNodejs || EXPORTS.isPhantomjs)) {
        return;
      }
      /* init module */
      EXPORTS.moduleInit(module, local);
    },

    _initOnce: function () {
      /* nodejs */
      if (EXPORTS.isNodejs) {
        EXPORTS.phantomjsResume = EXPORTS.phantomjsResume || EXPORTS.onEventResume('pause');
        required.utility2_phantomjsPort
          = parseInt('f' + Math.random().toString(16).slice(-3), 16);
        EXPORTS.serverResume(function (error) {
          if (error) {
            EXPORTS.phantomjsResume(error);
            return;
          }
          var interval = setInterval(function () {
            local._phantomjsTest('/test/timeout', function (error) {
              if (error) {
                return;
              }
              EXPORTS.phantomjsResume('resume');
              clearInterval(interval);
            }, 1000);
          });
          /* spawn phantomjs process */
          EXPORTS.shell('phantomjs ' + required.utility2.file + ' '
            + EXPORTS.serverPort + ' ' + required.utility2_phantomjsPort)
            .on('close', function (exitCode) {
              EXPORTS.phantomjsResume(new Error(exitCode));
              clearInterval(interval);
            });
        });
      /* phantomjs */
      } else if (EXPORTS.isPhantomjs) {
        /* require */
        required.webpage = require('webpage');
        required.webserver = require('webserver');
        required.system = require('system');
        /* phantomjs server */
        required.webserver.create().listen(required.system.args[2], function (request,
          response) {
          response.write('200');
          response.close();
          try {
            var page = required.webpage.create(), url = request.post;
            page.onConsoleMessage = console.log;
            page.open(url, function (status) {
              console.log('phantomjs open -', status, '-', url);
            });
            /* page timeout */
            setTimeout(function () {
              page.close();
            }, EXPORTS.timeoutDefault);
          } catch (error) {
            EXPORTS.onEventErrorDefault(error);
          }
        });
        console.log('phantomjs server started on port ' + required.system.args[1]);
      }
    },

    phantomjsTest: function (url, onEventError) {
      EXPORTS.phantomjsResume(function (error) {
        if (error) {
          onEventError(error);
          return;
        }
        local._phantomjsTest(url, onEventError);
      });
    },

    _phantomjsTest: function (url, onEventError) {
      if (url.slice(0, 4) !== 'http') {
        url = 'http://localhost:' + EXPORTS.serverPort + url;
      }
      url = EXPORTS.urlSearchSetItem(url, 'testOnce', '1', '#');
      EXPORTS.ajaxNodejs({
        data: url,
        headers: { 'Content-Length': Buffer.byteLength(url) },
        method: 'POST',
        url: 'http://localhost:' + required.utility2_phantomjsPort
      }, onEventError);
    },

    _test_phantomjsTest: function (onEventError) {
      EXPORTS.phantomjsResume(function (error) {
        if (error) {
          onEventError('skip');
          return;
        }
        EXPORTS.phantomjsTest("/test/test.html", onEventError);
      });
    },

  };
  local._init();
}(global));
