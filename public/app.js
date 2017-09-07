// Grab the articles as a json
$.getJSON("/articles", function(data) {
  // For each one
  for (var i = 0; i < data.length; i++) {
    // Display the apropos information on the page
    $("#articles").append("<p data-id='" + data[i]._id + "'>" + data[i].title + "<br />" + data[i].link + "</p>");
    // Append a "save" button to each article with the same id as the article
    $("#articles").append("<button data-id='" + data[i]._id + "' id='savearticle'><a href= '/saved'>Save Article</a></button>");
  }
});
// Whenever someone clicks a p tag
$(document).on("click", "p", function() {
  // Empty the comments from the comment section
  $("#comments").empty();
  // Save the id from the p tag
  var thisId = $(this).attr("data-id");
  // Now make an ajax call for the Article
  $.ajax({
    method: "GET",
    url: "/articles/" + thisId
  })
    // With that done, add the comment information to the page
    .done(function(data) {
      console.log(data);
      // The title of the article
      $("#comments").append("<h2>" + data.title + "</h2>");
      // An input to enter a new title
      $("#comments").append("<input id='titleinput' name='title' >");
      // A textarea to add a new comment body
      $("#comments").append("<textarea id='bodyinput' name='body'></textarea>");
      // A button to submit a new comment, with the id of the article saved to it
      $("#comments").append("<button data-id='" + data._id + "' id='savecomment'>Save comment</button>");
      // If there's a comment in the article
      if (data.comments) {
        for (i=0; i < data.comments.length; i++) {
          console.log("comment grabbed");
          console.log(data.comments);
          $("#comments").append("<h2>" + data.comments[i].title + "</h2>");
          // Place the title of the comment in the title input
          $("#comments").append("<h3>" + data.comments[i].body + "</h3>");
          // Place a delete button at the end of the comment. 
          $("#comments").append("<button data-id='" + data.comments[i]._id + "' class = '" + thisId + "' id='deletecomment'>Delete comment</button>");
        }
      }
    });
});

// When you click the savecomment button
$(document).on("click", "#savecomment", function() {
  // Grab the id associated with the article from the submit button
  var thisId = $(this).attr("data-id");
  console.log($("#titleinput").val());
  console.log($("#bodyinput").val());
  // Run a POST request to change the comment, using what's entered in the inputs
  $.ajax({
    method: "POST",
    url: "/articles/" + thisId,
    data: {
      // Value taken from title input
      title: $("#titleinput").val(),
      // Value taken from comment textarea
      body: $("#bodyinput").val(),
      articleId: thisId
    }
  })
    // With that done
    .done(function(data) {
      // Log the response
      console.log(data);
      // Empty the comments section
      $("#titleinput").val("");
      $("#bodyinput").val("");

    });
  // Also, remove the values entered in the input and textarea for comment entry
});
//When you click the deletecomment button
$(document).on("click", "#deletecomment", function() {
  // Grab the id associated with the article from the specific delete button clicked.
  var thisDataId = $(this).attr("data-id");
  console.log("id coming");
  console.log(thisDataId);
  // Run a POST request to change the comment, using what's entered in the inputs
  $.ajax({
    method: "GET",
    url: "/comments/delete/" + thisDataId
  })
    // With that done
    .done(function(data) {
      // Log the response
      console.log("deleted");
      // Empty the comments section
      $("#comments").empty();
    });
  // Also, remove the values entered in the input and textarea for comment entry
  $("#titleinput").val("");
  $("#bodyinput").val("");
});

$(document).on("click", "#savearticle", function() {
  // Grab the id associated with the article from the specific delete button clicked.
  var thisDataId = $(this).attr("data-id");
  console.log("save id coming");
  console.log(thisDataId);
  // Run a POST request to change the comment, using what's entered in the inputs
  $.ajax({
    method: "GET",
    url: "/article/save/" + thisDataId
  })
    // With that done
    .done(function(data) {
      // Log the response
      console.log("saved");
      // Empty the comments section
      $("#comments").empty();
    });
  // Also, remove the values entered in the input and textarea for comment entry
  $("#titleinput").val("");
  $("#bodyinput").val("");
});