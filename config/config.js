//  config.js by ThreeSixes (https://github.com/ThreeSixes)
//
//  This file serves as a config file for stateNode.js and client.js.
//
//  This project is licensed under GPLv3. See COPYING for dtails.
//
//  This file is part of the airSuck project (https://github.com/ThreeSixes/airSUck).

// Configuration elements
exports.getConfig = function() {
    return {
        server: { // Server configuration starts here.
            enabled: true, // Even if the process starts, do we want this to run?
            webPort: 8090, // Port we want node.js to serve HTTP on.
            keepaliveInterval: (30 * 1000), // Set default interval to 30 sec
            redisHost: "<insert hostname here>", // Redis host with the state pub/sub queue.
            redisPort: 6379, // Redis TCP port
            redisQueue: "airSuckStatePub" // Name of the pub/sub queue.
        }, client1090: { // Dump1090 client configuration.
            enabled: true, // Even if the process starts do we want the dump1090 client to run?
            srcName: "<insert unique name here>", // Name of source that should appear in the database.
            dump1090Host: "127.0.0.1", // Hostname or IP running the dump1090 service. Defaults is 127.0.0.1
            dump1090Port: 30002, // "Binary" dump1090 data port number. Defaults is 30002
            connHost: "<insert hostname here>", // Dump1090 connector host
            connPort: 8091, // Dump1090 connector port
            connectDelay: (5 * 1000), // Global reconnect attempt delay (for the dump1090 process and the destination server)
            connTimeout: 20, // Timeout for a dead connection from the connector server. This should be at least 2x the clientPingInterval in the dump1090 connector config.
            d1090Timeout: 300 // Timeout for not getting any data from the dump1090 instance. Defaults is 5 mins.
        }
    };
}
