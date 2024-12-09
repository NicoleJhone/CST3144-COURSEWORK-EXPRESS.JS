var express = require("express");
var app = express();

//logger middleware
app.use(function (req, res, next) {
  console.log("Request IP: " + req.url);
  console.log("Request date: " + new Date());
  next(); // this should stop the browser from hanging
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Express.js server running at localhost:3000");
});
s