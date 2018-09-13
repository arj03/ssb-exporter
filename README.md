# ssb-exporter

Feed and blob exporter/importer for [Scuttlebot](https://github.com/ssbc/scuttlebot). This can be used to create [sneakernets](https://en.wikipedia.org/wiki/Sneakernet).

Exports your whole feed and corresponding blobs to a directory.
Or import / sync a local folder of messages and blobs.

Consists of the following files:
 - export-data.js: exports your feed or a feed of your choice to a directory
 - import-data.js: syncs a feed with a local folder, importing missing messages and blobs
 - extract-mirrors.js: looks through your friends trying to find mirrors
 - sync-mirrors.js: Uses extract-mirrors to find mirrors, followed by syncing all feeds locally

Furthermore this was a playground for alternative ways of mirroring content (static http) through bots.

How do you publish a mirror?

Currently work in progress, but the following command should publish a mirror to your feed:

```
sbot publish --type about --about '<YOUR-FEED-ID>' --mirror '<YOUR-MIRROR>'
```

I published my mirror using:

```
sbot publish --type about --about '@6CAxOI3f+LUOVrbAl0IemqiS7ATpQvr9Mdw9LC4+Uv0=.ed25519' --mirror 'http://26thfiwfn3i3wnrf.onion/ssb/messages.txt'
```

I use the following shell script to sync my feed to my mirror:

```
./export-data.js -e export
rsync -av -e ssh export/ pi:export
```

See also [static feeds](https://github.com/ssbc/scuttlebot/issues/303)
