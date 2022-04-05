const express = require("express");
const ws = require("ws");
const exphbs = require('express-handlebars');

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
});

const wss = new ws.WebSocketServer({ server });
let pixelPool = {};
let buffered = [];

wss.on("connection", (connection) => {

    // On initial connection, send current pixel pool
    if (Object.keys(pixelPool).length > 0) {
        connection.send(JSON.stringify(
            Array.from(
                Object.values(pixelPool), x => (
                    { status: "add", pixel: x }
                ))
        ));
    }

    // For every pixel received, broadcast it
    connection.on("message", (data) => {
        let incoming = JSON.parse(data.toString());

        if (Array.isArray(incoming)) {

            for (const current of incoming) {
                if (current.status === "add") {
                    pixelPool[`${current.pixel.x}${current.pixel.y}`] = current.pixel;
                    // buffered.push({d: current, conn: connection});
                    // broadcast(JSON.stringify(current), connection);
                    
                } else if (current.status === "del") {
                    delete current[`${current.pixel.x}${current.pixel.y}`];
                    // buffered.push({d: current, conn: connection});
                    
                } else {
                    console.log("Wrong status");
                    return;
                }
            }

            broadcast(JSON.stringify(incoming), connection);
        }
    })
});

// setInterval(_ => {
//     if (buffered.length > 0) {
//         broadcast(JSON.stringify(buffered));
//         buffered = [];
//     }
// }, 400);

function broadcast(msg, connection) {
    wss.clients.forEach(client => {
        if (client !== connection && client.readyState === ws.WebSocket.OPEN) {
            client.send(msg);
        }
    });
}

function broadcast(msg) {
    wss.clients.forEach(client => {
        if (client.readyState === ws.WebSocket.OPEN) {
            client.send(msg);
        }
    });
}