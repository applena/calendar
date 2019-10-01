'use strict';

module.exports = DB;

/**
 * Constructor
 */

function DB(pgClient) {
  this.client = pgClient;
}

// Create

DB.prototype.createDB = function() {};

DB.prototype.createDBByHoliday = function(holiday) {
  const sql = 'INSERT INTO holidays (name, year, month, day, type, description) VALUES ($1, $2, $3, $4, $5, $6);';
  const qValues = Object.values(holiday);
  return this.client.query(sql, qValues);
};

// Read

DB.prototype.readDB = function() {};

DB.prototype.readDBForOneHolidayEachDay = function() {
  const sql = 'SELECT DISTINCT ON (day) day, id, name, year, month, type, description FROM holidays ORDER BY day ASC;';
  return this.client.query(sql)
    .then(sqlRes => {
      const holidays = sqlRes.rows;
      return new Promise(resolve => resolve(holidays));
    })
};

// Update

DB.prototype.updateDB = function() {};

// Delete

DB.prototype.deleteDB = function() {};
