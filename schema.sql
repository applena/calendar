DROP DATABASE IF EXISTS calendar;
CREATE DATABASE calendar;
\c calendar;

DROP TABLE IF EXISTS holidays;
CREATE TABLE holidays (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  month INTEGER,
  year INTEGER,
  day INTEGER,
  type VARCHAR(255),
  description VARCHAR(255)
);
