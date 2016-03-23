#!/usr/bin/env node

var fs = require('fs');
var pull = require('pull-stream');
var toPull = require('stream-to-pull-stream');
var sanitize = require("sanitize-filename");
var mlib = require('ssb-msgs');
var ref = require('ssb-ref');

function ensureDirExists(exportDir, cb)
{
    if (!fs.existsSync(exportDir)) {
        fs.mkdir(exportDir, function(err){
            if (err) throw err;

            cb();
        });
    } else
        cb();
}

var blobQueue = [];

function consumeBlobQueue(sbot, exportDir, cb)
{
    if (blobQueue.length > 0) {
        var link = blobQueue.pop();
        console.log(link);
        pull(
            sbot.blobs.get(link),
            toPull.sink(fs.createWriteStream(exportDir + "/" + sanitize(link)))
        , function() { consumeBlobQueue(sbot, exportDir, cb); }
        );
    } else
        cb();
}

function queueBlobs(obj, rel) {
    if (ref.type(obj.link) == 'blob')
        blobQueue.push(obj.link);
}

function exportFeed(feedId, exportDir, sbot) {
    pull(
        sbot.createUserStream({ id: feedId }),
        pull.collect((err, log) => {
            if (err) throw err;

            log.forEach(msg => {
                mlib.indexLinks(msg.value.content, (obj, rel) => queueBlobs(obj, rel));
            });

            consumeBlobQueue(sbot, exportDir, () => {
                fs.writeFile(exportDir + "/messages.txt", JSON.stringify(log));
                sbot.close();
            });
        })
    );
}

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

        if (!ref.isFeed(feedId)) {
            console.error('Invalid public key: ' + feedId);
            process.exit(1);
        }

        if (exportDir != "")
            ensureDirExists(exportDir, function() { exportFeed(feedId, exportDir, sbot); });
        else
            exportFeed(feedId, exportDir, sbot);
    });
});
