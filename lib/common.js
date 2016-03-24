var fs = require('fs');

module.exports = {
    ensureDirExists: function(exportDir, cb)
    {
        if (!fs.existsSync(exportDir)) {
            fs.mkdir(exportDir, function(err){
                if (err) throw err;

                cb();
            });
        } else
            cb();
    }
};

