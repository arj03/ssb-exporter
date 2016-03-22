#!/usr/bin/env node

var fs = require('fs');
var pull = require('pull-stream');
var toPull = require('stream-to-pull-stream');
var sanitize = require("sanitize-filename");
var mlib = require('ssb-msgs');
var ref = require('ssb-ref');

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

var blobQueue = [];

function consumeBlobQueue(sbot, cb)
{
    if (blobQueue.length > 0) {
        var link = blobQueue.pop();
        console.log(link);
        pull(
            sbot.blobs.get(link),
            toPull.sink(fs.createWriteStream(exportDir + "/" + sanitize(link)))
        , function() { consumeBlobQueue(sbot, cb); }
        );
    } else
        cb();
}

function queueBlobs(obj, rel) {
    if (ref.type(obj.link) == 'blob')
        blobQueue.push(obj.link);
}

function exportFeed(userId, exportDir, sbot) {
    pull(
        sbot.createUserStream({ id: userId }),
        pull.collect((err, log) => {
            if (err) throw err;

            log.forEach(msg => {
                mlib.indexLinks(msg.value.content, (obj, rel) => queueBlobs(obj, rel));
            });

            consumeBlobQueue(sbot, () => {
                fs.writeFile(exportDir + "/messages.txt", JSON.stringify(log));
                sbot.close();
            });
        })
    );
}

var userId = process.argv[2];
var exportDir = process.argv[3];

if (!ref.isFeed(userId)) {
    console.error('Usage: export-data.js --feedid {feedid} {exportDir}');
    process.exit(1);
}

require('ssb-client')((err, sbot) => {
    if (err) throw err;

    ensureDirExists(exportDir, function() { exportFeed(userId, exportDir, sbot); });
});
