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
app.use(express.static('./pubic'));
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
// app.post('/:day_num', getOneDayHolidays());
// Add a new holiday for specified day
// app.post('/:day_num/add', addHoliday());
// Change or delete a holiday from specified day.
// app.post('/:day_num/change', editOrDeleteHoliday());

//catch-all for unspecified routes
// app.use('*', wildcard())

/**
 * Routes
 */

function getCalendar(req, res) {
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
      date: `${weekdays[index % 7]} ${index + 1}`,
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
      if (holidays[0]) {
        formatHolidays(holidays);

        res.render('index', {
          days: days
        });
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

                res.render('index', { days: days });
              })
              .catch(err => new Error(err).exit(res));
          })
          .catch(err => new Error(err).exit(res))
      }
    })
    .catch(err => new Error(err).exit(res));
}

/**
 * Port
 */

pgClient.connect()
  .then(() => {
    app.listen(PORT, () => console.log(`listening on ${PORT}`));
  })
  .catch(err => new Error(err).exit());
