var express = require("express");
var app = express();

//logger middleware
app.use(function (req, res, next) {
  console.log("Request IP: " + req.url);
  console.log("Request date: " + new Date());
  next(); // this should stop the browser from hanging
});


// Sets up the path where the static files are
var imagePath = path.resolve(__dirname, "images");
app.use(express.static(imagePath));
app.use(function (request, response) {
  response.writeHead(200, { "Content-Type": "text/plain" });
  response.end("Looks like you didn't find a static file.");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Express.js server running at localhost:3000");
});
