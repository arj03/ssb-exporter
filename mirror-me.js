#!/usr/bin/env node

var fs = require('fs');
var pull = require('pull-stream');
var toPull = require('stream-to-pull-stream');

var common = require('./lib/common');
var exportData = require('./lib/export-data');

require('ssb-client')((err, sbot) => {
    if (err) throw err;

    sbot.whoami((err, my) => {
        if (err) throw err;

        var defaultConfig = {
            url: "http://localhost/",
            localFolder: "/home/arj/dev/ssb-exporter/",
            magicPhrase: "mirror me, please",
            repliedToMessages: {},
            feedsToExport: {}
        };

        var config = defaultConfig;

        try {
            var localConfig = JSON.parse(fs.readFileSync("config.json"));

            for (var key in localConfig)
                config[key] = localConfig[key];
        } catch (e) {
            console.log("Error reading config.json:", e);
        }

        console.log("Current config:");
        console.log(config);

        pull(
            sbot.createFeedStream(),
            pull.collect((err, log) => {
                if (err) throw err;

                log.forEach(msg => {
                    if (typeof msg.value.content == "string")
                    {
                        if (msg.key in config.repliedToMessages)
                            return;

                        sbot.private.unbox(msg.value.content, (err, decrypted) => {
                            if (decrypted && decrypted.text == config.magicPhrase)
                            {
                                console.log("got mirror request");

                                var mirror = config.url + msg.value.author;

                                var reply = "Mirrored your feed at " + mirror;

                                var exportDir = config.localFolder + msg.value.author;
                                common.ensureDirExists(exportDir, function() { exportData.exportFeed(msg.value.author, exportDir, sbot); });

                                sbot.private.publish({type: 'post', root: msg.key, text: reply }, [msg.value.author, my.id], () => {});

                                config.repliedToMessages[msg.key] = 1;
                                config.feedsToExport[msg.value.author] = 1;

                                fs.writeFileSync("config.json", JSON.stringify(config));

                                sbot.publish({ type: 'about', about: msg.value.author, mirror: mirror });
                            }
                        });
                    }
                });
            })
        );
    });
});
