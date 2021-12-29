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

app.get('/place', (_, res) => {
    res.render("place");
});

app.get('/data', (_, res) => {
    res.render("data");
});

app.get('/wallet', (_, res) => {
    res.render("wallet");
});

app.get('/faq', (_, res) => {
    res.render("faq")
})