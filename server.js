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


app.use(express.json());
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

 
app.use(function(request,response,next){
  var filePath = path.join(__dirname, "static", request.url);
  fs.stat(filePath, function(err, fileInfo) {
      if (err) {
          next();
          return;
      }
      if (fileInfo.isFile()) 
          response.sendFile(filePath);
      else next();
  })
})

app.use(function(request, response) {
  response.status(404);
  response.send("File not found!");
})

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Express.js server running at localhost:3000");
});
