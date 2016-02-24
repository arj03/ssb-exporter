#!/usr/bin/env node

var fs = require('fs');
var pull = require('pull-stream');
var toPull = require('stream-to-pull-stream');

function exportFeed(userId, sbot) {
    // load data
    pull(sbot.createUserStream({ id: userId }), pull.collect(function (err, log) {
        if (err) throw err;

        var messages = "";
        log.forEach(function(msg) {
            messages += JSON.stringify(msg) + "\n";
        });

        fs.writeFile("messages.txt", messages);
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
                    toPull.sink(fs.createWriteStream(msg.dest))
                );
            });
        }));
}

var argv = require('minimist')(process.argv.slice(2));
var userId = argv._[0];

if (!require('ssb-ref').isFeed(userId)) {
    console.error('Usage: export-data.js {feedid}');
    process.exit(1);
}

require('ssb-client')(function (err, sbot) {
    if (err) throw err;

    exportFeed(userId, sbot);
});
