# ssb-exporter

Feed and blob exporter/importer for [scuttlebutt](https://github.com/ssbc/scuttlebot)

Exports your whole feed and corresponding blobs to a directory.
Or import / sync a local folder of messages and blobs.

Consists of the following files:
 - export-data.js: exports your feed or a feed of your choice to a directory
 - import-data.js: syncs a feed with a local folder, importing missing messages and blobs
 - extract-mirrors.js: looks through your friends trying to find mirrors
 - sync-mirrors.js: Uses extract-mirrors to find mirrors, followed by syncing all feeds locally

Work in progress for [static feeds](https://github.com/ssbc/scuttlebot/issues/303)
