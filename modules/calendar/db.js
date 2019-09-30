'use strict';

module.exports = DB;

/**
 * Constructor
 */

function DB(pgClient) {
  this.client = pgClient;
}

DB.prototype.createDB = function() {};
DB.prototype.readDB = function() {};
DB.prototype.updateDB = function() {};
DB.prototype.deleteDB = function() {};
