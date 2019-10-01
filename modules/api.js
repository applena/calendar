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

API.prototype.readAPI = function(year, month) {
  const url = `https://calendarific.com/api/v2/holidays?api_key=${process.env.CALENDARIFIC_API_KEY}&country=us&year=${year}&month=${month}`;
  return superagent(url)
    .then(saRes => {
      // Unpack API data for server
      const rawHolidays = saRes.body.response.holidays;

      // Normalize Calendarific API holidays data to Holidays
      const holidays = rawHolidays.map(rawHoliday => {
        if (rawHoliday.locations === 'All' && rawHoliday.states === 'All') {
          return new Holiday(rawHoliday);
        }
      }).filter(holiday => {
        return holiday;
      });

      return new Promise(resolve => resolve(holidays));
    });
};

API.prototype.updateAPI = function() {};
API.prototype.deleteAPI = function() {};
