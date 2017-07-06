var fs = require('fs');
var ChromeExtension = require('crx');
var archiver = require('archiver');

var crx = new ChromeExtension({
    rootDirectory: './icws-panel/',
    privateKey: fs.readFileSync('./icws-panel.pem')
});

console.log('Packing extension...')
crx.pack()
    .then(function(crxBuffer) {
        console.log('Saving files...');

        exec('rm icws-panel.crx');

        fs.writeFileSync('icws-panel.crx', crxBuffer);
    })

console.log('Archiving package...');

var output = fs.createWriteStream('icws-panel.zip');
var archive = archiver('zip');
archive.pipe(output);
archive.directory('icws-panel/');
archive.finalize();
