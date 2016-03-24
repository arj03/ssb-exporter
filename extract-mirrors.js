#!/usr/bin/env node

var lib = require('./lib/extract-mirrors');

require('ssb-client')((err, sbot) => {
    if (err) throw err;

    lib.getMirrorsFromFriends(sbot, userMirrors => {
        for (var friendId in userMirrors)
            if (userMirrors[friendId].length > 0)
                console.log("got mirrors", userMirrors[friendId], " for", friendId);
    });
});
