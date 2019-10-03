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
app.get('/hello', hello);
// Home page, month Calendar
app.get('/', getCalendar);
// View one specific day, and show holidays for that day
app.get('/:day_num', getOneDayHolidays);
// Add a new holiday for specified day
app.post('/:day_num/add', addHoliday);
// Render Update/Delete page
app.get('/:day_num/change', changeHolidayInfo);
// Update existing Holiday
app.post('/:day_num/update', updateHolidayInfo);
// Delete existing Holiday
app.delete('/:day_num/delete');

//catch-all for unspecified routes
// app.use('*', wildcard);

/**
 * Routes
 */

function hello(request, response){
  console.log('hello');
}

function getCalendar(request, response) {

  // 1. Read DB for Holidays.
  // 2. If Holidays in DB (and Holidays are for current month) return Holidays to client.
  // 3. Else read Calendarific API holidays data,
  //   Normalize Calendarific API holidays data to Holidays,
  //   Create Holidays in DB,
  //   Read DB for Holidays,
  //   Return Holidays with id to client.

  // const self = this;

  // Read DB for Holidays
  let sql = 'SELECT DISTINCT ON (day) day, id, name, year, month, type, description FROM holidays ORDER BY day ASC;';
  pgClient.query(sql)
    .then(sqlRes => {
      const holidays = sqlRes.rows;
      // If Holidays in DB
      if (holidays[0]) {
        // And Holidays are for current month
        if (holidays[0].month === new Date().getMonth() + 1) {
          // Return Holidays to client
        } else {
          // Else delete Holidays from DB
          sql = 'DROP TABLE holidays;';
          return pgClient.query(sql)
            .then(() => new Promise(resolve => resolve(true)))
            .catch(err => new Error(err).exit(response));
        }
      } else {
        return new Promise(resolve => resolve(true));
      }
    })
    .then(() => {
      // Else read Calendarific API holidays data
      const date = new Date();
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      return api.readAPI(year, month);
    })
    .then(holidays => {
      // Create Holidays in DB
      const sql = 'INSERT INTO holidays (name, year, month, day, type, description) VALUES ($1, $2, $3, $4, $5, $6);';
      return Promise.all(holidays.map(holiday => {
        const qValues = [
          holiday.name,
          holiday.year,
          holiday.month,
          holiday.day,
          holiday.type,
          holiday.description
        ];
        return pgClient.query(sql, qValues);
      }));
    })
    .then(() => {
      // Read DB for Holidays
      const sql = 'SELECT DISTINCT ON (day) day, id, name, year, month, type, description FROM holidays ORDER BY day ASC;';
      return pgClient.query(sql);
    })
    .then(sqlRes => {
      // Return Holidays with id to client
      const holidays = sqlRes.rows;

      // console.log(holidays);

      const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      let calendarDays = new Array(42).fill({});
      calendarDays = calendarDays.map((calendarDay, index) => {
        const holiday = holidays.find(holiday => {
          return holiday.day === index + 1;
        });

        // console.log(holiday)

        if (holiday) {
          const date = new Date(`${holiday.year}-${holiday.month}-${holiday.day}`);
          // const weekday = weekdays[date.getDay()];
          return {
            dayHeader: `${weekday} ${holiday.day}`,
            holidayName: holiday.name,
            year: holiday.year,
            month: holiday.month,
            day: holiday.day
          };
        }
      });
      console.log('calendarDays', calendarDays);
      // console.log('length', calendarDays.length);


      // const daysInMonth = new Date(holidays[0].year, holidays[0].month, 0).getDate();
      // const firstDayInMonth = new Date(`${holidays[0].year}-${holidays[0].month}-${holidays[0].day}`);
      // const renderHolidays = holidays.map((holiday, index, arr) => {
      //   const weekday = weekdays[(firstDayInMonth.getDay() + index) % 7];

      //   console.log(holiday.day);
      //   console.log(arr[index - 1].day);

      //   const holidayDayDifference = holiday.day - arr[index - 1].day;
      //   if (holidayDayDifference === 0) {
      //     return {
      //       dayHeader: `${weekday} ${holiday.day}`,
      //       holidayName: holiday.name,
      //       year: holiday.year,
      //       month: holiday.month,
      //       day: holiday.day
      //     };
      //   } else {
      //     for (let i = 0; i < holidayDayDifference; i++) {
      //       return new Array(holidayDayDifference).fill({});
      //     }
      //   }
      // });

      // console.log(renderHolidays);

      // for (let i = 0; i < firstDayInMonth.getDay(); i++) {
      //   renderHolidays.unshift({});
      // }

      // for (let i = 0; i < daysInMonth; i++) {
      //   renderHolidays.push({});
      // }

      response.render('index', {
        calendarDays: calendarDays
      });
    })
    .catch(err => new Error(err).exit(response));
}

// app.use('*', wildcard);


function getOneDayHolidays(request, response) {
  //line below may not work, depending on how the data is received
  const day_num = request.params.day_num;
  console.log(request.body)
  //find all things for specified day
  let sql = 'SELECT * FROM holidays WHERE day=$1';
  pgClient.query(sql, [day_num]).then(oneDayHolidays => {

    response.render('./pages/oneDay', { dayDisplayed: oneDayHolidays.rows })

  })
}

function addHoliday(request, response) {
  // adds an event to the selected day
  //line 87 may not work, depending on how the data is received
  const day_num = request.params.body.day;
  const sqlInsert = 'INSERT INTO holidays (name, month, year, day, type, description) VALUES ($1, $2, $3, $4, $5);'

  //insertArray will be incorrect, easily fixed when receiving form data (will not be formdata variable name)
  const queryArray = [formdata.name, formdata.month, formdata.year, formdata.day, formdata.type, formdata.description];

  pgClient.query(sqlInsert, queryArray).then(oneDayHolidays => {
    response.render('/oneDay', { oneDayHolidays: day_num })

  })
}

function changeHolidayInfo(request, response) {
  //identify which holiday user clicked on
  const specificDayHolidayData = request.body;
  // console.log(request.body);
  //select the information for selected holiday from db
  const queryStatement = 'SELECT * FROM holidays WHERE name=$1;'
  const queryArrayData = [specificDayHolidayData.name]
  pgClient.query(queryStatement, queryArrayData).then(singleHoliday => {
    let holidayResults = singleHoliday.rows[0];
    // console.log(holidayResults);
    s
    //render editHoliday.ejs, send information from db
    response.render('./pages/editHoliday', { infoToUpdate: holidayResults })
  })
}


function updateHolidayInfo(request, response) {
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
