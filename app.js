var express        = require("express"),
    app            = express(),
    mongoose       = require("mongoose"),
    flash          = require("connect-flash"),
    passport       = require("passport"),
    LocalStrategy  = require("passport-local"),
    request        = require("request"),
    bodyParser     = require("body-parser"),
    methodOverride = require("method-override"),
    Campground     = require("./models/campgrounds"),
    seedDB         = require("./seeds"),
    User           = require("./models/users"),
    async_pkg      = require("async"),
    nodemailer     = require("nodemailer"),
    mg             = require("nodemailer-mailgun-transport"),
    crypto         = require("crypto"),
    Comment        = require("./models/comments");
require('dotenv').config();


//requiring routes
var commentRoutes   = require("./routes/comments"),
    camgroundRoutes = require("./routes/campgrounds"),
    indexRoutes     = require("./routes/index");

//seedDB();//seed the database
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({extended:true}));
mongoose.connect("mongodb://localhost/yelp_camp");
app.use(methodOverride("_method"));
app.use(flash());
app.locals.moment = require("moment");
//PASSPORT AUTHENTICATION
app.use(require("express-session")({
  secret: "This is an english sentence.",
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
  res.locals.currentUser = req.user;
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  res.locals.info = req.flash("info");
  next();
});

app.use("/", indexRoutes);
app.use("/campgrounds", camgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);

app.listen(3000, function(){
  console.log("Yelp camp server listening on port 3000!!!");
});
