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

// Get local packages
const API = require('./modules/api');
const DB = require('./modules/db');
const Error = require('./modules/error');

// Set PostgreSQL database client
const pgClient = new pg.Client(process.env.DATABASE_URL);
pgClient.on('error', err => new Error(err).exit());

// Set Express.js server
const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static('public'));

app.use(methodOverride((req, res) => {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    const method = req.body._method;
    delete req.body._method;
    return method;
  }
}));
app.set('view engine', 'ejs');

// Set local packages
const api = new API();
const db = new DB(pgClient);

/**
 * Routes
 */
// Home page, month Calendar
app.get('/', getCalendar);
// View one specific day, and show holidays for that day
app.get('/day/:year_num/:month_num/:day_num', getOneDayHolidays);// Done-ZC
// Add a new holiday for specified day
app.get('/day/:year_num/:month_num/:day_num/add', addHoliday);// Done-ZC
// Save from addHoliday page
app.post('/day/:year_num/:month_num/:day_num/save', saveNewHoliday); // Done-ZC
// Render Update/Delete page
app.get('/day/:year_num/:month_num/:day_num/:holiday_name/change', changeHolidayPage);// Done-ZC
// Update existing Holiday
app.post('/day/:year_num/:month_num/:day_num/:holiday_id/update', updateHolidayInfo);// Done-ZC
// Delete existing Holiday
app.delete('/day/:year_num/:month_num/:day_num/:holiday_id/delete', deleteHolidayInfo);// Done-ZC


/**
 * Routes
 */

function getCalendar(request, response){

  // 1. Read DB for Holidays.
  // 2. If Holidays in DB (and Holidays are for current month) return Holidays to client.
  // 3. Else read Calendarific API holidays data,
  //   Normalize Calendarific API holidays data to Holidays,
  //   Create Holidays in DB,
  //   Read DB for Holidays,
  //   Return Holidays with id to client.

  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  let days = new Array(42).fill({});
  days = days.map((el, index) => {
    return {
      date: `${weekdays[index % 7]}${index + 1}`,
      day: index + 1,
      holiday: ''
    };
  });
  const formatHolidays = (holidays) => {
    holidays.forEach(el => {
      const dayNum = el.day;
      days[dayNum - 1].holiday = el.name;
    });
  };

  // Read DB for Holidays
  db.readDBForOneHolidayEachDay()
    .then(holidays => {
      // If Holidays in DB return Holidays to client
      if (holidays[0]){
        // console.log('Hello world');
        formatHolidays(holidays);

        // console.log('days', days);
        // console.log('holidays', holidays);

        // response.status(200);
        response.render('index', { days: days });
        // console.log(days)
      } else {
        // Else read Calendarific API holidays data
        api.readAPI(year, month)
          .then(holidays => {
            // Create Holidays in DB
            return Promise.all(holidays.map(holiday => {
              return db.createDBByHoliday(holiday);
            }));
          })
          .then(() => {
            // Read DB for Holidays
            db.readDBForOneHolidayEachDay()
              .then(holidays => {
                // Return Holidays with id to client
                formatHolidays(holidays);

                response.render('index', { days: days });
              })
              .catch(err => new Error(err).exit(response));
          })
          .catch(err => new Error(err).exit(response))
      }
    })
    .catch(err => new Error(err).exit(response));
}


// View specific-day holidays
function getOneDayHolidays(request, response){
  console.log('inside getoneHolidays')
  let params = request.params
  let date = new Date().toString().slice(0, 10)
  const year_num = params.year_num;
  const month_num = params.month_num;
  const day_num = params.day_num;
  let sql = 'SELECT * FROM holidays WHERE day=$1 AND month=$2 AND year=$3';
  let sqlValues = [day_num, month_num, year_num]
  pgClient.query(sql, sqlValues).then(oneDayHolidays => {

    let pathFriendlyHolidayNames = oneDayHolidays.rows.map(value => {
      let regex = / /g
      let newHolidayname = value.name.replace(regex, '_')
      return newHolidayname
    })
    response.render('./pages/oneDay', {
      renderData: [
        { holidays: oneDayHolidays.rows },
        { dayHeader: date },
        { pathFriendlyHolidayNames: pathFriendlyHolidayNames }
      ]
    })
    // .catch(error => {
    //   handleError(error, response)
    // })
  })
}
//Add Holiday to specific day
function addHoliday(request, response){
  console.log('inside addHoliday')
  const param = request.params;
  const dateObject = {
    year: param.year_num,
    month: param.month_num,
    day: param.day_num
  }
  response.render('pages/newHoliday', { renderData: dateObject })
}
// Saves new holiday information from newHoliday page
function saveNewHoliday(request, response){
  console.log('inside saveNewHoliday');
  const formData = request.body;
  const year = formData.year;
  const month = formData.month;
  const day = formData.day;
  const sqlInsert = 'INSERT INTO holidays (name, month, year, day, type, description) VALUES ($1, $2, $3, $4, $5, $6);'
  const queryArray = [formData.name, formData.month, formData.year, formData.day, formData.type, formData.description];

  pgClient.query(sqlInsert, queryArray).then(() => {
    let sql = 'SELECT * FROM holidays WHERE day=$1 AND month=$2 AND year=$3';
    let sqlValues = [day, month, year]
    pgClient.query(sql, sqlValues).then(() => {

      let url=`/day/${year}/${month}/${day}`
      console.log('sending the user to:', url)
      response.redirect(url)
    })
  })
}
// Redirects to update/delete selected holiday
function changeHolidayPage(request, response){
  console.log('inside chageHolidayPage')
  const param = request.params
  const queryStatement = 'SELECT * FROM holidays WHERE name=$1;'
  const queryArrayData = [param.holiday_name]
  pgClient.query(queryStatement, queryArrayData)
    .then(singleHoliday => {
      let holidayResults = singleHoliday.rows[0];
      response.render('./pages/editHoliday', { renderData: holidayResults })
    })
}
// Saves updated Holiday information to DB
function updateHolidayInfo(request, response){
  console.log('inside updateHolidayInfo')
  const param = request.params;
  const day=param.day_num;
  const month=param.month_num;
  const year=param.year_num;
  const updatedInfo = request.body
  const sqlUpdatestatment = 'UPDATE holidays SET name=$1, type=$2, description=$3 WHERE id=$4'
  const sqlUpdateArray = [updatedInfo.name, updatedInfo.type, updatedInfo.description, param.holiday_id]
  pgClient.query(sqlUpdatestatment, sqlUpdateArray).then(() => {
    response.redirect(`/day/${year}/${month}/${day}`)
  })
}
// Deletes specified Holiday from DB
function deleteHolidayInfo(request, response){
  console.log('inside deleteHolidayInfo')
  const param = request.params;
  const day=param.day_num;
  const month=param.month_num;
  const year=param.year_num;
  const id = param.holiday_id
  pgClient.query('SELECT * FROM holidays WHERE id=$1', [id])
    .then(() => {
      pgClient.query('delete from holidays where id=$1;', [id]).then(() => {
        console.log('deleted the thing')
        response.redirect(`/day/${year}/${month}/${day}`)
      })
    })
}

/**
 * Port
 */


function handleError(error, response){
  response.status(500).render('pages/error');
  console.error(error)
}




pgClient.connect()
  .then(() => {
    app.listen(PORT, () => console.log(`listening on ${PORT}`));
  })
  .catch(err => new Error(err).exit());
