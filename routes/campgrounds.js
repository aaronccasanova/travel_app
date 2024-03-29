var express = require('express');
var router = express.Router({ mergeParams: true });
var Campground = require('../models/campground');
var middleware = require('../middleware');

// Code for uploading images ********************* vvv
// Testing Image Uploader
var multer = require('multer');
var path = require('path');

// Set Storage Engine
var storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});

// Init Upload
var upload = multer({
  storage: storage,
}).single('image');

// Code for uploading images ********************* ^^^

// INDEX - Show all campgrounds
router.get('/', function (req, res) {
  // Get all campgrounds from DB
  Campground.find({}, function (err, allCampgrounds) {
    if (err) {
      console.log(err);
    } else {
      res.render('campgrounds/index', { campgrounds: allCampgrounds });
    }
  });
});

// CREATE - Add new campground to DB
router.post('/', middleware.isLoggedIn, function (req, res) {
  upload(req, res, function (err) {
    if (err) {
      req.flash('error', err.message);
      res.redirect('/campgrounds');
    } else {
      // get data from form and add to campgrounds array
      var name = req.body.name;
      var image = req.file.filename;
      var price = req.body.price;
      var desc = req.body.description;
      var author = {
        id: req.user._id,
        username: req.user.username,
      };
      var newCampground = { name: name, price: price,
        image: image, description: desc, author: author, };

      // Create a new campground and save to DB
      Campground.create(newCampground, function (err, newlyCreated) {
        if (err) {
          console.log(err);
        } else {
          // redirect back to campgrounds page
          // (defaults to get /campgrounds route)
          res.redirect('/campgrounds');
        }
      });
    }
  });

});

// NEW - Show form to create new campground
router.get('/new', middleware.isLoggedIn, function (req, res) {
  res.render('campgrounds/new');
});

// SHOW - shows more info about one campground
router.get('/:id', function (req, res) {
  // find the campground with provided ID
  Campground.findById(req.params.id).populate('comments').exec(function (err, foundCampground) {
    if (err) {
      console.log(err);
    } else {

      // render show template with that campground
      res.render('campgrounds/show', { campground: foundCampground });
    }
  });
});

// EDIT - campground route
router.get('/:id/edit', middleware.checkCampgroundOwnership, function (req, res) {
  Campground.findById(req.params.id, function (err, foundCampground) {
    res.render('campgrounds/edit', { campground: foundCampground });
  });
});

// UPDATE - campground route
router.put('/:id', middleware.checkCampgroundOwnership, function (req, res) {
  Campground.findByIdAndUpdate(req.params.id, req.body.campground, function
    (err, updatedCampground) {
    if (err) {
      res.redirect('/campgrounds');
    } else {
      res.redirect('/campgrounds/' + req.params.id);
    }
  });
});

// DESTROY - campground route
router.delete('/:id', middleware.checkCampgroundOwnership, function (req, res) {
  Campground.findByIdAndRemove(req.params.id, function (err) {
    if (err) {
      res.redirect('/campgrounds');
    } else {
      res.redirect('/campgrounds');
    }
  });
});

module.exports = router;
