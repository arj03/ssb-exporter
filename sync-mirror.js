#!/usr/bin/env node

var common = require('./lib/common');
var lib = require('./lib/sync-mirrors');

var program = require('commander');

program
  .option('-m, --mirror [value]', 'Mirror to sync')
  .option('-e, --export-dir [value]', 'Dir to export mirror to')
  .parse(process.argv);

if (program.mirror == "") {
    console.error('No mirror specified. See --help');
    process.exit(1);
}

var exportDir = program.exportDir || "";

if (exportDir != "")
    common.ensureDirExists(exportDir, function() { lib.syncMirror(program.mirror, exportDir); });
else
    lib.syncMirror(program.mirror, exportDir);
