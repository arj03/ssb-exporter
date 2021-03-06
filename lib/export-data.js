var fs = require('fs');
var pull = require('pull-stream');
var toPull = require('stream-to-pull-stream');
var sanitize = require("sanitize-filename");
var mlib = require('ssb-msgs');
var ref = require('ssb-ref');
var path = require('path');

var self = module.exports = {
    blobQueue: [],

    consumeBlobQueue: function(sbot, exportDir, cb)
    {
        if (self.blobQueue.length > 0) {
            var link = self.blobQueue.pop();
            console.log(link);
            pull(
                sbot.blobs.get(link),
                toPull.sink(fs.createWriteStream(path.join(exportDir, sanitize(link))))
            , function() { self.consumeBlobQueue(sbot, exportDir, cb); }
            );
        } else
            cb();
    },

    queueBlobs: function(obj, rel) {
        if (ref.type(obj.link) == 'blob')
            self.blobQueue.push(obj.link);
    },

    exportFeed: function(feedId, exportDir, sbot) {
        pull(
            sbot.createUserStream({ id: feedId }),
            pull.collect((err, log) => {
                if (err) throw err;

                log.forEach(msg => {
                    mlib.indexLinks(msg.value.content, (obj, rel) => self.queueBlobs(obj, rel));
                });

                self.consumeBlobQueue(sbot, exportDir, () => {
                  fs.writeFile(path.join(exportDir, "messages.txt"), JSON.stringify(log), () => {
                    console.log('Done!')
                  })
                    sbot.close();
                });
            })
        );
    }
};
