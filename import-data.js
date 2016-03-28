#!/usr/bin/env node

var lib = require('./lib/import-data');

var exportDir = process.argv[2];

require('ssb-client')(function (err, sbot) {
    if (err) throw err;

    lib.importFeed(exportDir, sbot, () => {
        sbot.close();
        console.log("done importing feed");
    });
});
