const express = require('express');
const session = require('express-session')
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const moment = require('moment');
var { body, validationResult } = require('express-validator/check');
var paypal = require('paypal-rest-sdk');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const router = express.Router();
const Registration = mongoose.model('Registration');
const Job = mongoose.model('Job');
const Bid = mongoose.model('Bid');
const Rnr = mongoose.model('Rnr');
const path = require('path');
// configure paypal with the credentials you got when you created your paypal app
paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': 'ARWrcVf7SSrLzQEgEr3glGvVnoFu70udfFdYrf2hHYYzXJvE9Bi-nzvwWCh44DuKD5PzDVVH5fOI4QKL', // please provide your client id here
  'client_secret': 'EHEB73lZKelVPQ_XxBsE1wlNoWsW_gpc7bYjkQHaNHaAlMP7kCXsMTNci_xHdDRMN7N6G4dCtAirtu1C' // provide your client secret here
});
moment().format('YYYY MM DD');
function checkSignIn(req, res, next){
  if(req.session.name){
    next();     //If session exists, proceed to page
  } else {
    var err = new Error("Not logged in!");
    res.redirect('/signin');
    next(err);  //Error, trying to access unauthorized page!
  }
}
function checkDate(req, res, next){
  Job.find().then((jobs)=>{
    var i;
    for(i=0;i<jobs.length;i++){
    if(moment(moment().utc().format()).isBetween(jobs[i].startDate, jobs[i].endDate, null, '[]')){
      Job.findOneAndUpdate({_id:jobs[i]._id},{status:"Active"}).then(()=>{}).catch(()=>{});
    }
    if(moment(jobs[i].startDate).isAfter(moment().utc().format())){
      Job.findOneAndUpdate({_id:jobs[i]._id},{status:"To Start"}).then(()=>{}).catch(()=>{});
    }
    if(moment(jobs[i].endDate).isBefore(moment().utc().format())){
      Job.findOneAndUpdate({_id:jobs[i]._id},{status:"Expired"}).then(()=>{}).catch(()=>{});
      Job.find({status:"Expired",bidderId:undefined}).remove().then(()=>{}).catch(()=>{});
    }
  }
  next();
}).catch(()=>{var err = new Error("Error");
    next(err);})
}
function setAccess(req,res,next){
  for(var i=0;i<req.session.roles.length;i++){
  if(req.session.roles[i]=="Mod"){
    req.session.accessFlag=2;
  }
}next();
}
function setMod(req,res,next){
  for(var i=0;i<req.session.roles.length;i++){
  if(req.session.roles[i]=="Mod"){
    req.session.accessFlag=1;
  }
  }next();
}
function checkAccess(req, res, next) {
  var flag=req.session.accessFlag;
  if(flag==1 || flag ==2){
    next();
  }else {
    var err = new Error("Not Authorized!");
    res.redirect('/dashboard');
    next(err);
  }
}
/*GET Registration form*/
router.get('/', (req, res) => {
  res.render('form', { title: 'Registration form' });
});
router.post('/',   [//validation tests
    body('name')
      .isLength({ min: 1 })
      .withMessage('Please enter a name'),
    body('email')
      .isLength({ min: 1 })
      .withMessage('Please enter an email'),
    body('password')
      .isLength({ min: 8})
      .withMessage('Minimum length is 8'),
  ],
  (req, res) => {
    const errors = validationResult(req);//array of errors in validation

    if (errors.isEmpty()) {
      bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
      const registration = new Registration({name:req.body.name, email:req.body.email, password:hash, registrationDate:moment().utc().format(),roles:["User"],balance:0});
        registration.save()
          .then(() => { res.render('success',{message:'Thank you for Registering'});})
          .catch(() => { res.render('error') });
    });
    } else {
      res.render('form', {
        title: 'Registration form',
        errors: errors.array(),
        data: req.body,
      });
    }
  });

/*Sign In*/
router.get('/signin', (req,res) => {
  res.render('signin',{title:'Sign In'});
});
router.post('/login',[//validation tests
    body('name')
      .isLength({ min: 1 })
      .withMessage('Please enter a name'),
    body('password')
      .isLength({ min: 8})
      .withMessage('Minimum length is 8'),
  ],
(req, res) =>{
    const errors = validationResult(req);//array of errors in validation
    if(errors.isEmpty()){
        var userName = req.body.name;
        var userPassword = req.body.password;
        Registration.count({"name":userName},function(err,count){
          if(count !=0){
            Registration.find({"name": userName}, function(err,data){
            }).then((registrations) =>{
              bcrypt.compare(req.body.password, registrations[0].password, function(err,check) {
                if(check==true){
                req.session.email = registrations[0].email;
                req.session.roles=registrations[0].roles;
                req.session.userId=registrations[0]._id;
                req.session.name = userName;
                res.redirect('/dashboard');}
                else {
                  res.render('signin',{title:'Sign In', message:"Enter valid credentials"})
                }
              });
            })
            .catch(()=>{res.render('error')});
              }
          else {
            res.render('signin',{title: "Sign In",message: "No User Found"});
          }
        });
    }else{
      res.render('signin',{title:"Sign In",errors:errors.array(), data: req.body});
    }
});
router.get('/dashboard',checkSignIn,setAccess,function(req,res) {
  if(req.session.name){
    res.render('dashboard',{title: "Dashboard",userName:req.session.name,userId:req.session.userId,flag:req.session.accessFlag});
  }else {
    var err = new Error("Not logged in!");
    res.redirect('/signin');
    next(err);  //Error, trying to access unauthorized page!
  }
});
router.get('/changepassword', checkSignIn, function(req,res){
  res.render('changepassword',{title:"Change Password"});
})
router.post('/changepassword', checkSignIn,[
  body('password')
  .isLength({min:8})
  .withMessage("Enter a valid password"),
  body('newpassword')
  .isLength({min:8})
  .withMessage("Enter a password with length of atleast 8 characters")
],function(req,res){
  const errors = validationResult(req);
  if(errors.isEmpty()){
    Registration.findOneAndUpdate({_id:req.session.userId,password:req.body.password},{password:req.body.newpassword})
    .then(()=>{res.render('success',{message:"Password Changed"});})
    .catch(()=>{res.render('error');});
  }else {
    res.render('changepassword',{title:"Change Password In",errors:errors.array(), data: req.body});
  }
});
router.get('/logout', function(req, res){
   req.session.destroy(function(){
   });
   res.redirect('/signin');
 });

router.get('/jobpost', checkSignIn, (req, res) =>{
  res.render('jobform',{title:'Post Jobs',userName:req.session.name});
});
router.post('/jobpost',checkSignIn,[
  body('title')
    .isLength({min: 1})
    .withMessage('Please enter a Title'),
  body('description')
    .isLength({min:1})
    .withMessage('Please enter a description'),
  body('startDate')
    .isAfter()
    .withMessage('Please enter a later Start date'),
  body('endDate')
    .isAfter()
    .withMessage('Please enter a later End Date'),
],
(req, res) =>{
  const errors = validationResult(req);
  if(errors.isEmpty()){
    const job = new Job({title:req.body.title, description: req.body.description, startDate: req.body.startDate, endDate: req.body.endDate, userId:req.session.userId, sellerName:req.session.name,progress:"Not Started", status:"Active"});
    job.save()
      .then(()=>{res.render('success',{title:'Success',memessage:"Job Posted"})})
      .catch(()=>{res.render('error',{title:'Error'});});
  } else {
    res.render('jobform', {
      title: 'Jobpost Form',
      errors: errors.array(),
      data: req.body,
    });
  }
});
router.get('/jobsearch' , checkDate, checkSignIn,(req,res) => {
  var flag=req.session.accessFlag;
  res.render('jobsearch',{flag});
});
router.post('/jobsearch', checkDate, checkSignIn, [
  body('title')
    .isLength({min:1})
    .withMessage("Please enter atleast 1 char"),
],(req,res) =>{
  const errors = validationResult(req);
  if(errors.isEmpty()){
  var title = req.body.title;
  res.redirect('/joblist/'+title);
} else {
  res.render('jobsearch',{errors:errors.array()});
}
});
router.get('/joblist/:title' ,checkSignIn, checkDate, (req,res) => {
  var title = req.params.title;
  var status = req.params.status;
  Job.find({"title": {$regex: new RegExp(title, "ig")}, "status": ["Active","To Start"],"progress":"Not Started"},function(err,data){
  })
  .then((jobs) => {
    var flag=req.session.accessFlag;
    var userId=req.session.userId
    res.render('joblist',{title: "joblisting", jobs, flag,userId});
  })
  .catch(() => {res.render('error');});
});

router.get('/bidPost/:jobid/',checkSignIn,(req,res)=>{
  var jobId = req.params.jobid;
  Job.find({"_id":jobId},function(err,data){})
    .then((jobs)=>{
      res.render('bidform',{jobs});})
    .catch(()=>{res.render('error');});
});
router.post('/bidpost/:jobid',checkSignIn,(req,res)=>{
  var jobId = req.params.jobid;
  Job.find({"_id":jobId}).then((jobs)=>{
    if(req.session.userId===jobs[0].userId){
      res.render('error',{message:"You cannot bid on your own jobs"});
    }else{
    bid = new Bid( {sellerId:jobs[0].userId, sellerName:jobs[0].sellerName,jobId:jobs[0]._id,  jobName:jobs[0].title,bidderId:req.session.userId, bidderName:req.session.name, bidAmt: req.body.bidAmt,bidderEmail:req.session.email,bidDate:moment().utc().format()});
    bid.save()
      .then(()=>{res.render("success",{message:"Bid Posted"});})
      .catch(()=>{res.render('error')})
    }
  });
});
router.get('/yourjobs', checkDate, checkSignIn,(req,res) =>{
  Job.find({"userId":req.session.userId,"progress":"Not Started"},function(err,data){})
    .then((jobs)=>{
      res.render('yourjoblist',{title:"Your Joblist", jobs});
    })
    .catch(()=>{res.render('error');});
});
router.get('/yourbids',checkSignIn,(req,res)=>{
  Bid.find({"bidderId":req.session.userId,"validity":undefined},function(err,data){})
    .then((bids)=>{
      res.render('yourBidlist',{bids});
    })
    .catch(()=>{res.render('error');});
});
router.get('/jobbids/:jobId',checkSignIn,(req,res)=>{//add jobid param
  Bid.find({"sellerId":req.session.userId,"jobId":req.params.jobId},function(err,data){})
    .then((bids)=>{
      res.render('bidlist',{bids});
    }).catch(()=>{res.render('error');});
});
router.get('/deletebid/:bidId',(req,res)=>{
  Bid.find({"_id":req.params.bidId},function(err,data){}).remove().then((bids)=>{
    if(req.session.accessFlag==1){
      res.redirect('/modDashboard');
    }else{
    res.redirect('/yourbids');}
  }).catch(()=>{res.render('error');});
});
router.get('/deletejob/:jobId',checkSignIn,(req,res)=>{
  Job.find({"_id":req.params.jobId},function(err,data){}).remove()
    .then((bids)=>{
      Bid.find({"jobId":req.params.jobId,"userId":req.session.userId},function(err,data){})
          .remove().then(()=>{}).catch(()=>{});
          if(req.session.accessFlag==1){
            res.redirect('/modDashboard');
          }else{
          res.redirect('/yourjobs');}
    }).catch(()=>{res.render('error');});
});
router.get('/selectbid/:bidId/:jobId',checkSignIn,(req,res)=>{
  Bid.findByIdAndUpdate(req.params.bidId,{sellerEmail:req.session.email,validity:"Job Assigned"}, function(err,data){})
  .then((bids)=>{
    Job.findByIdAndUpdate(req.params.jobId,{bidderEmail:bids.bidderEmail, bidderName:bids.bidderName, bidderId:bids.bidderId,bidDate:bids.bidDate, progress:'In Progress', bidAmt:bids.bidAmt}, function(err,data) {})
    res.render('success',{title:'Success',message:'Job Assigned'});
  }).catch(()=>{res.render('error',{title:'Error'})});
});
router.get('/activejobs', checkSignIn,(req,res) =>{
  Job.find({"userId":req.session.userId,"progress":"In Progress"},function(err,data){})
    .then((jobs)=>{
      res.render('activejoblist',{title:"Your Joblist", jobs});
    }).catch(()=>{res.render('error');});
});
router.get('/completedjob',checkSignIn,(req,res)=>{
  Job.find({"userId":req.session.userId,"progress":"Completed"}).then((jobs)=>{
    res.render('completedjoblist',{title:"Completed Jobs",jobs});
  }).catch(()=>{res.render('error');});
})
router.get('/activebids', checkSignIn, (req,res)=>{
  Bid.find({"bidderId":req.session.userId,"validity":"Job Assigned"},function(err,data){})
    .then((bids)=>{
      res.render('activebids',{bids});
    })
    .catch(()=>{res.render('error');});
});
router.get('/rnr/:jobId/',checkSignIn,(req,res)=>{
  Job.findById(req.params.jobId, function(err,data){})
    .then((jobs)=>{
      res.render('rnr',{jobs});
    }).catch(()=>{res.render('error')});
});
router.post('/rnr/:jobId',checkSignIn,[
  body('title')
    .isLength({min:1})
    .withMessage("Please Enter a title"),
  body('description')
    .isLength({min:1})
    .withMessage("Please Enter a description"),
  body('rating')
    .isNumeric()
    .withMessage("Please Enter a rating between 0-5"),
], (req,res)=>{
  var errors = validationResult(req);
  if(errors.isEmpty()){
    Job.findById(req.params.jobId, function(err,data){})
    .then((jobs)=>{
      const rnr = new Rnr({title:req.body.title, description:req.body.description, jobId: jobs._id, jobName: jobs.title, sellerId:jobs.userId, sellerName:jobs.sellerName, buyerId:jobs.bidderId, buyerName:jobs.bidderName, reviewerId: req.session.userId, reviewerName: req.session.name, rating:req.body.rating, reviewDate:moment().utc().format()});
      rnr.save();
      Job.findByIdAndUpdate(jobs._id,{progress:"Completed",paymentStatus:"Unpaid"}).then(()=>{}).catch(()=>{});
      Bid.find({jobId:jobs._id}).remove().then(()=>{}).catch(()=>{});
      res.render('success');
    }).catch(()=>{res.render('error')});
  } else {
    Job.findById(req.params.jobId).then((jobs)=>{
    res.render('rnr',{
      title:'Review and Rating Form',
      errors:errors.array(),
      data: req.body,jobs
    });});
  }
});
router.get('/sellerrnr/:jobId',checkSignIn,(req,res)=>{
  Rnr.count({reviewerId:req.session.userId, jobId:req.params.jobId},function(err,count){
    if(count==0){
      res.redirect("/rnr/"+req.params.jobId);
    }else {
      res.render("error",{message:"Review Already Written"});
    }
  });
});
router.get('/profile/:userId',checkSignIn,(req,res)=>{
  Rnr.find({$or: [{sellerId:req.params.userId},{buyerId:req.params.userId}]}, function(err,data){})
  .then((rnrs)=>{
    Registration.find({_id:req.params.userId},function(err,data){})
    .then((registrations)=>{
      var flag=req.session.accessFlag;
      res.render('profile',{title:"User Profile", rnrs, registrations, flag});
    })
  }).catch(()=>{res.render('error');})
});
router.get('/modDashboard',checkSignIn,setMod,checkAccess,(req,res)=>{
  res.render('modDashboard',{title:"Moderator Controls",userName:req.session.name});
});
router.get('/userSearch' ,checkSignIn, checkAccess, (req,res) => {
  res.render('userSearch');
});
router.post('/userSearch',checkSignIn, checkAccess, [
  body('title')
    .isLength({min:1})
    .withMessage("Please enter atleast 1 char"),
],(req,res) =>{
  const errors = validationResult(req);
  if(errors.isEmpty()){
  var title = req.body.title;
  res.redirect('/registration/'+title);
} else {
  res.render('userSearch',{errors:errors.array()});
}
});
router.get('/registration/:name', checkSignIn, checkAccess, (req, res) => {
  Registration.find({"name": {$regex: new RegExp(req.params.name, "ig")}})
  .then((registrations) => {
      res.render('index', { title: 'Listing registrations', registrations });
  }).catch(() => { res.render('error'); });
});
router.get('/deleteuser/:userId',checkSignIn,checkAccess,(req,res)=>{
  Registration.find({"_id":req.params.userId}).remove()
  .then((registrations)=>{res.redirect('/userSearch');}).catch(()=>{res.render('error');});
});
router.get('/modProfileView/:userId',checkSignIn,checkAccess,(req,res)=>{
  Rnr.find({$or: [{sellerId:req.params.userId},{buyerId:req.params.userId}]}, function(err,data){})
  .then((rnrs)=>{
    Registration.find({_id:req.params.userId},function(err,data){})
    .then((registrations)=>{
      res.render('profile',{title:"User Profile", rnrs, registrations});
    })
  }).catch(()=>{res.render('error');})
});
router.get('/deleteReview/:rnrId',checkSignIn,checkAccess,(req,res)=>{
  Rnr.find({"_id":req.params.rnrId}).remove().then(()=>{
    res.redirect('/userSearch');
  }).catch(()=>{res.render('error');});
});
router.get('/modSeeBids/:userId/:jobId',checkSignIn,checkAccess,(req,res)=>{
  Bid.find({"sellerId":req.params.userId,"jobId":req.params.jobId},function(err,data){})
    .then((bids)=>{
      var flag = req.session.accessFlag;
      res.render('bidlist',{title:"Bid List",bids,flag});
    }).catch(()=>{res.render('error');});
});
router.get('/pay/:jobId',checkSignIn,(req,res)=>{
  Job.findById(req.params.jobId).then((jobs)=>{
    var amount = (jobs.bidAmt+0.3)/0.971;
    req.session.bidAmt=jobs.bidAmt;
    req.session.jobId=jobs._id;
    const create_payment_json = {
      "intent": "sale",
      "payer": {
          "payment_method": "paypal"
      },
      "redirect_urls": {
          "return_url": "http://localhost:3000/success",
          "cancel_url": "http://localhost:3000/cancel"
      },
      "transactions": [{
          "item_list": {
              "items": [{
                  "name": jobs.title,
                  "sku": "001",
                  "price": req.session.bidAmt,
                  "currency": "USD",
                  "quantity": 1
              }]
          },
          "amount": {
              "currency": "USD",
              "total": jobs.bidAmt
          },
          "description": jobs.description
      }]
  };

  paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
        throw error;
    } else {
        for(let i = 0;i < payment.links.length;i++){
          if(payment.links[i].rel === 'approval_url'){
            res.redirect(payment.links[i].href);
          }
        }
    }
  });//till here
  }).catch(()=>{});
});
// success page
router.get('/success' , checkSignIn, (req ,res ) => {
const payerId = req.query.PayerID;
const paymentId = req.query.paymentId;

const execute_payment_json = {
"payer_id": payerId,
"transactions": [{
    "amount": {
        "currency": "USD",
        "total": req.session.bidAmt
    }
}]
};

paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
if (error) {
    throw error;
} else {
    Job.findByIdAndUpdate(req.session.jobId,{paymentStatus:"Paid"}).then((jobs)=>{
      Registration.findById(jobs.bidderId).then((registrations)=>{
        var amt = registrations.balance+jobs.bidAmt;        Registration.findByIdAndUpdate(registrations._id,{balance:amt}).then(()=>{}).catch(()=>{});
      }).catch(()=>{});
      res.render('success');}).catch(()=>{});
}
});
});

module.exports = router;
