#!/usr/bin/env node

var fs = require('fs');
var http = require('http');
var shttp = require('socks5-http-client');
var url = require('url');
var path = require('path');
var ref = require('ssb-ref');

var sanitize = require("sanitize-filename");

var userMirrors = { '@6CAxOI3f+LUOVrbAl0IemqiS7ATpQvr9Mdw9LC4+Uv0=.ed25519': ['http://26thfiwfn3i3wnrf.onion/ssb/messages.txt'] };

function writeFile(filename, res, cb)
{
    var f = null;
    var fd = 0;

    console.log("Downloading file: " + filename + ", got: " + res.statusCode);

    res.on('readable', function() {
        var data = res.read();

        if (data != null) {
            if (f == null) {
                f = fs.createWriteStream(filename);
                f.on('open', function(got_fd) {
                    fd = got_fd;
                });
            }

            f.write(data);
        } else {
            var date = new Date(res.headers["last-modified"]);
            fs.futimesSync(fd, date, date);

            if (cb != null)
                cb();
        }
    });
}

function syncBlobs(remotePath, feedFile, user, userHttp)
{
    var messages = JSON.parse(fs.readFileSync(feedFile));
    messages.forEach(msg => {
        if (msg['value'].content.mentions)
        {
            msg['value'].content.mentions.forEach(o => {
                if (ref.type(o.link) != 'blob')
                    return;

                var blobFilename = sanitize(user) + "/" + sanitize(o.link);

                if (fs.existsSync(blobFilename))
                    return;

                var options = url.parse(remotePath + "/" + sanitize(o.link));
                if (remotePath.indexOf(".onion/") != -1)
                    options.socksPort = 9050; // tor default port

                userHttp.get(options, res => writeFile(blobFilename, res));
            });
        }
    });
}

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

for (var user in userMirrors)
{
    userMirrors[user].forEach(mirror => {
        ensureDirExists(sanitize(user), () => {
            var options = url.parse(mirror);

            var filename = sanitize(user) + "/" + path.basename(options.pathname);

            var stats = null;
            try {
                stats = fs.statSync(filename);
                options.headers = {'If-Modified-Since': stats.mtime.toUTCString() };
            } catch(err) {
                //console.log("stat error:" + filename + ", error:" + err);
            }

            var userHttp = http;

            if (mirror.indexOf(".onion/") != -1)
            {
                options.socksPort = 9050; // tor default port
                userHttp = shttp;
            }

            userHttp.get(options, res => writeFile(filename, res, () => syncBlobs(path.dirname(mirror), filename, user, userHttp)));
        });
    });
}
