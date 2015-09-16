//  client.js by ThreeSixes (https://github.com/ThreeSixes)
//
//  This project is licensed under GPLv3. See COPYING for dtails.
//
//  This file is part of the airSuck project (https://github.com/ThreeSixes/airSUck).

// Settings
var cfg = require('./config.js');
var config = cfg.getConfig();

// Set up our needed libraries.
var net = require('net');
var d1090 = new net.Socket();
//var io = require('socket.io')(http);

// Log event.
function log(eventText) {
    // Just do a console.log().
    console.log(new Date().toISOString().replace(/T/, ' ') + ' - ' + eventText);
}

// Process message arrays.
function handleMessage(message) {
    
    // Loop through messages we got at the same time.
    for(i = 0; i < message.length; ++i) {
        
        // If we have non-empty data...
        if (message[i] != "") {
            // Handle our data frame.
            data = {'dts': new Date().toISOString().replace('T', ' ').replace('Z', ''), 'src': config.client1090.srcName, 'dataOrigin': 'dump1090', 'data': message[i]}
            
            // Convert the data object to a JSON string.
            data = JSON.stringify(data)
            
            // Log the frmae for debugging.
            log("Frame " + data);
        }
    }
}

// Connect to our source dump1090 instance to get the "binary" frame data.
function connect2Dump1090() {
    // Connect up, log connection success.
    d1090.connect(config.client1090.dump1090Port, config.client1090.dump1090Host, function() {
        log('Connected to ' + config.client1090.dump1090Host + ':' + config.client1090.dump1090Port);
    });
}

// When we get data...
d1090.on('error', function(err) {
    // Puke error message out.
    log("Dump1090 socket " + err);
    
    // Destroy the connection since we don't want it anymore...
    d1090.destroy();
    
    // Find a way to wait for n amount of time.
    
    // Attempt reconnect.
    connect2Dump1090();
});

// When we get data...
d1090.on('data', function(data) {
    // Object -> String
    data = data.toString();
    
    // String -> Array
    data = data.split("\n");
    
    // Do something useful with the message.
    handleMessage(data)
});

// When the connection is closed...
d1090.on('close', function() {
    log('Dump1090 connection to ' + config.client1090.dump1090Host + ':' + config.client1090.dump1090Port + ' closed');
});

// Make the initial attempt to connect, assuming we're enabled.
if (config.client1090.enabled) {
    connect2Dump1090();
} else {
    log("Dump1090 client not enabled in configuration, but executed.")
}