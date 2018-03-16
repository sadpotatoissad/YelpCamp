var mongoose = require("mongoose");
var campgroundsSchema = new mongoose.Schema({
  name: String,
  price: String,
  image: String,
  image_id: String,
  description: String,
  location: String,
  lat: Number,
  lng: Number,
  createdAt: {type: Date, default: Date.now },
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment"
    }
  ],
  author: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    username: String
  }
});

module.exports = mongoose.model("Campground", campgroundsSchema);
