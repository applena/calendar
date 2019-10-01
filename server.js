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
// Render Update/Delete page
app.post('/:day_num/change', changeHolidayInfo())
// Update existing Holiday
app.post('/:day_num/update', updateHolidayInfo());
// Delete existing Holiday
app.delete('/:day_num/delete')
//catch-all for unspecified routes
app.use('*', wildcard())












function calendar(request, response){
//find all things for specified month

  let month = 'still need to create functionality to specify today\'s month';
  let sql = `SELECT * FROM holidays WHERE month=${month}`
  pgClient.query(sql).then(oneMonthHolidays => {

    response.send(oneMonthHolidays.rows);
  })
}


function getOneDayHolidays(request, response){
  //line below may not work, depending on how the data is received
  const day_num = request.params.body.day;
  
  //find all things for specified day
  let sql = 'SELECT * FROM holidays WHERE day=$1';
  pgClient.query(sql, [day_num]).then(oneDayHolidays => {

    response.render('/oneDay', {oneDayHolidays: oneDayHolidays.rows})
  })
}

function addHoliday(request, response){
  // adds an event to the selected day
  //line 87 may not work, depending on how the data is received
  const day_num = request.params.body.day;
  const sqlInsert = 'INSERT INTO holidays (name, month, year, day, type, description) VALUES ($1, $2, $3, $4, $5);'

  //insertArray will be incorrect, easily fixed when receiving form data (will not be formdata variable name)
  const queryArray = [formdata.name, formdata.month, formdata.year, formdata.day, formdata.type, formdata.description];

  pgClient.query(sqlInsert, queryArray).then(oneDayHolidays => {
    response.render('/oneDay', {oneDayHolidays : day_num})
  })
}

function changeHolidayInfo(request, response){
  //identify which holiday user clicked on
  const specificDayHolidaydata = request.body;
  //select the information for selected holiday from db
  const queryStatement = 'SELECT * FROM holidays WHERE name=$1;'
  const queryArrayData = [specificDayHolidaydata.name]
  pgClient.query(queryStatement, queryArrayData).then(singleHoliday => {
    let holidayResults = singleHoliday.rows

    //render editHoliday.ejs, send information from db
    response.render('/editHoliday', {infoToUpdate:holidayResults})
  })
}


function updateHolidayInfo(request, response){
  //line 101 may be incorrect, depending on how the data is received
  const day_num = request.params.body.day

  //this line may not work, depends on how we are receiving the data from form
  const updatedInfo = request.body
  //not sure how to capture the month/year from all of this
  const sqlUpdatestatment = 'UPDATE holidays SET name=$1, day=$2, type=$3, description=$4'
  const sqlUpdateArray = [updatedInfo.name, day_num, updatedInfo.type, updatedInfo.description]


  //save updated information to the database
  pgClient.query(sqlUpdatestatment, sqlUpdateArray).then(updatedInfo => {
    response.redirect(`/${day_num}`)
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
