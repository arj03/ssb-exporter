#!/usr/bin/env node

var extract = require("./lib/extract-mirrors");
var lib = require("./lib/sync-mirrors");

require('ssb-client')((err, sbot) => {
    if (err) throw err;

    extract.getMirrorsFromFriends(sbot, lib.syncMirrors);
});
