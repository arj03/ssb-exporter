var fs = require('fs');
var pull = require('pull-stream');
var toPull = require('stream-to-pull-stream');
var sanitize = require("sanitize-filename");
var mlib = require('ssb-msgs');
var ref = require('ssb-ref');

var self = module.exports = {

    popAndcheckEnd: function(insertedMessages, sbot, cb)
    {
        insertedMessages.pop();

        if (insertedMessages.length == 0 && cb != null)
            cb();
    },

    importFeed: function(exportDir, sbot, cb) {
        var messages = JSON.parse(fs.readFileSync(exportDir + "/messages.txt"));
        var userId = messages[0]['value'].author;
        console.log("importing:", userId);
        sbot.latestSequence(userId, function (err, seq) {
            var latestLocalSeq = "";
            if (!err)
                latestLocalSeq = seq.sequence;
            else if (err && err.name != 'NotFoundError')
                throw err;

            console.log("latest seq:" + latestLocalSeq);
            var insertedMessages = [];
            messages.forEach(msg => {
                if (msg['value'].sequence > latestLocalSeq) {
                    console.log("new message with id: " + msg['value'].sequence);
                    insertedMessages.push(msg['value']);

                    sbot.add(msg['value'], function(err) {
                        if (err) throw err;

                        self.popAndcheckEnd(insertedMessages, sbot, cb);
                    });

                    mlib.indexLinks(msg.value.content, (obj, rel) => {
                        if (ref.type(obj.link) != 'blob')
                            return;

                        insertedMessages.push("blob");
                        pull(
                            toPull.source(fs.createReadStream(exportDir + "/" + sanitize(obj.link))),
                            sbot.blobs.add(function (err, hash) {
                                if (err) throw err;

                                self.popAndcheckEnd(insertedMessages, sbot, cb);
                            })
                        );
                    });
                }
            });

            self.popAndcheckEnd(insertedMessages, sbot, cb);
        });
    }
};
