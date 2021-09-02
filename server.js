const express = require("express");
const png = require('pngjs').PNG;
const fs = require('fs');

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

app.get('/info', (_, res) => {
    res.render("info");
});

app.get('/data', (_, res) => {
    res.render("data");
});

app.post('/canvas', (req, res) => {
    if (req.body.pixels.length >= 100) {
        res.send("ERROR: too many pixels submitted. Max 100");
        return
    }

    fs.createReadStream("static/images/canvas.png")
        .pipe(new png())
        .on("parsed", function () {
            for (const pixel of req.body.pixels) {
                let i = idx(pixel.x, pixel.y, this.width);
        
                this.data[i] = pixel.color[0];
                this.data[i + 1] = pixel.color[1];
                this.data[i + 2] = pixel.color[2];
                this.data[i + 3] = 255;
            }
        
            this.pack()
                .pipe(fs.createWriteStream("static/images/canvas.png"))
                .on("finish", function () {
                    res.send("Wrote pixels");
                    console.log("Wrote pixels");
                });
        });
})

function idx(x, y, width) {
    return (width * y + x) << 2;
}