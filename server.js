const express = require("express");
var exphbs  = require('express-handlebars');

const app = express()

app.engine("handlebars", exphbs());
app.set("view engine", "handlebars");

app.use(express.static("static"));

const server = app.listen(7000, () => {
    console.log(`Express running → PORT ${server.address().port}`);
});

app.get('/', (req, res) => {
    res.render("home");
});

app.get('/info', (req, res) => {
    res.render("info");
});

app.get('/data', (req, res) => {
    res.render("data");
});