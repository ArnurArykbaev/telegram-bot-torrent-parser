const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const URL = require('url').URL

function download(url, callback) {
    
    const userURL = new URL(url)
    const requestCaller = userURL.protocol === 'http:' ? http : https

    const filename = path.basename(url);

    const req = requestCaller.get(url, function (res) {
        const fileStream = fs.createWriteStream(filename);
        res.pipe(fileStream);

        fileStream.on('error', function(err) {
            console.log('Error from stream');
            console.log(err)
        });

        fileStream.on('close', function() {
            callback(filename);
        });

        fileStream.on('finish', function() {
            fileStream.close();
            // console.log('Done');
        })
    });

    req.on('error', function(err) {
        console.log('Error downloading the file');
        console.log(err);
    });
}

module.exports.download = download;