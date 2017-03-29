//  stateNode.js by ThreeSixes (https://github.com/ThreeSixes)
//
//  This project is licensed under GPLv3. See COPYING for dtails.
//
//  This file is part of the airSuck project (https://github.com/ThreeSixes/airSUck).

// Settings
var cfg = require('./nodeConfig.js');
var config = cfg.getConfig();

// Set up our needed libraries.
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var redis = require('redis');
var client = redis.createClient(config.server.redisPort, config.server.redisHost);

// If we're doing syslog let's load and setup the syslog stuff.
if (config.server.logMode === "syslog") {
    console.log("Logging to syslog");
    var syslog = require('modern-syslog');
    syslog.init("stateNode.js", syslog.LOG_PID | syslog.LOG_ODELAY, syslog.LOG_DAEMON);
}

// Log event according to log method
function log(eventText) {
    switch (config.server.logMode) {
        case "syslog":
            syslog.log(syslog.LOG_NOTICE, eventText);
            break;

        case "console":
            console.log(new Date().toISOString().replace(/T/, ' ') + ' - ' + eventText);
            break;

        case "none":
            break;

        default:
            break;
    }
}

// Serve index.html if a browser asks for it.
app.get('/', function (req, res) {
    var indexFile = __dirname + '/wwwroot/index.html';

    // Figure out the browser's UA...
    var ua = req.headers['user-agent'];

    // Make sure we're not using Firefox. FF requires different information for strict mode.
    if (/firefox/i.test(ua)) {
        // Replace script tags with someing FireFox can use.
        // When Firefox's implementation of javascript strict mode matures and joins the rest of the world, we can get rid of this.
        var fs = require('fs');
        var indexContents = String(fs.readFileSync(indexFile));

        var newContents = indexContents.replace(/type="text\/javascript"/gi, 'type="text/javascript;version=1.7"');

        // Set content type and send.
        res.set('Content-Type', 'text/html');
        res.send(newContents);

    } else {
        // Send file as-is.
        res.sendFile(indexFile);
    }
});


// Serve our wwwroot folder as the web root.
app.use('/', express.static(__dirname + '/wwwroot'));

// When we have a message in Redis send it to all connected clients. 
client.on("message", function (channel, message) {
    io.emit("message", message)
});

// When we have an error on the redis queue. 
client.on("error", function (err) {
    log("Redis client error detected: " + err);

    // Find a way to wait.

    // Try to subscribe to the queue again.
    subscribe();
});

// When have a new socket.io connection...
io.on('connection', function (socket) {
    log("New client @ " + socket.request.connection.remoteAddress);

    // If they try to send us something give some generic error message.
    socket.on('message', function (msg) {
        socket.emit("message", "{\"error\": \"Yeah, no.\"}");
    });
});

// Start the HTTP server up on our specified port.
http.listen(config.server.webPort, function () {
    log('stateNode.js listening on *:' + config.server.webPort);

    // Send a keepalive and schedule the next keepalive xmission.
    txKeepalive();
});

// Transmit a keepalive to all connected clients.
function txKeepalive() {
    // Create formatted date string.
    var dateStr = new Date().toISOString().replace(/T/, ' ');
    dateStr = dateStr.substring(0, dateStr.length - 5);

    // Send keepalive message.
    io.emit("message", "{\"keepalive\": \"" + dateStr + "\"}");

    // Schedule our keepalive in our specified interval.
    setTimeout(txKeepalive, config.server.keepaliveInterval);
}

// Subscribe to our state queue.
function subscribe() {
    log('Subscribing to pub/sub queue.');

    // Subscribe to the state queue.
    client.subscribe(config.server.redisQueue);
}

// If we're enabled start up.
if (config.server.enabled) {
    // Subscribe to the state queue.
    log('Starting stateNode...');
    subscribe();
} else {
    log("node.js server not enabled in configuration, but executed.")
}
