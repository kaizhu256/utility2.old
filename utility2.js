#!/usr/bin/env node
/*
utility2.js
common, shared utilities for both browser and nodejs
https://git.corp.yahoo.com/gist/2230

todo:
revert to phantomjs server for efficiency
add password protection for admin module
migrate argv processing to commander
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
      /* nodejs */
      } else {
        EXPORTS.serverReady.onEventReady(function () {
          options.url = 'http://localhost:' + EXPORTS.serverPort + options.url;
          EXPORTS.ajaxNodejs(options, onEventError);
        });
      }
    },

    _test_ajaxLocal: function (onEventError) {
      EXPORTS.ajaxLocal({ url: '/test.echo' }, onEventError);
    },

    base64Decode: function (text) {
      return global.atob(text.replace((/-/g), '+').replace((/_/g), '/'));
    },

    base64Encode: function (text) {
      return global.btoa(text).replace((/\+/g), '-').replace((/\//g), '_')
        .replace((/\=+/g), '');
    },

    createDeferred: function () {
      var self = new local._Deferred();
      self._queue = [];
      self._ready = false;
      return self;
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

    _Deferred: function () {
    },

    _Deferred_prototype_onEventReady: function (callback) {
      if (this._ready) {
        callback();
        return;
      }
      this._queue.push(callback);
    },

    _Deferred_prototype_ready: function () {
      this._ready = true;
      this._queue.forEach(function (callback) {
        callback();
      });
      this._queue.length = 0;
    },

    _test_Deferred: function (onEventError) {
      var self = EXPORTS.createDeferred(), tmp = 0;
      self.onEventReady(function () {
        try {
          console.assert(tmp === 1);
          onEventError();
        } catch (error) {
          onEventError(error);
        }
      });
      setTimeout(function () {
        tmp += 1;
        self.ready();
      }, 1);
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
        function (data, onEventError)
      */
      onEventError = onEventError || EXPORTS.onEventErrorDefault;
      var next = 0, _onEventError = function (error, data) {
        next += 1;
        if (error) {
          /* debug */
          EXPORTS.error = error;
          onEventError(error, next);
          return;
        }
        if (next < chain.length) {
          chain[next](data, _onEventError);
          return;
        }
        if (next === chain.length) {
          onEventError(null, data);
        }
      };
      chain[next](null, _onEventError);
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
        data = EXPORTS.isBrowser ? eval(script) : required.vm.runInThisContext(script, file);
      } catch (error) {
        /* debug */
        EXPORTS.error = error;
        console.error(file);
        onEventError(error);
        return;
      }
      onEventError(null, data);
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
      /* exports */
      console.assert(local2._name, [local2._name]);
      var name = local2._name.split('.'),
        exports = EXPORTS.required[name[0]] = EXPORTS.required[name[0]] || {};
      /* nodejs middleware routes */
      if (!EXPORTS.isBrowser) {
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
        if (error.message === '') {
          throw error;
        }
        return;
      }
      if (data === undefined) {
        return;
      }
      console.log((global.Buffer && global.Buffer.isBuffer(data)) ? data.toString() : data);
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
      try {
        console.assert(EXPORTS.templateFormat('{{aa}}', { aa: 1 }) === '{{aa}}');
        console.assert(EXPORTS.templateFormat('{{aa}}', { aa: 'bb' }) === 'bb');
        onEventError();
      } catch (error) {
        onEventError(error);
      }
    },

    testLocal: function (module, local2) {
      /* browser-side testing */
      if (EXPORTS.isBrowser && !EXPORTS.isBrowserTest) {
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
                local2._name + '.' + test.name + '\n');
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
          if (testSuite.testCases.hasOwnProperty[test]) {
            test = testSuite.testCases[test];
            /* test timeout */
            if (!test.finished) {
              test.finished = true;
              test.time = new Date().getTime() - test.time;
              testSuite.failures += 1;
              testSuite.tests += 1;
              EXPORTS.onEventErrorDefault(new Error(test.failure = 'test timeout'));
            }
            testSuite.time += test.time;
            return;
          }
          /* queue test */
          if (!remaining) {
            required.utility2_testCounter = required.utility2_testCounter || 0;
            required.utility2_testCounter += 1;
          }
          remaining += 1;
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
          url: '/test.report.upload'
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
      try {
        console.assert(EXPORTS.urlSearchGetItem('/aa#bb=cc%2B', 'bb', '#') === 'cc+');
        console.assert(EXPORTS.urlSearchSetItem('/aa', 'bb', 'cc+', '#') === '/aa#bb=cc%2B');
        onEventError();
      } catch (error) {
        onEventError(error);
      }
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
      $(document.body)
        .on('click', '.modal [data-dismiss="modal"]', local._onEventModalHide);
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



(function moduleTestBrowser(global) {
  /*
    this browser module exports test api
  */
  'use strict';
  var EXPORTS = global.EXPORTS = global.EXPORTS || {},
    $ = global.jQuery,
    local;
  local = {

    _name: 'utility2.moduleTestBrowser',

    _init: function () {
      if (!EXPORTS.isBrowser) {
        return;
      }
      /* init module */
      EXPORTS.moduleInit(module, local);
    },

    _initOnce: function () {
      /* reload page if server code is modified */
      if (EXPORTS.isBrowserTest === 'watch') {
        setInterval(function () {
          $.ajax({ url: '/test.timestamp' }).done(function (timestamp) {
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
      onEventError = onEventError || EXPORTS.onEventErrorDefault;
      EXPORTS.ajaxProgress(options).done(function (data) {
        onEventError(null, data);
      }).fail(function (xhr, textStatus, errorMessage) {
        onEventError(new Error(xhr.status + ' ' + textStatus + ' - ' + options.url + '\n'
          + (xhr.responseText || errorMessage)));
      });
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
      required.fs = required.fs || require('fs');
      required.http = required.http || require('http');
      required.https = required.https || require('https');
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
      EXPORTS.serverReady = EXPORTS.serverReady || EXPORTS.createDeferred();
      global.atob = function (text) {
        return new Buffer(text, 'base64').toString();
      };
      global.btoa = function (text) {
        return new Buffer(text).toString('base64');
      };
      /* argv */
      // debug
      required.utility2_testPhantomjsFlag = true;
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
          /* enable phantomjs testing */
          required.utility2_testPhantomjsFlag = true;
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
      /* optimization - disable socket pooling */
      options.agent = false;
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
        /* http redirect */
        switch (response.statusCode) {
        case 300:
        case 301:
        case 302:
        case 303:
        case 307:
          options.redirected = options.redirected || 0;
          options.redirected += 1;
          if (options.redirected >= 8) {
            onEventError(new Error('too many http redirects - '
              + response.headers.location));
            return;
          }
          options.url = response.headers.location;
          EXPORTS.ajaxNodejs(options, onEventError);
          return;
        }
        EXPORTS.streamReadOnEventError(response, function (error, data) {
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
      /* start server */
      if (local2._serverPort) {
        EXPORTS.serverPort = EXPORTS.serverPort || local2._serverPort;
        EXPORTS.server = EXPORTS.server || required.http.createServer(function (request,
          response) {
          required.utility2_middleware(request, response,
            EXPORTS.middlewareOnEventErrorDefault);
        }).on('error', EXPORTS.onEventErrorDefault).listen(EXPORTS.serverPort, function () {
          console.log('server started on port ' + EXPORTS.serverPort);
          EXPORTS.serverReady.ready();
        });
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
      required.child_process.spawn('/bin/sh', ['-c', command], { stdio: [0, 1, 2] });
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
      EXPORTS.fsMkdirpSync(required.utility2_cacheDir = EXPORTS.tmpDir + '/cache');
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
        this function renames a file, auto-creating missing directories
      */
      required.fs.rename(file1, file2, function (error) {
        /* default behavior */
        if (error) {
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
          onEventError(error);
          return;
        }
        onEventError();
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
        by first writing to a unique cache file, and then renaming it
      */
      var cache = required.utility2_cacheDir + '/' + EXPORTS.dateAndSalt();
      options.flag = 'wx';
      /* write data */
      required.fs.writeFile(cache, data, options, function (error) {
        if (error) {
          onEventError(error);
          return;
        }
        EXPORTS.fsRename(cache, file, onEventError);
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

    middlewareOnEventErrorDefault: function (error, request, response) {
      EXPORTS.serverRespondDefault0(request, response, error ? 500 : 404, error);
    },

    '_routesDict_/assets.rollup2.css': function (request, response, next) {
      local._serverRespondAssets(request, response, next);
    },

    '_routesDict_/assets.rollup2.js': function (request, response, next) {
      local._serverRespondAssets(request, response, next);
    },

    '_routesDict_/assets.test.utility2.html': function (request, response) {
      response.setHeader('content-type', 'text/html');
      response.end(local._serverTestHtml);
    },

    '_routesDict_/assets/utility2.js': function (request, response) {
      response.setHeader('content-type', 'application/javascript');
      response.end(required.utility2._fileContentBrowser);
    },

    '_routesDict_/test.report.upload': function (request, response, next) {
      local._serverRespondTestReportUpload(request, response, next);
    },

    '_routesDict_/test.echo': function (request, response) {
      EXPORTS.serverRespondEcho(request, response);
    },

    '_routesDict_/test.timestamp': function (request, response) {
      response.end(EXPORTS.timestamp);
    },

    _serverRespondAssets: function (request, response, next) {
      required.fs.createReadStream(required.utility2.dir + request.urlPathNormalized)
        .on('error', next).pipe(response);
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

    _serverRespondTestReportUpload: function (request, response, next) {
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

    serverRespondDefault0: function (request, response, statusCode, message) {
      /*
        this convenience function give an appropriate response for a given status code
      */
      if (!response._header) {
        response.writeHead(statusCode, { 'content-type': 'text/plain' });
      }
      message = message || statusCode + ' '
        + (required.http.STATUS_CODES[statusCode] || 'Unknown Status Code');
      switch (String(statusCode)) {
      /* error */
      case '500':
        console.error(message = message.stack || message);
        break;
      }
      response.end(String(message));
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
      switch (String(statusCode)) {
      /* error */
      case '500':
        console.error(data = data.stack || data);
        break;
      }
      response.end(data);
    },

    serverRespondEcho: function (request, response) {
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

    _serverTestHtml: '<!DOCTYPE html><html><head>\n'
      + [
        '/assets.rollup2.css'
      ].map(function (url) {
        return '<link href="' + url + '" rel="stylesheet" />\n';
      }).join('')

      + '<style>\n'
      + '</style></head><body>\n'

      + [
        '/assets.rollup2.js',
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
    },

    _initOnce: function () {
      EXPORTS.adminMiddleware = EXPORTS.createMiddleware({
        '/admin/admin.html': local._serverRespondAdminHtml,
        '/admin/debug': local._serverRespondAdminDebug,
        '/admin/shell': local._serverRespondAdminShell
      });
    },

    _adminHtml: EXPORTS.jsLint('admin.html', '<!DOCTYPE html><html><body>\n'
      + '<script src="/assets.rollup2.js"></script>\n'
      + '<script src="/assets/utility2.js"></script>\n'
      + '<script>\n'
      + '/*jslint browser: true, indent: 2*/\n'
      + '"use strict";\n'
      + 'window.EXPORTS.ajaxAdminDebug = function (script, onEventError) {\n'
      + '  window.EXPORTS.ajaxLocal({ data: script, url: "/admin/debug" }, onEventError);\n'
      + '};\n'
      + 'window.EXPORTS.ajaxAdminShell = function (script, onEventError) {\n'
      + '  window.EXPORTS.ajaxLocal({ data: script, url: "/admin/shell" }, onEventError);\n'
      + '};\n'
      + '</script>\n'
      + '</body></html>'
      ),

    _ajaxAdminDebug: function (script, onEventError) {
      EXPORTS.ajaxLocal({ data: script, url: '/admin/debug' }, onEventError);
    },

    _ajaxAdminShell: function (script, onEventError) {
      EXPORTS.ajaxLocal({ data: script, url: '/admin/shell' }, onEventError);
    },

    _serverRespondAdminDebug: function (request, response, next) {
      var _onEventError = function (error, data) {
        if (error) {
          next(error);
          return;
        }
        if (EXPORTS.isError(data = EXPORTS.jsonStringifyOrError(data))) {
          _onEventError(data);
          return;
        }
        response.end(data);
      };
      EXPORTS.cacheWriteStream(request, {}, function (error, tmp) {
        if (error) {
          _onEventError(error);
          return;
        }
        required.fs.readFile(tmp, function (error, data) {
          if (error) {
            _onEventError(error);
            return;
          }
          EXPORTS.jsEvalOnEventError(data, tmp, _onEventError);
        });
      });
    },

    _serverRespondAdminHtml: function (request, response) {
      EXPORTS.serverRespondDefault(response, 200, 'text/html', local._adminHtml);
    },

    _serverRespondAdminShell: function (request, response, next) {
      var _onEventError = function (error) {
        if (EXPORTS.isError(error)) {
          next(error);
          return;
        }
        response.end('error code: ' + error);
      };
      EXPORTS.cacheWriteStream(request, {}, function (error, tmp) {
        if (error) {
          _onEventError(error);
          return;
        }
        var _onEventData, proc;
        _onEventData = function (chunk) {
          process.stdout.write(chunk);
          response.write(chunk);
        };
        proc = required.child_process.spawn('/bin/sh', [tmp])
          .on('close', _onEventError).on('error', _onEventError);
        proc.stderr.on('data', _onEventData);
        proc.stdout.on('data', _onEventData);
      });
    },

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
      if (!EXPORTS.isNodejs || !EXPORTS.isPhantomjs) {
        return;
      }
      /* init module */
      EXPORTS.moduleInit(module, local);
    },

    _initOnce: function () {
      /* phantomjs */
      if (!EXPORTS.isPhantomjs) {
        return;
      }
      /* set timeout */
      setTimeout(global.phantom.exit, EXPORTS.timeoutDefault);
      /* require */
      required.webpage = require('webpage');
      required.system = require('system');
      var page = required.webpage.create(), url = required.system.args[1];
      page.onConsoleMessage = console.log;
      page.open(url, function (status) {
        console.log('phantomjs open -', status, '-', url);
      });
    },

    phantomjsTest: function (url, onEventError) {
      if (!required.utility2_testPhantomjsFlag) {
        onEventError();
        return;
      }
      EXPORTS.serverReady.onEventReady(function () {
        try {
          if (url.slice(0, 4) !== 'http') {
            url = 'http://localhost:' + (EXPORTS.serverPort || 80) + url;
          }
          url = JSON.stringify(EXPORTS.urlSearchSetItem(url, 'testOnce', '1', '#'));
          /* spawn phantomjs process */
          EXPORTS.shell('phantomjs ' + required.utility2.file + ' ' + url);
          onEventError();
        } catch (error) {
          onEventError(error);
        }
      });
    },

    _test_phantomjsTest: function (onEventError) {
      if (!required.utility2_testPhantomjsFlag) {
        onEventError('skip');
        return;
      }
      EXPORTS.phantomjsTest("/assets.test.utility2.html", onEventError);
    },

  };
  local._init();
}(global));
