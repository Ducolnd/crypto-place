const express = require("express");
var exphbs  = require('express-handlebars');

const app = express()

app.engine("handlebars", exphbs());
app.set("view engine", "handlebars");

app.use(express.static("static"));
app.use(
    express.urlencoded({
      extended: true
    })
  )
  
app.use(express.json())

const server = app.listen(7000, () => {
    console.log(`Express running → PORT ${server.address().port}`);
});

app.get('/', (_, res) => {
    res.render("home");
});

app.get('/test', (_, res) => {
    res.render("webpack-testing", {layout: "main"});
});

app.get('/info', (_, res) => {
    res.render("info");
});

app.get('/data', (_, res) => {
    res.render("data");
});

app.get('/wallet', (_, res) => {
    res.render("wallet");
});