var express    = require("express"),
    router     = express.Router(),
    passport   = require("passport"),
    User       = require("../models/users"),
    async_pkg  = require("async"),
    nodemailer = require("nodemailer"),
    crypto     = require("crypto"),
    mg         = require("nodemailer-mailgun-transport");
require('dotenv').config();

//root route
router.get("/", function(req, res){
  res.render("landing");
});

//===============================
//         AUTH ROUTES
//===============================
//show sign up form
router.get("/register", function(req, res){
  res.render("register");
});
//handle sign up
router.post("/register", function(req, res){
  var newUser = new User({
    username: req.body.username,
    email: req.body.email,
    resetPasswordToken :undefined,
    resetPasswordExpires : undefined
  });
  User.register(newUser, req.body.password, function(err, user){
     if(err){
       req.flash("error", err.message);
       return res.redirect("/register");
     } else {
       passport.authenticate("local")(req, res, function(){
         req.flash("success", "Welcome to YelpCamp " + user.username);
         res.redirect("/campgrounds");
       });
     }
  });
});

//show login form
router.get("/login", function(req, res){
  res.render("login");
});

//handle user login
router.post("/login", passport.authenticate("local",
  {
    successRedirect: "/campgrounds",
    failureRedirect: "/login",
    failureFlash: true
  }), function(req, res){
    return done(null, false, { error: 'Incorrect password.' });
});

//logout route
router.get("/logout", function(req, res){
  req.logout();
  req.flash("success", "You have logged out");
  res.redirect("/campgrounds");
});

//FORGOT PASSWORD
router.get("/forgot", function(req, res){
  res.render("forgot");
});

//SEND EMAIL WITH PASSWORD RESET TOKEN
router.post("/forgot", function(req, res, next) {
  console.log(process.env.MAILGUNKEY);
  async_pkg.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString("hex");
        done(err, token);
      });
    },
    function(token, done) {
      var expTime = Date.now() + 3600000;
      User.findOneAndUpdate({ email: req.body.email },{$set:{resetPasswordToken:token, resetPasswordExpires:expTime} } ,function(err, user) {
        if(err){
          console.log("error finding user with given email" + err);
          req.flash("error", "Something went wrong :(");
          return res.redirect("/forgot");
        }
        console.log(user);
        done(err, token, user);
      });
    },
    function(token, user, done) {
      var auth = {
        auth: {
          api_key: process.env.MAILGUNKEY,
          domain: 'sandboxb344f4377aed47b8bbf81c09d89fc092.mailgun.org'
        }
      };
      var nodemailerMailgun = nodemailer.createTransport(mg(auth));

      nodemailerMailgun.sendMail({
        to: user.email,
        from: process.env.TESTGMAIL,
        subject: 'Node.js Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      },function(err, info){
        if(err){
          console.log(err);
          req.flash("error", "error in sending registration email");
          return res.redirect("back");
        }
        console.log('mail sent' + info);
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

//RESET PASSWORD FORM
router.get('/reset/:token', function(req, res) {

  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    else if (err){
      console.log(err);
      req.flash("error", "something went wrong :(");
      return res.redirect("/forgot");
    }
    res.render('reset', {token: req.params.token});
  });
});

//UPDATE PASSWORD
router.post("/reset/:token", function(req, res) {
    console.log(User.find({}));
  async_pkg.waterfall([
    function(done) {
      User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: {
          $gt: Date.now()
        }
      }, function(err, user) {
        if (err) {
          console.log(err);
          req.flash("error", "Something went Wrong :(");
          return res.redirect("back");
        } else if (!user) {
          console.log(err);
          req.flash("error", "Password reset token is invalid or has expired");
          return res.redirect("back");
        }
        if (req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            if (err) {
              req.flash("error", "Something went Wrong :( password not updated");
              return res.redirect("back");
            }
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              if (err) {
                req.flash("error", "Something went Wrong :( password not updated");
                return res.redirect("back");
              }
              req.logIn(user, function(err) {
                if (err) {
                  console.log(err);
                  req.flash("error", "Something went Wrong :/");
                  return res.redirect("back");
                }
                done(err, user);
              });
            });
          });
        } else {
          req.flash("error", "Passwords do not match.");
          return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var auth = {
        auth:{
          api_key : process.env.MAILGUNKEY,
          domain: "sandboxb344f4377aed47b8bbf81c09d89fc092.mailgun.org"
        }
      }
      var nodemailerMailgun = nodemailer.createTransport(mg(auth));
      nodemailerMailgun.sendMail({
        to: user.email,
        from: process.env.TESTGMAIL,
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
              'This is a confirmation that the password for your account '
              + user.email + ' has just been changed.\n'
      }, function(err, info){
        if(err){
          console.log("error at password update confirmation email" + err);
          req.flash("error", "Something went wrong :(");
          return res.redirect("back");
        }
        console.log("password changed info: " + info);
        req.flash("success", "Success! your password has been changed.")
        done(err);
      });
    }
  ], function(err) {
    if (err) {
      console.log(err);
      return res.redirect("back");
    }
    res.redirect("/campgrounds");
  });
});
module.exports = router;
