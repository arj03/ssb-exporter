#!/usr/bin/env node

var pull = require('pull-stream');
var toPull = require('stream-to-pull-stream');

function checkEnd(runningStreams, sbot, callback)
{
    setTimeout(function () {
        if (runningStreams.length == 0) {
            sbot.close();
            console.log("done searching for mirrors");
            callback();
        } else {
            console.log("not done yet, outstanding: " + runningStreams.length);
            checkEnd(runningStreams, sbot, callback);
        }
    }, 200);
}

function getFriends(sbot, callback)
{
    var userMirrors = {};
    var runningStreams = [];

    pull(
        sbot.friends.createFriendStream({meta: true, hops: 1}),
        pull.collect(function (err, log) {
            if (err) throw err;

            runningStreams.push(1);

            log.forEach(function(friend) {
                if (friend.hops == 1) {
                    console.log("Checking friend: " + friend.id);
                    runningStreams.push(friend.id);
                    pull(
                        sbot.createUserStream({ id: friend.id, keys: false }),
                        pull.collect(function (err, msgs) {
                            if (err) throw err;

                            msgs.forEach(function(msg) {
                                if (msg.content.type == "about") {
                                    if (msg.content.mirror)
                                    {
                                        if (friend.id in userMirrors)
                                            userMirrors[friend.id].push(msg.content.mirror);
                                        else
                                            userMirrors[friend.id] = [msg.content.mirror];
                                    }
                                }
                            });

                            runningStreams.pop();
                        })
                    );
                }
            });

            runningStreams.pop();
        })
    );

    checkEnd(runningStreams, sbot, function() { callback(userMirrors); });
}

require('ssb-client')(function (err, sbot) {
    if (err) throw err;

    getFriends(sbot, function(userMirrors) {
        for (var friendId in userMirrors)
             console.log("got mirrors", userMirrors[friendId], " for", friendId);
    });
});
