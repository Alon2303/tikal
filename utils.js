async function getFile (path) {
    const readFile = require('util').promisify(require('fs').readFile);
    return readFile(path);
}

function reportEvent(eventData) {
    reportLevels  =  ['info','waring','error'];
    if (reportLevels.indexOf(eventData.level) >= reportLevels.indexOf(process.env.REPORT_LEVEL) ) {
        console.log(`[ ${eventData.level} ] ${new Date().toISOString()} ] ${eventData.message}`);
    }
}
module.exports = {
    getFile,reportErr
} 
