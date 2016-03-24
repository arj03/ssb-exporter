var pull = require('pull-stream');
var toPull = require('stream-to-pull-stream');

var self = module.exports = {
    friendsLeft: 0,

    friendDone: function(friendId, sbot, cb)
    {
        console.log("done checking friend: " + friendId);
        self.friendsLeft -= 1;
        if (self.friendsLeft == 0)
        {
            sbot.close();
            console.log("done searching for mirrors");
            cb();
        }
    },

    getMirrorsFromFriends: function(sbot, cb)
    {
        var userMirrors = {};

        pull(
            sbot.friends.createFriendStream({meta: true, hops: 1}),
            pull.collect(function (err, log) {
                if (err) throw err;

                self.friendsLeft = log.filter(l => l.hops == 1).length;

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

                                self.friendDone(friend.id, sbot, () => cb(userMirrors));
                            })
                        );
                    }
                });
            })
        );
    }
};
