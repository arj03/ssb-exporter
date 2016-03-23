#!/usr/bin/env node

var pull = require('pull-stream');
var toPull = require('stream-to-pull-stream');

var friendsLeft = 0;

function friendDone(friendId, sbot, cb)
{
    console.log("done checking friend: " + friendId);
    friendsLeft -= 1;
    if (friendsLeft == 0)
    {
        sbot.close();
        console.log("done searching for mirrors");
        cb();
    }
}

function getFriends(sbot, cb)
{
    var userMirrors = {};

    pull(
        sbot.friends.createFriendStream({meta: true, hops: 1}),
        pull.collect(function (err, log) {
            if (err) throw err;

            friendsLeft = log.filter(l => l.hops == 1).length;

            log.forEach(function(friend) {
                if (friend.hops == 1) {
                    console.log("Checking friend: " + friend.id);
                    userMirrors[friend.id] = [];
                    pull(
                        sbot.createUserStream({ id: friend.id, keys: false }),
                        pull.collect(function (err, msgs) {
                            if (err) throw err;

                            msgs.forEach(msg => {
                                if (msg.content.type == "about" && msg.content.mirror)
                                    userMirrors[friend.id].push(msg.content.mirror);
                            });

                            friendDone(friend.id, sbot, () => cb(userMirrors));
                        })
                    );
                }
            });
        })
    );
}

require('ssb-client')((err, sbot) => {
    if (err) throw err;

    getFriends(sbot, userMirrors => {
        for (var friendId in userMirrors)
            if (userMirrors[friendId].length > 0)
                console.log("got mirrors", userMirrors[friendId], " for", friendId);
    });
});
