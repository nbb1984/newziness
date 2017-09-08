/* Showing Mongoose's "Populated" Method
 * =============================================== */
// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
// Requiring our Comment and Article models
var Comment = require("./models/Comment.js");
var Article = require("./models/Article.js");
// Our scraping tools
var request = require("request");
var cheerio = require("cheerio");
// Defining the exphbs variable so that we can use handlebars for templating
var exphbs = require("express-handlebars");
// Set mongoose to leverage built in JavaScript ES6 Promises
mongoose.Promise = Promise;
// Initialize Express
var app = express();
// Setting handlebars as the view engine
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");
// Use morgan and body parser with our app
app.use(logger("dev"));
app.use(bodyParser.urlencoded({
  // extended: false
}));
// Make public a static dir
app.use(express.static("public"));
// Database configuration with mongoose
mongoose.connect("mongodb://localhost/week18day3mongoose");
var db = mongoose.connection;
// Show any mongoose errors
db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});
// Once logged in to the db through mongoose, log a success message
db.once("open", function() {
  console.log("Mongoose connection successful.");
});
// Routes
// ======
// A GET request to scrape the echojs website
app.get("/", function(req, res) {
  // First, we create a black results array to store the results of our db query
    var results = [];
    //We then query the db to find out what articles we already have
    Article.find({}, function(error, doc) {
      // Log any errors
      if (error) {
        console.log(error);
      }
      else {
        // We fill the "results" array with the results of our query
        results = doc;
        var url = "http://www.sciencenews.org";
        // We scrape the website for html content
        request(url, function(error, response, html) {
          // Then, we load that into cheerio and save it to $ for a shorthand selector
          var $ = cheerio.load(html);
          // Now, we grab every h2 within an article tag, and do the following:
          $(".views-field-title .field-content").each(function(i, element) {
            //console.log($(this).text());
            // Save an empty result object
            var result = {};
            // Add the text and href of every link, and save them as properties of the result object
            result.title = $(this).children("a").text();
            result.link = url + $(this).children("a").attr("href");

            // We check to see if there are any items in the results array.  If not, we store the article.
            if (results.length === 0) {
                var entry = new Article(result);
                results.push(entry);
            }

            else {
              var matches = 0;
              // If the results array is not empty, we loop through our results array 
              // to make sure that only one copy of each article gets stored in the db
              for (var i = 0 ; i < results.length ; i++) {
                if (result.title === results[i].title) {
                    matches++;
                }
              }

              if (matches === 0) {
                  var entry = new Article(result);
                  results.push(entry);
              }
            }
          });

            Article.create(results, function(err, doc) {
              // Log any errors
              if (err) {
                console.log(err);
              }
              // Or log the doc
              else {
                console.log('doc coming');
                console.log(doc);
                res.render("index");
              }
            });              
        });  
      }
    });
  });



app.get("/articles", function(req, res) {
  //Remove all articles except for the saved ones 
      Article.find({}, function(error, doc) {
          // Log any errors
          if (error) {
            console.log(error);
          }
          // Or send the doc to the browser as a json object
          else {
            // Render the handlebars template
            res.render("index", {articles: doc});
          }
      });
  });

          


// Grab an article by it's ObjectId
app.get("/article/:id", function(req, res) {
  console.log('ARTICLE LOADED');
  console.log(req.params);
  console.log('^^ that was the params')
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  Article.findOne({ "_id": req.params.id })
  // ..and populate all of the Comments associated with it
  .populate("comments")
  // now, execute our query
  .exec(function(error, doc) {
    // Log any errors
    console.log(doc);
    if (error) {
      // console.log(error);
    }
    // Otherwise, send the doc to the browser as a json object
    else {
      res.render("article", {_id: doc._id, title: doc.title, link: doc.link, comments:doc.comments});
    }
  });
});

// Grab an article by it's ObjectId and add "saved" boolean to it
app.get("/article/save/:id", function(req, res) {
  var id = req.params.id;
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db and changes the "saved" boolean to true...
  Article.findById(id, function (err, doc) {
    if (err) return handleError(err);
    
    doc.set({ saved: true });
    doc.save(function (err, newdoc) {
      console.log(newdoc);
      if (err) return handleError(err);
      return res.redirect("/saved");
    });
  });  
});

app.get("/article/unsave/:id", function(req, res) {
  var id = req.params.id;
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db and changes the "saved" boolean to true...
  Article.findById(id, function (err, doc) {
    if (err) return handleError(err);
    
    doc.set({ saved: false });
    doc.save(function (err, newdoc) {
      console.log(newdoc);
      if (err) return handleError(err);
      return res.redirect("/saved");
    });
  });  
});

// Getting all articles that have saved property set to true  
app.get("/saved", function(req, res) {
  var id = req.params.id;
      Article.find({saved:true}, function(error, doc) {
          // Log any errors
          console.log(doc);
          console.log("found");
          if (error) {
            console.log(error);
          }
          // Or send the doc to the browser as a json object
          else {
            // Render the handlebars template
            res.render("saved", {articles: doc});
          }
      });
});

// Create a new Comment or replace an existing Comment
app.post("/articles/:id/addcomment", function(req, res) {
  // Create a new Comment and pass the req.body to the entry
  var newComment = new Comment(req.body);
  // And save the new Comment the db
  newComment.save(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise
    else {
      console.log('comment coming');
      console.log(doc);
      // Use the article id to find and update it's Comment
       Article.findOneAndUpdate({ "_id": req.params.id }, { $push: { "comments": doc._id } }, { new: true }, function(err, newdoc) {
            // Send any errors to the browser
            if (err) {
              res.send(err);
            }
            // Or send the newdoc to the browser
            else {
              console.log('this happened');
              return res.redirect("/article/" + req.params.id)
            }
        });
      }
    });
  });

// Code to delete a comment.  
app.get("/comments/delete/:id/:articleId", function(req, res) {
      var id =req.params.id;
      var articleId= req.params.articleId;
      console.log(id);
      console.log(articleId);
      // Use the article id to find and delete it's Comment
       Comment.findByIdAndRemove(id).exec(function(err) {
            // Send any errors to the browser
            if (err) {
              res.send(err);
            }
            // Or send the newdoc to the browser
            else {
                Article.findOne({ "_id": articleId })
                  // ..and populate all of the Comments associated with it
                  .populate("comments")
                  // now, execute our query
                  .exec(function(error, doc) {
                    // Log any errors
                    if (error) {
                      console.log(error);
                    }
                    // Otherwise, send the doc to the browser as a json object
                    else {
                      console.log(doc);
                      res.render("article", doc);
                    }
                });
            }
            
          });
    });

// Code to delete all of the articles.  
app.get("/clear", function(req, res) {
      // Remove all articles from the database
       Article.remove({}).exec(function(err) {
            // Send any errors to the browser
            if (err) {
              res.send(err);
            }
            // Or send the newdoc to the browser
            else {
              res.redirect("/");
            }
            
          });
    });

// Listen on port 3000
app.listen(3000, function() {
  console.log("App running on port 3000!");
});