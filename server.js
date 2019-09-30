'use strict'

/**
 * Dependencies
 */

// Get remote NPM packages
const cors = require('cors');
require('dotenv').config();
const express = require('express');
const methodOverride = require('method-override');
const pg = require('pg');


// Set PostgreSQL database client
const pgClient = new pg.Client(process.env.DATABASE_URL);
pgClient.on('error', err => new Error(err).exit());

// Set Express.js server
const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('./pubic'));
app.use(methodOverride((req, res) => {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    const method = req.body._method;
    delete req.body._method;
    return method;
  }
}));
app.set('view engine', 'ejs');


//========= Routes =========//
// Home page, month Calendar
app.get('/', calendar());
// View one specific day, and show holidays for that day
app.post('/:day_num', getOneDayHolidays());
// Add a new holiday for specified day
app.post('/:day_num/add', addHoliday());
// Change or delete a holiday from specified day.
app.post('/:day_num/change', editOrDeleteHoliday());

//catch-all for unspecified routes
app.use('*', wildcard())




// Constructor Functions
function Holiday(data){
    this.name = data.name,
    this.month = data.month,
    this.year = data.year,
    this.day = data.day,
    this.type = data.type,
    this.description = data.description,
}







function calendar(request, response){
//find all things for specified month

  let month = 'still need to create functionality to specify today\'s month';
  let sql = `SELECT * FROM holidays WHERE month = ${month}`
  pgClient.query(sql).then(sqlResults => {

    response.send(sqlResults)
  })

}









/**
 * Port
 */

pgClient.connect()
  .then(() => {
    app.listen(PORT, () => console.log(`listening on ${PORT}`));
  })
  .catch(err => new Error(err).exit());
