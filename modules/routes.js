'use strict';

module.exports = {
  getCalendar: getCalendar
};

function getCalendar(req, res) {
  //find all things for specified month

  const self = this;

    self.db.readDB()
      .then(sqlRes => {
        if (sqlRes.length === 0) {
          self.
        }
      })
      .catch(err => new Error(err).exit(response));

    let month = 'still need to create functionality to specify today\'s month';
    let sql = `SELECT * FROM holidays WHERE month = ${month}`
    pgClient.query(sql).then(oneMonthHolidays => {

      response.send(oneMonthHolidays);
    })
}
