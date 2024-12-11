var express = require("express");
var path = require("path");
var app = express();
var fs = require("fs");

// Logger middleware to log request method, URL, and IP address
app.use(function (req, res, next) {
  const method = req.method;
  const url = req.originalUrl;
  const ip = req.ip || req.connection.remoteAddress;
  const timestamp = new Date().toISOString();

  console.log(`[${timestamp}] ${method} ${url} - IP: ${ip}`);
  next();
});

// CORS middleware to allow cross-origin requests
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

  // Handle preflight OPTIONS requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

app.use(express.json());

// MongoDB connection setup
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

// Root path to verify the API is working
app.get("/", (req, res, next) => {
  res.send("Hello World!");
});

// Middleware to set collection based on URL parameter
app.param("collectionName", (req, res, next, collectionName) => {
  req.collection = db.collection(collectionName);
  return next();
});

// Endpoint to get all documents from a collection
app.get("/collection/:collectionName", (req, res, next) => {
  req.collection.find({}).toArray((e, results) => {
    if (e) return next(e);
    res.send(results); // Return the documents in JSON format
  });
});

// Endpoint to save a new order to the collection
app.post("/collection/:collectionName", (req, res, next) => {
  req.collection.insert(req.body, (e, results) => {
    if (e) return next(e);
    res.send(results.ops); // Send inserted data back in response
  });
});

// Search endpoint for filtering lessons based on query parameters
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
    res.json(results); // Return results as JSON
  });
});

// Fetch a single document by ID
const ObjectID = require("mongodb").ObjectID;

app.get("/collection/:collectionName/:id", (req, res, next) => {
  req.collection.findOne({ _id: new ObjectID(req.params.id) }, (e, result) => {
    if (e) return next(e);
    res.send(result); // Return the document
  });
});

// Update a document by ID
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

// Delete a document by ID
app.delete("/collection/:collectionName/:id", (req, res, next) => {
  req.collection.deleteOne({ _id: ObjectID(req.params.id) }, (e, result) => {
    if (e) return next(e);
    res.send(result.result.n === 1 ? { msg: "success" } : { msg: "error" });
  });
});

// Static file serving middleware
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

// 404 handler for missing files
app.use(function (request, response) {
  response.status(404);
  response.send("File not found!");
});

// Start the server on the specified port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Express.js server running at localhost:3000");
});
