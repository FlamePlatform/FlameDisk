var mkdirp = require("mkdirp");
var waitable = require('waitable');
var path = require('path');
var fs = require('fs');
var mongoid = require('mongoid');
let contains = require("object-contains");


var validationBox = {};

class Validation {
  constructor() {}

  register(name, func) {
    validationBox[name] = validationBox[name] || [];
    validationBox[name].push(func);
    return true;
  }
}

let v = new Validation();

v.register("string", function string(string) {
  return string;
})

v.register("number", function number(string) {
  if (!isNaN(parseInt(string))) {
    return parseInt(string);
  } else {
    throw new Error("Not a valid number");
  }
})

v.register("age", function age(age) {
  if (age < 0 || age > 200) {
    throw new Error(`Age ${age} must be over 0 and under 200`);
  }
  return age;
})

v.register("min", function min(value, min = 0) {
  if (value < min) {
    throw new Error(`min is not valid for ${value}`)
  }
  return value;
})

v.register("max", function max(value, max = "0") {
  max = parseInt(max);
  if (isNaN(max)) {
    throw new Error("Max is not a number. Max is defined max([number=0])")
  }
  if (value > max) {
    throw new Error(`max is not valid for ${value} with the max being ${max}`)
  }
  return max;
})

class Model {
  constructor() {
    if (!!!this.id) {
      this.id = mongoid().toString();
    }
  }

  async save() {

    try {
      if (!!!this.id) {
        this.id = mongoid();
      }
      await waitable(this.__hooks.beforeSave.bind(this), null);
      await this.update();
      await waitable(this.__hooks.afterSave.bind(this), null);
    } catch (e) {
      throw e;
    }
  }

  async validate() {
    await waitable(this.__hooks.beforeValidation.bind(this), null)
    var self = this;
    let instance = this.__instance;
    var errors = [];
    for (var key in instance) {
      try {
        let each = this.eachValidate(instance[key]);
        for (var validate of each) {
          let [func, args] = validate;
          let result;
          let a = [];
          a.push(self[key]);
          a = a.concat(args);
          func.map((f) => {
            result = f.apply(self, a)
            a[0] = result;
          });
        }
      } catch (e) {
        errors.push(new Error(`${key}: ${e.message}`));
      }
      if (errors.length > 0) {
        let p = new Error(`${self.___classname} is not valid\n${errors.map(e=>e.message).join("\n")}`);
        p.errors = errors;
        throw p;
      }
    }
    await waitable(this.__hooks.afterValidation.bind(this), null);
    return true;
  }

  eachValidate(string) {
    var self = this;
    var each = string.split("|").map(this.getValidatorFunction);
    return each;
  }

  getValidatorFunction(string) {
    string = string.trim();
    let func = string.replace(/\(.*/, "").trim();
    var args = string.replace(/[^()]+/, "").replace(/\(|\)/g, "").split(",").map(s => s.trim());
    if (!!!validationBox[func]) {
      throw new Error(`Validation rule '${func}' does not exist. Please register`);
    }
    return [validationBox[func], args];
  }

  async update() {
    await waitable(this.__hooks.beforeUpdate.bind(this), null);
    await this.validate();
    let instance = this.__instance;
    let storage = this.___storage;
    var dir = storage.directory;
    var classFolder = path.resolve(dir, this.___classname);
    var itemFolder = path.resolve(classFolder, this.id);
    await waitable(mkdirp, classFolder);
    await waitable(mkdirp, itemFolder);
    var promises = [];
    for (var key in instance) {
      if (typeof this[key] !== "undefined") {
        var file = path.resolve(itemFolder, key);
        var value = this[key];
        promises.push(async function() {
          try {
            await waitable(fs.writeFile, file, value);
          } catch (e) {

          }
        }());
      }
    }
    var result = await Promise.all(promises);
    await waitable(this.__hooks.afterUpdate.bind(this), null);
    return result;
  }


  static async Find(classname, storage, criteria = null, select = null) {
    let _class = storage[classname];
    let instance = _class.___instance;
    if (select === null) {
      select = {};
      for (var key in instance) {
        select[key] = true;
      }
    }

    var dir = storage.directory;
    var classFolder = path.resolve(dir, classname);
    var dirs = await waitable(fs.readdir, classFolder)
    dirs = dirs.filter(file => file != "." || file !== "..");
    if (criteria && criteria.id) {
      dirs = dirs.filter(d => d === criteria.id);
    }
    dirs = dirs.map(d => path.resolve(classFolder, d));
    var promises = [];
    for (var dir of dirs) {
      promises.push(async function(dir) {
        var selection = await Model.LoadModel(dir, criteria, select);
        if (selection)
          selection.id = path.basename(dir);

        return selection;
      }(dir));
    }
    var selection = await Promise.all(promises);
    selection = selection.filter(o => !!o);
    selection = selection.map(s => new storage[classname](s));
    return selection;
  }



  static async LoadModel(filepath, criteria, select) {
    var searches = [];
    var grab = Object.keys(criteria || {}).concat(Object.keys(select || {}));
    grab = require("dedupe")(grab);
    for (var key of grab) {
      let name = path.resolve(filepath, key);
      searches.push({
        file: name,
        key
      });
    }
    var promises = []
    var obj = {};
    for (var search of searches) {
      promises.push(async function(search) {
        var value = await waitable(fs.readFile, search.file, {
          encoding: "utf8"
        });
        obj[search.key] = value;
      }(search));
    }
    await Promise.all(promises);
    var selection = {};
    if ( /*contains(obj, criteria)||*/ criteriaMaker(criteria)(obj) || criteria === null) {
      for (var key in select) {
        selection[key] = obj[key];
      }
      return selection;
    }
  }
}

export function criteriaMaker(criteria = null) {
  var collection = [];

  function exist(value, value2) {
    return typeof value !== "undefined" || value != null || value === value2
  }

  function match(value1, value2) {
    return value1 === value2
  }

  function Regex(value, regex) {
    return regex.test(value);
  }

  if (criteria === null) {
    return function() {
      return true
    }
  } else if (typeof criteria === "object") {
    for (var key in criteria) {
      switch (typeof criteria[key]) {
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

    return function(data) {
      for (var key in data) {
        if (typeof collection[key] === "function") {
          if (!collection[key](data[key], criteria[key])) {
            return false;
          }
        }
      }
      return true;
    }
  }
}

export default class Storage {

  static instance;
  constructor({
    directory, dir, d
  }) {
    if (!!!this.instance) {
      this.instance = this;
    } else {
      return this.instance;
    }
    this.directory = directory || dir || d;
    this.validation = this.Validation = v;
  }

  async ready() {
    await waitable(mkdirp, this.directory);
    return true;
  }

  async Create({
    name, instance = {}, classMethods = {}, hooks = {}
  }) {
    var self = this;

    try {
      var next = function(err, cb) {
        cb();
      }
      for (var key of "beforeCreate ,afterCreate ,beforeSave ,afterSave ,beforeUpdate ,afterUpdate".split(",").map(s => s.trim())) {
        hooks[key] = hooks[key] || next;
      }

      if (!name || name === "") {
        throw new Error(`name '${name}' is not a valid class name. Please set the name attribute in the create method`);
      }
      const file = path.resolve(this.directory, name, "schema.js");
      const dir = path.dirname(file);

      await waitable(mkdirp, dir);

      class _Class extends Model {
        constructor(obj) {
          super(obj);
          this.___classname = name;
          for (var key in instance) {
            this[key] = obj[key] || null;
          }
          this.__hooks = hooks;
          this.__instance = instance;
        }
      }

      for (var key in classMethods) {
        _Class[key] = classMethods[key];
      }

      var description = {};

      for (var key in instance) {
        description[key] = {
          writable: true,
          configurable: true,
          value: null
        }
      }

      class _class extends _Class {

      }

      _class.Create = async function(data) {
        return new Promise(function(resolve, reject) {
          hooks.beforeCreate.call(data, null, async function(err, next) {
            if (err) return reject(err);
            var obj = new _class(data);
            await obj.save();
            hooks.afterCreate.call(obj, null, function(err) {
              if (err) return reject(err);
              else
                resolve(obj)
            })
          });
        })
      }

      _class.Find = async function(criteria, select) {
        return Model.Find(name, self, criteria, select);
      }

      _class.FindOne = async function(criteria, select) {
        let result = await _class.Find(criteria, select);
        return result.length > 0 ? result[0] : null;
      }

      this[name] = _class;
      _class.prototype.___storage = self;
      _class.prototype.___instance = instance;
      _class.___instance = instance;
      return _class;
    } catch (e) {
      console.log(e);
      console.log(e.stack);
      throw e;
    }
  }
}
