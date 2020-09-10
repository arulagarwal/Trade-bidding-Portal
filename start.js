require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.DATABASE, { useMongoClient: true });
mongoose.Promise = global.Promise;
var db =mongoose.connection;
  db.on('connected', () => {
    console.log(`Mongoose connection open on ${process.env.DATABASE}`);
  })
  db.on('error', (err) => {
    console.log(`Connection error: ${err.message}`);
  });
require('./models/Registration');
require('./models/Job');
require('./models/Bid');
require('./models/Rnr')
const app = require('./app');
const server = app.listen(3000, () => {
  console.log(`Express is running on port ${server.address().port}`);
});
