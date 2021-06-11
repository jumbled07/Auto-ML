const express = require("express");  //build rest apis
const bodyParser = require("body-parser");
const cors = require("cors");  //express middleware


const app = express();

// var corsOptions = {
//   origin: "http://localhost:8081"
// };
const create= require("./app/routes/create");
const inventory = require("./app/routes/inventory");
app.use(cors());

// parse requests of content-type - application/json
app.use(bodyParser.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/',create);
app.use('/', inventory);
// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the application." });
});
// app.get('/inventory', function (req, res) {
//   res.render('index.html');
// });
// set port, listen for requests
//const PORT = process.env.PORT || 8080;
const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
