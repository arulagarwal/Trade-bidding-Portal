const express = require('express');
const session = require('express-session')
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
var { body, validationResult } = require('express-validator/check');
const router = express.Router();
const Registration = mongoose.model('Registration');
const Job = mongoose.model('Job')
const path = require('path');

function checkSignIn(req, res, next){
  if(req.session.name){
    next();     //If session exists, proceed to page
  } else {
    var err = new Error("Not logged in!");
    next(err);  //Error, trying to access unauthorized page!
  }
}

module.exports = router;
