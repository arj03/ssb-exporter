#!/usr/bin/env node

var fs = require('fs');
var http = require('http');
var shttp = require('socks5-http-client');
var url = require('url');
var path = require('path');

var sanitize = require("sanitize-filename");

var userMirrors = { '@6CAxOI3f+LUOVrbAl0IemqiS7ATpQvr9Mdw9LC4+Uv0=.ed25519': ['http://26thfiwfn3i3wnrf.onion/ssb/messages.txt'] };

function writeFile(filename, res)
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
        }
    });
}

for (var user in userMirrors)
{
    userMirrors[user].forEach(mirror => {
        var options = url.parse(mirror);

        var filename = path.basename(options.pathname);

        var stats = null;
        try {
            stats = fs.statSync(filename);
            options.headers = {'If-Modified-Since': stats.mtime.toUTCString() };
        } catch(err) {
            //console.log("stat error:" + filename + ", error:" + err);
        }

        if (mirror.indexOf(".onion/") != -1) {
            options.socksPort = 9050; // tor default port

            shttp.get(options, res => writeFile(filename, res));
        }
        else
        {
            http.get(options, res => writeFile(filename, res));
        }
    });
}
