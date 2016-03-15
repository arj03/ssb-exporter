#!/usr/bin/env node

var fs = require('fs');
var pull = require('pull-stream');
var toPull = require('stream-to-pull-stream');

function ensureDirExists(exportDir, callback)
{
    if (!fs.existsSync(exportDir)) {
        fs.mkdir(exportDir, function(err){
            if (err) throw err;

            callback();
        });
    } else
        callback();
}

function exportFeed(userId, exportDir, sbot) {
    // load data
    pull(sbot.createUserStream({ id: userId }), pull.collect(function (err, log) {
        if (err) throw err;

        fs.writeFile(exportDir + "/messages.txt", JSON.stringify(log));
    }));

    var blobs, blobMessageMap = {};
    pull(
        // fetch messages by `userId` which link to a blob
        sbot.links({ source: userId, dest: '&', values: true }),

        pull.collect(function (err, log) {
            if (err) throw err;

            log.forEach(function(msg) {
                pull(
                    sbot.blobs.get(msg.dest),
                    toPull.sink(fs.createWriteStream(exportDir + "/" + msg.dest))
                );
            });

            sbot.close();
        }));
}

var userId = process.argv[2];
var exportDir = process.argv[3];

if (!require('ssb-ref').isFeed(userId)) {
    console.error('Usage: export-data.js --feedid {feedid} {exportDir}');
    process.exit(1);
}

require('ssb-client')(function (err, sbot) {
    if (err) throw err;

    ensureDirExists(exportDir, function() { exportFeed(userId, exportDir, sbot); });
});
