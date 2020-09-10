const mongoose = require('mongoose');

const bidpostSchema = new mongoose.Schema({
  sellerId:{
    type: String,
    trim: true,
  },
  sellerName:{
    type:String,
    trim: true,
  },
  sellerEmail:String,
  jobId:{
    type: String,
    trim: true,
  },
  jobName:{
    type: String,
    trim:true,
  },
  bidderId:{
    type: String,
    trim: true,
  },
  bidderName:{
    type: String,
    trim: true,
  },
  bidderEmail:String,
  bidAmt:{
    type:Number
  },
  bidDate:{
    type:Date,
  },
  validity:{
    type:String,
    trim: true,
  },
});

module.exports = mongoose.model('Bid',bidpostSchema);
