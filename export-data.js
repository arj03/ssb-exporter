#!/usr/bin/env node

var common = require('./lib/common');
var lib = require('./lib/export-data');

var program = require('commander');

program
  .option('-f, --feed-id [value]', 'Feed id to export')
  .option('-e, --export-dir [value]', 'Dir to export feed to')
  .parse(process.argv);

require('ssb-client')((err, sbot) => {
    if (err) throw err;

    sbot.whoami((err, info) => {
        if (err) throw err;

        var feedId = program.feedId || info.id;
        var exportDir = program.exportDir || "";

        if (!require('ssb-ref').isFeed(feedId)) {
            console.error('Invalid public key: ' + feedId);
            process.exit(1);
        }

        if (exportDir != "")
            common.ensureDirExists(exportDir, function() { lib.exportFeed(feedId, exportDir, sbot); });
        else
            lib.exportFeed(feedId, exportDir, sbot);
    });
});
