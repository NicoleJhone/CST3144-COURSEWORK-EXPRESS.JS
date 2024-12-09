var express = require("express");
var path = require("path");
var app = express();

//logger middleware
app.use(function (req, res, next) {
  console.log("Request IP: " + req.url);
  console.log("Request Method: " + req.method )
  console.log("Request date: " + new Date());
  next(); // this should stop the browser from hanging
});

app.use(express.json());
app.set("port", 3000);

//cors support
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers"
  );
  next();
});

// mongodb connection
const MongoClient = require("mongodb").MongoClient;
let db;
MongoClient.connect(
  "mongodb+srv://dbUser:NewPassword%4001@cluster0.e3rl6.mongodb.net/",
  (err, client) => {
    db = client.db("Webstore");
  }
);

// display a message for root path to show that API is working
app.get("/", (req, res, next) => {
  res.send("Hello World!");
});

// get the collection name
app.param("collectionName", (req, res, next, collectionName) => {
  req.collection = db.collection(collectionName);
  //   console.log('collection name:', req.collection)
  return next();
});

//returns all the lessons as a Json
app.get("/collection/:collectionName", (req, res, next) => {
  req.collection.find({}).toArray((e, results) => {
    if (e) return next(e);
    res.send(results);
  });
});

//saves a new order to the “order” collection
app.post("/collection/:collectionName", (req, res, next) => {
  req.collection.insert(req.body, (e, results) => {
    if (e) return next(e);
    res.send(results.ops);
  });
});

const ObjectID = require("mongodb").ObjectID;

app.get("/collection/:collectionName/:id", (req, res, next) => {
  req.collection.findOne({ _id: new ObjectID(req.params.id) }, (e, result) => {
    if (e) return next(e);
    res.send(result);
  });
});

app.put("/collection/:collectionName/:id", (req, res, next) => {
  req.collection.update(
    { _id: new ObjectID(req.params.id) },
    { $set: req.body },
    { safe: true, multi: false },
    (e, result) => {
      if (e) return next(e);
      res.send(result.result.n === 1 ? { msg: "success" } : { msg: "error" });
    }
  );
});

app.delete("/collection/:collectionName/:id", (req, res, next) => {
  req.collection.deleteOne({ _id: ObjectID(req.params.id) }, (e, result) => {
    if (e) return next(e);
    res.send(result.result.n === 1 ? { msg: "success" } : { msg: "error" });
  });
});

// Sets up the path where the static files are
var imagePath = path.resolve(__dirname, "images");
app.use(express.static(imagePath));
app.use(function (request, response) {
  response.writeHead(200, { "Content-Type": "text/plain" });
  response.end("Looks like you didn't find a static file.");
});

//starts server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Express.js server running at localhost:3000");
});
