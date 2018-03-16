var express = require("express");
var router = express.Router({mergeParams: true});
var Campground = require("../models/campgrounds");
var Comment = require("../models/comments");
var middleware = require("../middleware");

//Comments New
router.get("/new", middleware.isLoggedIn, function(req, res){
  Campground.findById(req.params.id, function(err, campground){
    if(err || !campground){
      req.flash("error", "Error: campground of comment not found");
      res.redirect("back");
    } else {
      res.render("comments/new", {campground: campground});
    }
  });
});

//Comments Create
router.post("/", middleware.isLoggedIn, function(req, res){
  //look up campground by id
  Campground.findById(req.params.id, function(err, campground){
    if (err || !campground){
      req.flash("error", "Something went wrong campground does not exist :(");
      res.redirect("/campgrounds");
    } else {
      Comment.create(req.body.comment, function(err, comment){
        console.log(req.body.comment);
        if (err || !comment){
          req.flash("error", "Something went wrong. Failed to create Comment");
          console.log("err");
        } else {
          console.log(comment._id);
          campground.comments.push(comment._id);
          campground.save(function(err, campsaved){
            if (err || !campsaved) {
              console.log("err")
            } else {
              //add username and id to comment
              comment.author.id = req.user._id;
              comment.author.username = req.user.username;
              //save comment
              comment.save();
              console.log("camp with new comment saved");
              console.log(campsaved);
              console.log(comment);
              req.flash("success", "Successfully added comment!");
              res.redirect("/campgrounds/" + campground._id);
            }
          });
        }
      });
    }
  });
});

//COMMENT EDIT ROUTE
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function(req, res){
      Campground.findById(req.params.id, function(err, foundCampground){
        if(err || !foundCampground){
          req.flash("error", "Something went wrong campground does not exist :(");
          return res.redirect("back");
        } else{
          res.render("comments/edit", {campground_id: req.params.id, comment: req.comment});
        }
    });
});


//COMMENT UPDATE ROUTE
router.put("/:comment_id", middleware.checkCommentOwnership, function(req, res){
  Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
    if(err || !updatedComment){
      req.flash("error", "Something went wrong");
      res.redirect("back");
    } else {
      req.flash("success", "Comment updated successfully!");
      res.redirect("back");
    }
  })
});

//COMMENT DESTROY ROUTE
router.delete("/:comment_id", middleware.checkCommentOwnership, function(req, res){
  Comment.findByIdAndRemove(req.params.comment_id, function(err){
    if(err){
      res.redirect("back");
    }else{
      req.flash("success", "Comment successfully deleted");
      res.redirect("/campgrounds/" + req.params.id);
    }
  });
});


module.exports = router;
