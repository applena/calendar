'use strict';

module.exports = Router;

/**
 * Dependencies
 */

// Require local packages
const Calendar = require('./calendar/service');

/**
 * Constructor
 */

function Router(pgClient) {
  this.calendar = new Calendar(pgClient);
}

Router.prototype.service = function(name, req, res) {
  switch (name) {
  case 'calendar':
    this.calendar.route(req, res);
    break;
  default:
    break;
  }
}

/**
 * Router prototype for 404 style handling
 * @param {Object} req Request from client
 * @param {Object} res Response to client
 */
Router.prototype.wildcard = function(req, res) {
  res.status(500).send('Path not found');
};
