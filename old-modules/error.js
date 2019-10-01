'use strict';

module.exports = Error;

/**
 * Constructor
 */

/**
 * Error constructor
 * @param {Object} err JavaScript Error object for handling
 */
function Error(err) {
  this.status = 500;
  this.message = 'Trouble serving';
  this.error = err;
}

/**
 * Error prototype for client and server error handling
 * @param {Object} res Response to client
 */
Error.prototype.exit = function(res) {
  console.error(this.error);

  if (res) {
    res.status(this.status).send(this.message);
  }
};
