module.exports = Holiday;

/**
 * Constructor
 */

/**
 * Holiday constructor
 */
function Holiday(rawHoliday) {
  this.name = rawHoliday.name;
  this.year = rawHoliday.date.datetime.year;
  this.month = rawHoliday.date.datetime.month;
  this.day = rawHoliday.date.datetime.day;
  this.type = rawHoliday.type[0];
  this.description = rawHoliday.description;
}