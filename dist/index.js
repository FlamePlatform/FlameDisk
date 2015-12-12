'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.criteriaMaker = criteriaMaker;

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var mkdirp = require("mkdirp");
var waitable = require('waitable');
var path = require('path');
var fs = require('fs');
var mongoid = require('mongoid');
var contains = require("object-contains");
var log = require("debug")("flame:disk");

var validationBox = {};

var Validation = (function () {
  function Validation() {
    (0, _classCallCheck3.default)(this, Validation);
  }

  (0, _createClass3.default)(Validation, [{
    key: 'register',
    value: function register(name, func) {
      log('registering name ' + name);
      validationBox[name] = validationBox[name] || [];
      validationBox[name].push(func);
      return true;
    }
  }]);
  return Validation;
})();

var v = new Validation();

//Default Validation
v.register("string", function string(string) {
  if (typeof string === "string") {
    return string;
  } else {
    throw new Error("Not a valid string");
  }
  return string;
});

v.register("number", function number(string) {

  if (!isNaN(parseInt(string))) {
    return parseInt(string);
  } else {
    throw new Error("Not a valid number");
  }
});

v.register("age", function age(age) {
  if (age < 0 || age > 200) {
    throw new Error('Age ' + age + ' must be over 0 and under 200');
  }
  return age;
});

v.register("min", function min(value) {
  var min = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

  if (value < min) {
    throw new Error('min is not valid for ' + value);
  }
  return value;
});

v.register("max", function max(value) {
  var max = arguments.length <= 1 || arguments[1] === undefined ? "0" : arguments[1];

  max = parseInt(max);
  if (isNaN(max)) {
    throw new Error("Max is not a number. Max is defined max([number=0])");
  }
  if (value > max) {
    throw new Error('max is not valid for ' + value + ' with the max being ' + max);
  }
  return max;
});

var Nullable = function Nullable() {
  (0, _classCallCheck3.default)(this, Nullable);
};

v.register("nullable", function (value) {
  if (value === null || typeof value === "undefined") {
    return new Nullable();
  } else {
    return value;
  }
});

var Model = (function () {
  function Model() {
    (0, _classCallCheck3.default)(this, Model);

    if (!!!this.id) {
      this.id = mongoid().toString();
    }
  }

  (0, _createClass3.default)(Model, [{
    key: 'save',
    value: (function () {
      var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee() {
        var err;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                log('saving');
                _context.prev = 1;

                if (!!!this.id) {
                  this.id = mongoid().toString();
                }
                _context.next = 5;
                return waitable(this.__hooks.beforeSave.bind(this), null);

              case 5:
                err = _context.sent;
                _context.next = 8;
                return this.update();

              case 8:
                _context.next = 10;
                return waitable(this.__hooks.afterSave.bind(this), err);

              case 10:
                _context.next = 15;
                break;

              case 12:
                _context.prev = 12;
                _context.t0 = _context['catch'](1);
                throw _context.t0;

              case 15:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[1, 12]]);
      }));
      return function save() {
        return ref.apply(this, arguments);
      };
    })()
  }, {
    key: 'validate',
    value: (function () {
      var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2() {
        var self, instance, errors, key, each, keepgoing, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, validate, _validate, func, args, result, a, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, f, p;

        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                log('validating');
                _context2.next = 3;
                return waitable(this.__hooks.beforeValidate.bind(this), null);

              case 3:
                self = this;
                instance = this.__instance;
                errors = [];
                _context2.t0 = _regenerator2.default.keys(instance);

              case 7:
                if ((_context2.t1 = _context2.t0()).done) {
                  _context2.next = 85;
                  break;
                }

                key = _context2.t1.value;
                _context2.prev = 9;

                //grab validation function for each key
                each = this.eachValidate(instance[key]);
                keepgoing = true;
                _iteratorNormalCompletion = true;
                _didIteratorError = false;
                _iteratorError = undefined;
                _context2.prev = 15;
                _iterator = (0, _getIterator3.default)(each);

              case 17:
                if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                  _context2.next = 60;
                  break;
                }

                validate = _step.value;
                _validate = (0, _slicedToArray3.default)(validate, 2);
                func = _validate[0];
                args = _validate[1];
                result = undefined;
                a = [];

                a.push(self[key]);
                a = a.concat(args);
                _iteratorNormalCompletion2 = true;
                _didIteratorError2 = false;
                _iteratorError2 = undefined;
                _context2.prev = 29;
                _iterator2 = (0, _getIterator3.default)(func);

              case 31:
                if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
                  _context2.next = 41;
                  break;
                }

                f = _step2.value;

                result = f.apply(self, a);

                if (!(result instanceof Nullable)) {
                  _context2.next = 37;
                  break;
                }

                keepgoing = false;
                return _context2.abrupt('break', 41);

              case 37:
                //TODO allow nullable with break

                a[0] = result;

              case 38:
                _iteratorNormalCompletion2 = true;
                _context2.next = 31;
                break;

              case 41:
                _context2.next = 47;
                break;

              case 43:
                _context2.prev = 43;
                _context2.t2 = _context2['catch'](29);
                _didIteratorError2 = true;
                _iteratorError2 = _context2.t2;

              case 47:
                _context2.prev = 47;
                _context2.prev = 48;

                if (!_iteratorNormalCompletion2 && _iterator2.return) {
                  _iterator2.return();
                }

              case 50:
                _context2.prev = 50;

                if (!_didIteratorError2) {
                  _context2.next = 53;
                  break;
                }

                throw _iteratorError2;

              case 53:
                return _context2.finish(50);

              case 54:
                return _context2.finish(47);

              case 55:
                if (keepgoing) {
                  _context2.next = 57;
                  break;
                }

                return _context2.abrupt('break', 60);

              case 57:
                _iteratorNormalCompletion = true;
                _context2.next = 17;
                break;

              case 60:
                _context2.next = 66;
                break;

              case 62:
                _context2.prev = 62;
                _context2.t3 = _context2['catch'](15);
                _didIteratorError = true;
                _iteratorError = _context2.t3;

              case 66:
                _context2.prev = 66;
                _context2.prev = 67;

                if (!_iteratorNormalCompletion && _iterator.return) {
                  _iterator.return();
                }

              case 69:
                _context2.prev = 69;

                if (!_didIteratorError) {
                  _context2.next = 72;
                  break;
                }

                throw _iteratorError;

              case 72:
                return _context2.finish(69);

              case 73:
                return _context2.finish(66);

              case 74:
                _context2.next = 79;
                break;

              case 76:
                _context2.prev = 76;
                _context2.t4 = _context2['catch'](9);

                errors.push(new Error(key + ': ' + _context2.t4.message));

              case 79:
                if (!(errors.length > 0)) {
                  _context2.next = 83;
                  break;
                }

                p = new Error(self.___classname + ' is not valid\n' + errors.map(function (e) {
                  return e.message;
                }).join("\n"));

                p.errors = errors;
                throw p;

              case 83:
                _context2.next = 7;
                break;

              case 85:
                _context2.next = 87;
                return waitable(this.__hooks.afterValidate.bind(this), null);

              case 87:
                return _context2.abrupt('return', true);

              case 88:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this, [[9, 76], [15, 62, 66, 74], [29, 43, 47, 55], [48,, 50, 54], [67,, 69, 73]]);
      }));
      return function validate() {
        return ref.apply(this, arguments);
      };
    })()
  }, {
    key: 'eachValidate',
    value: function eachValidate(string) {
      var self = this;
      var each = string.split("|").map(this.getValidatorFunction);
      return each;
    }
  }, {
    key: 'getValidatorFunction',
    value: function getValidatorFunction(string) {
      string = string.trim();
      var func = string.replace(/\(.*/, "").trim();
      var args = string.replace(/[^()]+/, "").replace(/\(|\)/g, "").split(",").map(function (s) {
        return s.trim();
      });
      if (!!!validationBox[func]) {
        throw new Error('Validation rule \'' + func + '\' does not exist. Please register');
      }
      return [validationBox[func], args];
    }
  }, {
    key: 'update',
    value: (function () {
      var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee4() {
        var instance, storage, dir, classFolder, itemFolder, promises, key, file, value, result;
        return _regenerator2.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                log('updating');
                _context4.prev = 1;

                console.log(this.__hooks);
                _context4.next = 5;
                return waitable(this.__hooks.beforeUpdate.bind(this), null);

              case 5:
                _context4.next = 7;
                return this.validate();

              case 7:
                instance = this.__instance;
                storage = this.___storage;
                dir = storage.directory;
                classFolder = path.resolve(dir, this.___classname);
                itemFolder = path.resolve(classFolder, this.id);
                _context4.next = 14;
                return waitable(mkdirp, classFolder);

              case 14:
                _context4.next = 16;
                return waitable(mkdirp, itemFolder);

              case 16:
                promises = [];

                for (key in instance) {
                  if (typeof this[key] !== "undefined") {
                    file = path.resolve(itemFolder, key);
                    value = this[key];

                    promises.push((0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3() {
                      return _regenerator2.default.wrap(function _callee3$(_context3) {
                        while (1) {
                          switch (_context3.prev = _context3.next) {
                            case 0:
                              _context3.prev = 0;
                              _context3.next = 3;
                              return waitable(fs.writeFile, file, value);

                            case 3:
                              _context3.next = 8;
                              break;

                            case 5:
                              _context3.prev = 5;
                              _context3.t0 = _context3['catch'](0);
                              throw _context3.t0;

                            case 8:
                            case 'end':
                              return _context3.stop();
                          }
                        }
                      }, _callee3, this, [[0, 5]]);
                    }))());
                  }
                }
                _context4.next = 20;
                return _promise2.default.all(promises);

              case 20:
                result = _context4.sent;
                _context4.next = 23;
                return waitable(this.__hooks.afterUpdate.bind(this), null);

              case 23:
                return _context4.abrupt('return', result);

              case 26:
                _context4.prev = 26;
                _context4.t0 = _context4['catch'](1);

                console.log(_context4.t0.stack);
                throw _context4.t0;

              case 30:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this, [[1, 26]]);
      }));
      return function update() {
        return ref.apply(this, arguments);
      };
    })()
  }], [{
    key: 'Find',
    value: (function () {
      var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee6(classname, storage) {
        var criteria = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];
        var select = arguments.length <= 3 || arguments[3] === undefined ? null : arguments[3];

        var _class, instance, key, dir, classFolder, dirs, promises, _iteratorNormalCompletion3, _didIteratorError3, _iteratorError3, _iterator3, _step3, selection;

        return _regenerator2.default.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                _class = storage[classname];
                instance = _class.___instance;

                if (select === null) {
                  select = {};
                  for (key in instance) {
                    select[key] = true;
                  }
                }

                dir = storage.directory;
                classFolder = path.resolve(dir, classname);
                _context6.next = 7;
                return waitable(fs.readdir, classFolder);

              case 7:
                dirs = _context6.sent;

                dirs = dirs.filter(function (file) {
                  return file != "." || file !== "..";
                });
                if (criteria && criteria.id) {
                  dirs = dirs.filter(function (d) {
                    return d === criteria.id;
                  });
                }
                dirs = dirs.map(function (d) {
                  return path.resolve(classFolder, d);
                });
                promises = [];
                _iteratorNormalCompletion3 = true;
                _didIteratorError3 = false;
                _iteratorError3 = undefined;
                _context6.prev = 15;

                for (_iterator3 = (0, _getIterator3.default)(dirs); !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                  dir = _step3.value;

                  promises.push((function () {
                    var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee5(dir) {
                      var selection;
                      return _regenerator2.default.wrap(function _callee5$(_context5) {
                        while (1) {
                          switch (_context5.prev = _context5.next) {
                            case 0:
                              _context5.next = 2;
                              return Model.LoadModel(dir, criteria, select);

                            case 2:
                              selection = _context5.sent;

                              if (selection) selection.id = path.basename(dir);

                              return _context5.abrupt('return', selection);

                            case 5:
                            case 'end':
                              return _context5.stop();
                          }
                        }
                      }, _callee5, this);
                    }));
                    return function (_x9) {
                      return ref.apply(this, arguments);
                    };
                  })()(dir));
                }
                _context6.next = 23;
                break;

              case 19:
                _context6.prev = 19;
                _context6.t0 = _context6['catch'](15);
                _didIteratorError3 = true;
                _iteratorError3 = _context6.t0;

              case 23:
                _context6.prev = 23;
                _context6.prev = 24;

                if (!_iteratorNormalCompletion3 && _iterator3.return) {
                  _iterator3.return();
                }

              case 26:
                _context6.prev = 26;

                if (!_didIteratorError3) {
                  _context6.next = 29;
                  break;
                }

                throw _iteratorError3;

              case 29:
                return _context6.finish(26);

              case 30:
                return _context6.finish(23);

              case 31:
                _context6.next = 33;
                return _promise2.default.all(promises);

              case 33:
                selection = _context6.sent;

                selection = selection.filter(function (o) {
                  return !!o;
                });
                selection = selection.map(function (s) {
                  return new storage[classname](s);
                });
                return _context6.abrupt('return', selection);

              case 37:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this, [[15, 19, 23, 31], [24,, 26, 30]]);
      }));
      return function Find(_x3, _x4, _x5, _x6) {
        return ref.apply(this, arguments);
      };
    })()
  }, {
    key: 'LoadModel',
    value: (function () {
      var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee8(filepath, criteria, select) {
        var searches, grab, _iteratorNormalCompletion4, _didIteratorError4, _iteratorError4, _iterator4, _step4, key, name, promises, obj, _iteratorNormalCompletion5, _didIteratorError5, _iteratorError5, _iterator5, _step5, search, selection;

        return _regenerator2.default.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                searches = [];
                grab = (0, _keys2.default)(criteria || {}).concat((0, _keys2.default)(select || {}));

                grab = require("dedupe")(grab);
                _iteratorNormalCompletion4 = true;
                _didIteratorError4 = false;
                _iteratorError4 = undefined;
                _context8.prev = 6;
                for (_iterator4 = (0, _getIterator3.default)(grab); !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                  key = _step4.value;
                  name = path.resolve(filepath, key);

                  searches.push({
                    file: name,
                    key: key
                  });
                }
                _context8.next = 14;
                break;

              case 10:
                _context8.prev = 10;
                _context8.t0 = _context8['catch'](6);
                _didIteratorError4 = true;
                _iteratorError4 = _context8.t0;

              case 14:
                _context8.prev = 14;
                _context8.prev = 15;

                if (!_iteratorNormalCompletion4 && _iterator4.return) {
                  _iterator4.return();
                }

              case 17:
                _context8.prev = 17;

                if (!_didIteratorError4) {
                  _context8.next = 20;
                  break;
                }

                throw _iteratorError4;

              case 20:
                return _context8.finish(17);

              case 21:
                return _context8.finish(14);

              case 22:
                promises = [];
                obj = {};
                _iteratorNormalCompletion5 = true;
                _didIteratorError5 = false;
                _iteratorError5 = undefined;
                _context8.prev = 27;

                for (_iterator5 = (0, _getIterator3.default)(searches); !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                  search = _step5.value;

                  promises.push((function () {
                    var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee7(search) {
                      var value;
                      return _regenerator2.default.wrap(function _callee7$(_context7) {
                        while (1) {
                          switch (_context7.prev = _context7.next) {
                            case 0:
                              _context7.next = 2;
                              return waitable(fs.readFile, search.file, {
                                encoding: "utf8"
                              });

                            case 2:
                              value = _context7.sent;

                              obj[search.key] = value;

                            case 4:
                            case 'end':
                              return _context7.stop();
                          }
                        }
                      }, _callee7, this);
                    }));
                    return function (_x13) {
                      return ref.apply(this, arguments);
                    };
                  })()(search));
                }
                _context8.next = 35;
                break;

              case 31:
                _context8.prev = 31;
                _context8.t1 = _context8['catch'](27);
                _didIteratorError5 = true;
                _iteratorError5 = _context8.t1;

              case 35:
                _context8.prev = 35;
                _context8.prev = 36;

                if (!_iteratorNormalCompletion5 && _iterator5.return) {
                  _iterator5.return();
                }

              case 38:
                _context8.prev = 38;

                if (!_didIteratorError5) {
                  _context8.next = 41;
                  break;
                }

                throw _iteratorError5;

              case 41:
                return _context8.finish(38);

              case 42:
                return _context8.finish(35);

              case 43:
                _context8.next = 45;
                return _promise2.default.all(promises);

              case 45:
                selection = {};

                if (!( /*contains(obj, criteria)||*/criteriaMaker(criteria)(obj) || criteria === null)) {
                  _context8.next = 49;
                  break;
                }

                for (key in select) {
                  selection[key] = obj[key];
                }
                return _context8.abrupt('return', selection);

              case 49:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8, this, [[6, 10, 14, 22], [15,, 17, 21], [27, 31, 35, 43], [36,, 38, 42]]);
      }));
      return function LoadModel(_x10, _x11, _x12) {
        return ref.apply(this, arguments);
      };
    })()
  }]);
  return Model;
})();

function criteriaMaker() {
  var criteria = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

  var collection = [];

  function exist(value, value2) {
    return typeof value !== "undefined" || value != null || value === value2;
  }

  function match(value1, value2) {
    return value1 === value2;
  }

  function Regex(value, regex) {
    return regex.test(value);
  }

  if (criteria === null) {
    return function () {
      return true;
    };
  } else if ((typeof criteria === 'undefined' ? 'undefined' : (0, _typeof3.default)(criteria)) === "object") {
    for (var key in criteria) {
      switch ((0, _typeof3.default)(criteria[key])) {
        case "boolean":
          collection[key] = exist;
          break;
        case "function":
          collection[key] = criteria[key];
          break;
        case "string":
        case "number":
          collection[key] = match;
          break;

        case "object":
          switch (criteria[key].__proto__.constructor) {
            case RegExp:
              collection[key] = Regex;
              break;
          }
      }
    }

    return function (data) {
      for (var key in data) {
        if (typeof collection[key] === "function") {
          if (!collection[key](data[key], criteria[key])) {
            return false;
          }
        }
      }
      return true;
    };
  }
}

var Storage = (function () {
  function Storage(_ref) {
    var directory = _ref.directory;
    var dir = _ref.dir;
    var d = _ref.d;
    (0, _classCallCheck3.default)(this, Storage);

    if (!!!this.instance) {
      this.instance = this;
    } else {
      return this.instance;
    }
    this.directory = directory || dir || d;
    this.validation = this.Validation = v;
  }

  (0, _createClass3.default)(Storage, [{
    key: 'ready',
    value: (function () {
      var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee9() {
        return _regenerator2.default.wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                _context9.next = 2;
                return waitable(mkdirp, this.directory);

              case 2:
                return _context9.abrupt('return', true);

              case 3:
              case 'end':
                return _context9.stop();
            }
          }
        }, _callee9, this);
      }));
      return function ready() {
        return ref.apply(this, arguments);
      };
    })()
  }, {
    key: 'Create',
    value: (function () {
      var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee15(_ref2) {
        var _this = this;

        var name = _ref2.name;
        var _ref2$instance = _ref2.instance;
        var instance = _ref2$instance === undefined ? {} : _ref2$instance;
        var _ref2$classMethods = _ref2.classMethods;
        var classMethods = _ref2$classMethods === undefined ? {} : _ref2$classMethods;
        var _ref2$hooks = _ref2.hooks;
        var hooks = _ref2$hooks === undefined ? {} : _ref2$hooks;

        var self, key, description, _ret;

        return _regenerator2.default.wrap(function _callee15$(_context15) {
          while (1) {
            switch (_context15.prev = _context15.next) {
              case 0:
                self = this;
                _context15.prev = 1;
                return _context15.delegateYield(_regenerator2.default.mark(function _callee14() {
                  var _iteratorNormalCompletion6, _didIteratorError6, _iteratorError6, _loop, _iterator6, _step6, file, dir, _Class, _class;

                  return _regenerator2.default.wrap(function _callee14$(_context14) {
                    while (1) {
                      switch (_context14.prev = _context14.next) {
                        case 0:
                          _iteratorNormalCompletion6 = true;
                          _didIteratorError6 = false;
                          _iteratorError6 = undefined;
                          _context14.prev = 3;

                          _loop = function _loop() {
                            var key = _step6.value;

                            hooks[key] = hooks[key] || function (err, cb) {
                              log('default method for ' + key);
                              cb();
                            };
                          };

                          for (_iterator6 = (0, _getIterator3.default)("beforeCreate ,afterCreate ,beforeSave ,afterSave ,beforeUpdate ,afterUpdate, beforeValidate,afterValidate".split(",").map(function (s) {
                            return s.trim();
                          })); !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                            _loop();
                          }

                          _context14.next = 12;
                          break;

                        case 8:
                          _context14.prev = 8;
                          _context14.t0 = _context14['catch'](3);
                          _didIteratorError6 = true;
                          _iteratorError6 = _context14.t0;

                        case 12:
                          _context14.prev = 12;
                          _context14.prev = 13;

                          if (!_iteratorNormalCompletion6 && _iterator6.return) {
                            _iterator6.return();
                          }

                        case 15:
                          _context14.prev = 15;

                          if (!_didIteratorError6) {
                            _context14.next = 18;
                            break;
                          }

                          throw _iteratorError6;

                        case 18:
                          return _context14.finish(15);

                        case 19:
                          return _context14.finish(12);

                        case 20:
                          if (!(!name || name === "")) {
                            _context14.next = 22;
                            break;
                          }

                          throw new Error('name \'' + name + '\' is not a valid class name. Please set the name attribute in the create method');

                        case 22:

                          //might not be needed
                          file = path.resolve(_this.directory, name, "schema.js");
                          dir = path.dirname(file);
                          _context14.next = 26;
                          return waitable(mkdirp, dir);

                        case 26:
                          _Class = (function (_Model) {
                            (0, _inherits3.default)(_Class, _Model);

                            function _Class(obj) {
                              (0, _classCallCheck3.default)(this, _Class);

                              var _this2 = (0, _possibleConstructorReturn3.default)(this, (0, _getPrototypeOf2.default)(_Class).call(this, obj));

                              _this2.___classname = name;
                              for (var key in instance) {
                                _this2[key] = obj[key] || null;
                              }
                              _this2.__hooks = hooks;
                              _this2.__instance = instance;
                              return _this2;
                            }

                            return _Class;
                          })(Model);

                          for (key in classMethods) {
                            _Class[key] = classMethods[key];
                          }

                          description = {};

                          for (key in instance) {
                            description[key] = {
                              writable: true,
                              configurable: true,
                              value: null
                            };
                          }

                          _class = (function (_Class2) {
                            (0, _inherits3.default)(_class, _Class2);

                            function _class() {
                              (0, _classCallCheck3.default)(this, _class);
                              return (0, _possibleConstructorReturn3.default)(this, (0, _getPrototypeOf2.default)(_class).apply(this, arguments));
                            }

                            return _class;
                          })(_Class);

                          _class.Create = (function () {
                            var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee11(data) {
                              return _regenerator2.default.wrap(function _callee11$(_context11) {
                                while (1) {
                                  switch (_context11.prev = _context11.next) {
                                    case 0:
                                      return _context11.abrupt('return', new _promise2.default(function (resolve, reject) {

                                        try {
                                          hooks.beforeCreate.call(data, null, (function () {
                                            var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee10(err, next) {
                                              var obj;
                                              return _regenerator2.default.wrap(function _callee10$(_context10) {
                                                while (1) {
                                                  switch (_context10.prev = _context10.next) {
                                                    case 0:
                                                      log('calling before create function');

                                                      if (!err) {
                                                        _context10.next = 3;
                                                        break;
                                                      }

                                                      return _context10.abrupt('return', reject(err));

                                                    case 3:
                                                      log('no errors before create not rejected');
                                                      obj = new _class(data);
                                                      _context10.next = 7;
                                                      return obj.save();

                                                    case 7:
                                                      hooks.afterCreate.call(obj, null, function (err) {
                                                        log('calling after create function');
                                                        if (err) return reject(err);else resolve(obj);
                                                      });

                                                    case 8:
                                                    case 'end':
                                                      return _context10.stop();
                                                  }
                                                }
                                              }, _callee10, this);
                                            }));
                                            return function (_x17, _x18) {
                                              return ref.apply(this, arguments);
                                            };
                                          })());
                                        } catch (e) {
                                          log(e);
                                          reject(e);
                                        }
                                      }));

                                    case 1:
                                    case 'end':
                                      return _context11.stop();
                                  }
                                }
                              }, _callee11, this);
                            }));
                            return function (_x16) {
                              return ref.apply(this, arguments);
                            };
                          })();

                          _class.Find = (function () {
                            var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee12(criteria, select) {
                              return _regenerator2.default.wrap(function _callee12$(_context12) {
                                while (1) {
                                  switch (_context12.prev = _context12.next) {
                                    case 0:
                                      return _context12.abrupt('return', Model.Find(name, self, criteria, select));

                                    case 1:
                                    case 'end':
                                      return _context12.stop();
                                  }
                                }
                              }, _callee12, this);
                            }));
                            return function (_x19, _x20) {
                              return ref.apply(this, arguments);
                            };
                          })();

                          _class.FindOne = (function () {
                            var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee13(criteria, select) {
                              var result;
                              return _regenerator2.default.wrap(function _callee13$(_context13) {
                                while (1) {
                                  switch (_context13.prev = _context13.next) {
                                    case 0:
                                      _context13.next = 2;
                                      return _class.Find(criteria, select);

                                    case 2:
                                      result = _context13.sent;
                                      return _context13.abrupt('return', result.length > 0 ? result[0] : null);

                                    case 4:
                                    case 'end':
                                      return _context13.stop();
                                  }
                                }
                              }, _callee13, this);
                            }));
                            return function (_x21, _x22) {
                              return ref.apply(this, arguments);
                            };
                          })();

                          _this[name] = _class;
                          _class.prototype.___storage = self;
                          _class.prototype.___instance = instance;
                          _class.___instance = instance;
                          return _context14.abrupt('return', {
                            v: _class
                          });

                        case 39:
                        case 'end':
                          return _context14.stop();
                      }
                    }
                  }, _callee14, _this, [[3, 8, 12, 20], [13,, 15, 19]]);
                })(), 't0', 3);

              case 3:
                _ret = _context15.t0;

                if (!((typeof _ret === 'undefined' ? 'undefined' : (0, _typeof3.default)(_ret)) === "object")) {
                  _context15.next = 6;
                  break;
                }

                return _context15.abrupt('return', _ret.v);

              case 6:
                _context15.next = 13;
                break;

              case 8:
                _context15.prev = 8;
                _context15.t1 = _context15['catch'](1);

                console.log(_context15.t1);
                console.log(_context15.t1.stack);
                throw _context15.t1;

              case 13:
              case 'end':
                return _context15.stop();
            }
          }
        }, _callee15, this, [[1, 8]]);
      }));
      return function Create(_x15) {
        return ref.apply(this, arguments);
      };
    })()
  }]);
  return Storage;
})();

Storage.validation = v;
exports.default = Storage;