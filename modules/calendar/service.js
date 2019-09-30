'use strict';

module.exports = Calendar;

/**
 * Dependencies
 */

// Get local packages
const API = require('./api');
const DB = require('./db');
const Error = require('../error');

/**
 * Constructor
 */

function Calendar(pgClient) {
  this.api = new API();
  this.db = new DB(pgClient);
}

Calendar.prototype.route = function(req, res) {
  switch (req.path) {
  case '/':
    this.getHolidays(req, res);
    break;
  default:
    // 404
    break;
  }
};

Calendar.prototype.getHolidays = function(req, res) {
  // Store contextual this
  const self = this;

  // Unpack client query string data
  const searchQuery = {};

  // 1. Read DB for Holidays.
  // 2. If Holidays in DB and Holidays are for current month return Holidays to client.
  // 3. Else read Calendarific API holidays data,
  //   Normalize Calendarific API holidays data to Holidays,
  //   Create Holidays in DB,
  //   Read DB for Holidays,
  //   Return Holidays with id to client.

  res.status(200).send('Hello world');
};
