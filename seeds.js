var mongoose = require("mongoose"),
Campground   = require("./models/campgrounds"),
Comment      = require("./models/comments");

var data = [
  {
        name: "Cloud's Rest",
        image: "https://farm4.staticflickr.com/3795/10131087094_c1c0a1c859.jpg",
        description: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum"
    },
    {
        name: "Desert Mesa",
        image: "https://farm6.staticflickr.com/5487/11519019346_f66401b6c1.jpg",
        description: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum"
    },
    {
        name: "Canyon Floor",
        image: "https://farm1.staticflickr.com/189/493046463_841a18169e.jpg",
        description: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum"
    }
];

function seedDB(){
Comment.remove({}, function(err, comments){
  if (err) {
    console.log("failed to removed all comments");
  } else {
    console.log("removing all comments");
  }
});
Campground.remove({}, function(err, campgrounds){
  if (err){
    console.log("error in removing all camps");
  } else {
    console.log("camps removed");
    //seed db
    data.forEach(function(seed){
      // Campground.create(seed, function(err, newCamp){
      //   if(err){
      //     console.log("err in adding new camp while seeding");
      //   } else {
      //     console.log("added new camp:");
      //     //create the same comment on each camp
      //     Comment.create({
      //         text: "this place is great but i wish there was internet",
      //         author: "Homer"
      //     }, function(err, newComment){
      //       if (err) {
      //         console.log("error in creating new comment");
      //       } else {
      //         newCamp.comments.push(newComment._id);
      //         newCamp.save(function(err, savedCamp){
      //           if (err){
      //             console.log("error saving campground with comment");
      //           } else {
      //             console.log("saved campground with comment");
      //           }
      //         });
      //         console.log("new comment added to " + seed.title);
      //       }
      //     });
      //   }
      // });
    });
  }
});
}
module.exports = seedDB;
