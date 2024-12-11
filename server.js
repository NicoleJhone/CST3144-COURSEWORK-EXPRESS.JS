var express = require("express");
var path = require("path");
var app = express();
var fs = require("fs");

// Logger middleware
app.use(function (req, res, next) {
  const method = req.method;
  const url = req.originalUrl;
  const ip = req.ip || req.connection.remoteAddress;
  const timestamp = new Date().toISOString();

  console.log(`[${timestamp}] ${method} ${url} - IP: ${ip}`);
  next();
});

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,HEAD,OPTIONS,POST,PUT,DELETE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

app.use(express.json());

// mongodb connection
const MongoClient = require("mongodb").MongoClient;

let db;

MongoClient.connect(
  "mongodb+srv://dbUser:NewPassword%4001@cluster0.e3rl6.mongodb.net/",
  { useUnifiedTopology: true },
  (err, client) => {
    if (err) {
      console.error("MongoDB connection error:", err);
      return;
    }
    db = client.db("Webstore");
    console.log("MongoDB connected successfully");
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

//search route
app.get("/search", (req, res, next) => {
  const searchQuery = req.query.q; // Search term for title or location
  const priceQuery = req.query.price; // Filter by price
  const availableSpaceQuery = req.query.availableSpace; // Filter by available space

  const collection = db.collection("lessons"); // Lessons collection

  let filter = {};

  // Filter by title or location if search term is provided
  if (searchQuery) {
    filter = {
      $or: [
        { title: { $regex: searchQuery, $options: "i" } },
        { location: { $regex: searchQuery, $options: "i" } },
      ],
    };
  }

  // Add price filter if provided
  if (priceQuery) {
    filter.price = parseFloat(priceQuery);
  }

  // Add availableSpace filter if provided
  if (availableSpaceQuery) {
    filter.availableSpace = parseInt(availableSpaceQuery, 10);
  }

  // Query MongoDB with the filter
  collection.find(filter).toArray((err, results) => {
    if (err) return res.status(500).json({ error: "Internal server error." });
    res.json(results); // Return results
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

app.use(function (request, response, next) {
  var filePath = path.join(__dirname, "static", request.url);
  fs.stat(filePath, function (err, fileInfo) {
    if (err) {
      next();
      return;
    }
    if (fileInfo.isFile()) response.sendFile(filePath);
    else next();
  });
});

app.use(function (request, response) {
  response.status(404);
  response.send("File not found!");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Express.js server running at localhost:3000");
});
