var should = require("chai").should();
var sinon = require("sinon");
var util = require("util");
var waitable = require('waitable');

import {
  default as Storage
}
from "../src";

import {
  criteriaMaker
}
from '../src';


var path = require('path');
var fs = require('fs');


describe("Criteria Manager", function() {
  const test = {
    name: "Shavauhn Gabay",
    age: 26,
    phone: "905 8869765"
  }

  const namematch = {
    name: "Shavauhn Gabay"
  }

  const criteriaMiddle = {
    name: "Shavauhn Gabay",
    age: function(value) {
      return value > 10
    }
  }

  const criteriaAdvance = {
    name: "Shavauhn Gabay",
    age: function(value) {
      return value > 10
    },
    phone: /905 ?[0-9]{3} ?[0-9]{4}/
  }

  it("should match with simple string query", function() {
    let match = criteriaMaker(namematch);
    match(test).should.equal(true);
  })

  it("should match with simple query", function() {
    let match = criteriaMaker(criteriaMiddle);
    match(test).should.equal(true);
  })

  it("should match with advance query", function() {
    let match = criteriaMaker(criteriaAdvance);
    match(test).should.equal(true);
  })


})
