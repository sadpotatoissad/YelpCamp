var Campground = require("../models/campgrounds");
var Comment = require("../models/comments");
//all middleware
middlewareObj = {};

middlewareObj.isLoggedIn = function(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  req.flash("error", "Please login first!");
  return res.redirect("/login");
}

middlewareObj.checkCampgroundOwnership = function(req, res, next){
  if(req.isAuthenticated()){
    var id = req.params.id;
     Campground.findById(id, function(err, foundCampground){
       if(err || !foundCampground) {
         req.flash("error", "Campground not found");
         res.redirect("back");
       } else {
         if(foundCampground.author.id.equals(req.user._id)){
           req.campground = foundCampground;
           next();
         } else {
           req.flash("error", "Permission denied");
           res.redirect("back");
         }
      }
    });
  } else {
    req.flash("error", "You need to be logged in to do that.")
    res.redirect("back");
  }
}

middlewareObj.checkCommentOwnership = function(req, res, next){
  if(req.isAuthenticated()){
     Comment.findById(req.params.comment_id, function(err, foundComment){
       if(err || !foundComment) {
         req.flash("error", "Something went wrong comment does not exist");
         res.redirect("back");
       } else {
         //check if user is the author of comment
         if(foundComment.author.id.equals(req.user._id)){
           req.comment = foundComment;
           next();
         } else {
           req.flash("error", "Permission denied");
           res.redirect("back");
         }
      }
    });
  } else {
    req.flash("error", "You need to be logged in to do that.");
    res.redirect("back");
  }
}

module.exports = middlewareObj;
