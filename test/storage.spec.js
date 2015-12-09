var should = require("chai").should();
var sinon = require("sinon");
var util = require("util");
var waitable = require('waitable');
// var Storage = require("../src/storage");
import {
  default as Storage
}
from "../src";

var path = require('path');
var fs = require('fs');


describe("The Storage Class", function() {
  let storage;
  let Person;
  let hooks;
  before(async function(done) {
    try {
      var path = require("path");
      storage = new Storage({
        directory: path.resolve(__dirname, "database")
      });

      let ready = await storage.ready();
      ready.should.equal(true);

      done();
    } catch (e) {
      done(e);
    } finally {}
  });

  it("should create database folder", async function(done) {
    try {
      let stat = await waitable(fs.stat, path.resolve(__dirname, "database"));
      should.exist(stat);
      done()
    } catch (e) {
      done(e);
    } finally {}
  });


  it("should be able to register validation", async function(done) {
    try {
      let success = storage.validation.register("phone", function({
        value, good, bad
      }) {
        if (/[0-9]{10,15}/.test(value)) {
          good();
        } else {
          bad(`Phone value ${value} is not valid`);
        }
      });

      should.exist(success);
      success.should.equal(true);
      done();
    } catch (e) {
      done(e);
    } finally {

    }
  });

  it("should be able to create a schema", async function(done) {
    try {

      var obj = {
        call: function(err, next) {
          next();
        }
      }

      var stub = sinon.stub(obj, "call", function(err, next) {
        next();
      });
      hooks = {
        beforeCreate: stub,
        afterCreate: stub,
        beforeSave: stub,
        afterSave: stub,
        beforeUpdate: stub,
        afterUpdate: stub,
        beforeValidation: stub,
        afterValidation: stub
      }

      should.exist(storage);

      Person = storage.Create({
        name: "Person",
        instance: {
          first: "string",
          last: "string",
          age: "number|age|min(13)|max(150)",
        },
        classMethods: {

        },
        hooks: hooks
      });
      done();
    } catch (e) {
      done(e);
    } finally {

    }
  });

  describe("A Person Class", function() {
    let person;
    let id;
    it("should be able to create a person", async function(done) {
      try {
        person = await storage.Person.Create({
          first: "Shavauhn",
          last: "Gabay",
          age: 26
        });

        await storage.Person.Create({
          first:"Rashad",
          last :"Williams",
          age:30
        })

        id = person.id;
        hooks.beforeCreate.callCount.should.equal(16);
        person.first.should.equal("Shavauhn");
        person.last.should.equal("Gabay");
        person.age.should.equal(26);
        done();
      } catch (e) {
        done(e);
      }
    })


    it("should be able to search for criteria", async function(done) {
      try {
        var people = await storage.Person.Find({
          first: "Shavauhn"
        }, {
          first: true,
          last: true
        });
        people[0].first.should.equal("Shavauhn");
        done();
      } catch (e) {
        done(e)
      }
    });

    it("should be able to search for criteria even without select", async function(done) {
      try {
        var people = await storage.Person.Find({
          first: "Shavauhn"
        });
        people[0].first.should.equal("Shavauhn");
        people[0].last.should.equal("Gabay");
        done();
      } catch (e) {
        done(e)
      }
    });

    it("should be able to search even without criteria or select", async function(done) {
      try {
        var people = await storage.Person.Find({
          first: "Shavauhn"
        });
        people[0].first.should.equal("Shavauhn");
        people[0].last.should.equal("Gabay");
        done();
      } catch (e) {
        done(e)
      }
    });


    it("should be able to search even without criteria", async function(done) {
      try {
        var people = await storage.Person.Find(null, {
          first: true
        });
        people[0].first.should.equal("Shavauhn");
        should.not.exist(people[0].last);
        done();
      } catch (e) {
        done(e)
      }
    });


    it("should be able to search with flex criteria", async function(done) {
      try {
        var people = await storage.Person.Find({
          age:function(age){
            return age>10
          }
        });
        people.length.should.equal(2);
        done();
      } catch (e) {
        done(e)
      }
    });


    //Single search
    it("should be able to search for criteria", async function(done) {
      try {
        var people = await storage.Person.FindOne({
          first: "Shavauhn"
        }, {
          first: true,
          last: true
        });
        people.first.should.equal("Shavauhn");
        done();
      } catch (e) {
        done(e)
      }
    });

    it("should be able to search for criteria even without select", async function(done) {
      try {
        var people = await storage.Person.FindOne({
          first: "Shavauhn"
        });
        people.first.should.equal("Shavauhn");
        people.last.should.equal("Gabay");
        done();
      } catch (e) {
        done(e)
      }
    });

    it("should be able to search even without criteria or select", async function(done) {
      try {
        var people = await storage.Person.FindOne({
          first: "Shavauhn"
        });
        people.first.should.equal("Shavauhn");
        people.last.should.equal("Gabay");
        done();
      } catch (e) {
        done(e)
      }
    });


    it("should be able to search even without criteria", async function(done) {
      try {
        var people = await storage.Person.FindOne(null, {
          first: true
        });
        people.first.should.equal("Shavauhn");
        should.not.exist(people.last);
        done();
      } catch (e) {
        done(e)
      }
    });


  })



  after(async function(done) {
    try {
      var rimraf = require('rimraf');
      await waitable(rimraf, path.resolve(__dirname, "database"));
      done();
    } catch (e) {
      done(e);
    } finally {

    }
  });

})
