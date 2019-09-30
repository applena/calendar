'use strict';

module.exports = API;

/**
 * Dependencies
 */

// Get remote NPM packages
const superagent = require('superagent');

// Get local packages
const Holiday = require('./constructors/holiday');

/**
 * Constructor
 */

function API() {}

API.prototype.createAPI = function() {};
API.prototype.readAPI = function() {};
API.prototype.updateAPI = function() {};
API.prototype.deleteAPI = function() {};
