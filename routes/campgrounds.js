var express      = require("express"),
    router       = express.Router(),
    Campground   = require("../models/campgrounds"),
    middleware   = require("../middleware"),
    NodeGeocoder = require("node-geocoder"),
    multer       = require("multer");

var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
  callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
  // accept image files only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({
  cloud_name: "sadpotatoissad",
  api_key: process.env.CLOUDAPIKEY,
  api_secret: process.env.CLOUDAPISECRET
});
var options = {
  provider: "google",
  httpAdapter: "https",
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};

var geocoder = NodeGeocoder(options);

//INDEX route -display all campgrounds
router.get("/", function(req, res){
  if(req.query.search){
    const regex = new RegExp(escapeRegex(req.query.search), "gi");
    //fuzzy search based on name
    Campground.find({$or:[{ "name": regex },{ "description": regex }]}, function(err, foundCampgrounds) {
      if(err || !foundCampgrounds) {
        console.log(err);
      } else {
        var infomsg;
        if(foundCampgrounds.length < 1){
          infomsg = "could not find any campgrounds with the given search parameters";
      }
        return res.render("campgrounds/index", { "info": infomsg, campgrounds: foundCampgrounds });
      }
    });
  } else {
    Campground.find({}, function(err, allCampgrounds){
      if(err){
        console.log("something went wrong when getting all campgrounds");
      } else{
        res.render("campgrounds/index", {campgrounds:allCampgrounds});
      }
    });
  }
});

//CREATE route -add new campground to db
router.post("/", middleware.isLoggedIn, upload.single("image"), function(req, res) {
  //get data from form add to campgrounds array
  var name = req.body.name;
  var price = req.body.price.toString();
  var desc = req.body.description;
  var author = {
    id: req.user._id,
    username: req.user.username
  }
  geocoder.geocode(req.body.location, function(err, data) {
    if (err || !data.length) {
      req.flash("error", "Invalid address");
      return res.redirect('back');
    }
    var lat = data[0].latitude;
    var lng = data[0].longitude;
    var location = data[0].formattedAddress;
    cloudinary.uploader.upload(req.file.path, function(result) {
      // add cloudinary url
      var img = result.secure_url;
      var image_id = result.public_id;
      Campground.create({
        name: name,
        price: price,
        image: img,
        description: desc,
        location: location,
        image_id: image_id,
        lat: lat,
        lng: lng,
        author: author
      }, function(err, campground) {
        if (err || !campground) {
          console.log("something went wrong when adding campgroun");
        } else {
          req.flash("success", "New Campground added!");
          res.redirect("/campgrounds");
        }
      });
    });
  });
});

//NEW ROUTE -show form to create new campground
router.get("/new", middleware.isLoggedIn, function(req, res) {
  res.render("campgrounds/new");
});

//SHOW ROUTE- shows info on a single campground
router.get("/:id", function(req, res) {
  Campground.findById(req.params.id, function(err, camp) {
    console.log(camp);
  });
  Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground) {
    if (err || !foundCampground) {
      console.log("error with finding campground by id");
    } else {
      console.log("this is the full camp info:");
      console.log(foundCampground);
      res.render("campgrounds/show", {
        campground: foundCampground
      });
    }
  });
  console.log("this will be the show page one day");
});

//EDIT CAMPGROUND ROUTE
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res) {
  res.render("campgrounds/edit", {
    campground: req.campground
  });
});

//UPDATE CAMPGROUND ROUTE
router.put("/:id", middleware.checkCampgroundOwnership, upload.single("campground[image]"), function(req, res) {
  geocoder.geocode(req.body.campground.location, function(err, data) {
    if (err || !data.length) {
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }
    req.body.campground.lan = data[0].latitude;
    req.body.campground.lng = data[0].longitude;
    req.body.campground.location = data[0].formattedAddress;
    // if a new file has been uploaded
    if (req.file) {
        Campground.findById(req.params.id, function(err, campground) {
          if(err || !campground) {
            req.flash('error', err.message);
            return res.redirect('back');
          }
          // delete the file from cloudinary
          cloudinary.v2.uploader.destroy(campground.image_id, function(err, result){
            if(err) {
              req.flash('error', err.message);
              return res.redirect('back');
            }
            // upload a new one
            cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
              if(err) {
                req.flash('error', err.message);
                return res.redirect('back');
              }
              // add cloudinary url for the image to the campground object under image property
              req.body.campground.image = result.secure_url;
              // add image's public_id to campground object
              req.body.campground.image_id = result.public_id;

              Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err) {
                if(err) {
                  req.flash('error', err.message);
                  return res.redirect('back');
                }
                req.flash('success','Successfully Updated!');
                res.redirect('/campgrounds/' + campground._id);
              });
            });
          });
        });
    } else {
        Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err) {
          if(err) {
            req.flash('error', err.message);
            return res.redirect('back');
          }
          req.flash('success','Successfully Updated!');
          res.redirect('/campgrounds/' + req.params.id);
        });
    }
    });
  });


//DESTROY CAMPGROUND ROUTE
router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res){
  Campground.findById(req.params.id, function(err, campground){
    if(err || !campground){
      req.flash("error", "something went wrong:(");
      return res.redirect("back");
    }
    // delete the file from cloudinary
    cloudinary.v2.uploader.destroy(campground.image_id, function(err, result){
      if(err) {
        req.flash('error', err.message);
        return res.redirect('back');
      }
      campground.remove();
      req.flash("success", "Campground removed successfully");
      res.redirect("/campgrounds");
    });
  });
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;
