const mongoose = require('mongoose');

const jobpostSchema = new mongoose.Schema({
  title:{
    type: String,
    trim: true,
  },
  description:{
    type: String,
    trim: true,
  },
  startDate:{
    type: Date,
  },
  endDate:{
    type: Date
  },
  userId:{
    type: String,
  },
  sellerName:{
    type:String,
    trim:true,
  },
  progress:{
    type:String,
    trim:true,
  },
  status:{
    type: String
  },
  bidderId:{
    type: String
  },
  bidderEmail:String,
  bidderName:String,
  bidDate:Date,
  bidAmt:Number,
  paymentStatus:String,
});

module.exports = mongoose.model('Job',jobpostSchema);
