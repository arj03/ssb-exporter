#!/usr/bin/env node

var fs = require('fs');
var pull = require('pull-stream');
var toPull = require('stream-to-pull-stream');
var sanitize = require("sanitize-filename");

function checkEnd(insertedMessages, sbot)
{
    setTimeout(function () {
        if (insertedMessages.length == 0) {
            sbot.close();
            console.log("done importing feed");
        } else {
            console.log("not done yet, outstanding: " + insertedMessages.length);
            checkEnd(insertedMessages, sbot);
        }
    }, 100);
}

function importFeed(userId, exportDir, sbot) {
    sbot.latestSequence(userId, function (err, seq) {
        var latestLocalSeq = seq.sequence;
        console.log("latest seq:" + latestLocalSeq);
        var messages = JSON.parse(fs.readFileSync(exportDir + "/messages.txt"));
        var insertedMessages = [];
        messages.forEach(function(msg) {
            if (msg['value'].sequence > latestLocalSeq) {
                console.log("new message with id: " + msg['value'].sequence);
                insertedMessages.push(msg['value']);

                sbot.add(msg['value'], function(err) {
                    if (err) throw err;

                    insertedMessages.pop();
                });

                // blobs
                if (msg['value'].content.mentions)
                {
                    msg['value'].content.mentions.forEach(function(o) {
                        var file = fs.readFileSync(exportDir + "/" + sanitize(o.link));
                        insertedMessages.push("blob");
                        sbot.blobs.add(file, function(err) {
                            if (err) throw err;

                            insertedMessages.pop();
                        });
                    });
                }
            }
        });

        checkEnd(insertedMessages, sbot);
    });
}

var userId = process.argv[2];
var exportDir = process.argv[3];

if (!require('ssb-ref').isFeed(userId)) {
    console.error('Usage: import-data.js {feedid} {exportDir}');
    process.exit(1);
}

require('ssb-client')(function (err, sbot) {
    if (err) throw err;

    importFeed(userId, exportDir, sbot);
});
