const express = require('express');
const Server = express();
const randomBytes = require('random-bytes');
const path = require('path');
const request = require('request');
const helpers = require('./Helpers');
const cors = require('cors');
const bodyParser = require('body-parser');

var jsonParser = bodyParser.json()
 
// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: true })

// Connect
const MongoClient = require('mongodb').MongoClient;

let cache;

var PORT = Server.listen(process.env.PORT || 3000);

Server.use(cors());

const uri = "mongodb+srv://speed-test:HVtzKxBiJOrcNfAK@cluster0.grf7r.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true });

async function findUsers(clientIp) { 
    await client.connect();

    const cursor = client
        .db('speed')
        .collection('user')
        .find({clientIp: clientIp})
        .limit(7);
    const results = await cursor.toArray();
    if (results.length > 0) {
        console.log(results)
        return results;
    }
    client.close();   
}

async function shareUsers(idShare) { 
    var ObjectId = require('mongodb').ObjectId; 
    await client.connect();
    const cursor = client
        .db('speed')
        .collection('user')
        .find({_id: ObjectId(idShare)});

    const results = await cursor.toArray();
    if (results.length > 0) {
        return results;
    }
    client.close();   
}

async function saveUsers(myTest) { 
    await client.connect();

    const collection = client
        .db('speed')
        .collection('user');

    console.log(myTest.clientIp)
    ipClient = myTest.clientIp.split(" - ")
    myTest.data = new Date();
    if(myTest.dlStatus <= 1){
        myTest.status = "Bad";
    } else if(myTest.dlStatus > 1 && myTest.dlStatus <= 5){
        myTest.status = "Ok";
    } else if(myTest.dlStatus > 5 && myTest.dlStatus <= 20){
        myTest.status = "Good";
    } else if(myTest.dlStatus > 20){ 
        myTest.status = "Awesome";
    }
    myTest.clientIp = ipClient[0];
    myTest.provider = ipClient[1];
    myTest.city = ipClient[2];
    myTest.country = ipClient[3];

    collection.insertOne(myTest, function (err, r) {
        if (err) {
            console.log("cannot add obj");
            return;
        }
        console.log("Added a user");
    });

    
    client.close();   
}

Server.post('/saveUsers', urlencodedParser, function (req, res) {
    saveUsers(req.body).catch(console.error);
    res.redirect("/");
});

Server.get('/listUsers/:id', urlencodedParser, function (req, res) {
    findUsers(req.params.id)
        .then(data => res.json({data}))
        .catch(error => res.status(404).json({data: "null"}));
});

Server.get('/shareNet/:id', urlencodedParser, function (req, res) {
    shareUsers(req.params.id)
        .then(data => res.json({data}))
        .catch(error => res.status(404).json({data: "null"}));
});

Server.get('/share/:id', urlencodedParser, function (req, res) {
    res.sendFile(path.resolve(__dirname, 'public/share.html'));
});

Server.get('/empty', function (req, res) {
  res.status(200).send('');
});

Server.post('/empty', function (req, res) {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    res.set("Cache-Control", "post-check=0, pre-check=0");
    res.set("Pragma", "no-cache");
    res.status(200).send('');
});

Server.get('/garbage', function (req, res) {
    res.set('Content-Description', 'File Transfer');
    res.set('Content-Type', 'application/octet-stream');
    res.set('Content-Disposition', 'attachment; filename=random.dat');
    res.set('Content-Transfer-Encoding', 'binary');
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.set('Cache-Control', 'post-check=0, pre-check=0', false);
    res.set('Pragma', 'no-cache');
    const requestedSize = (req.query.ckSize || 100);

    const send = () => {
        for (let i = 0; i < requestedSize; i++)
            res.write(cache);
        res.end();
    }

    if (cache) {
        send();
    } else {
        randomBytes(1048576, (error, bytes) => {
            cache = bytes;
            send();
        });
    }

});

Server.get('/getIP', function (req, res) {
    let requestIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.headers['HTTP_CLIENT_IP'] || req.headers['X-Real-IP'] || req.headers['HTTP_X_FORWARDED_FOR'];
    if (requestIP.substr(0, 7) === "::ffff:") {
        requestIP = requestIP.substr(7)
    }
    request('https://ipinfo.io/' + requestIP + '/json', function (err, body, ipData) {
        ipData = JSON.parse(ipData);
        if (err) res.json(requestIP);
        console.log(`${requestIP} - ${ipData.org} - ${ipData.city} - ${ipData.country}`)
        res.json(`${requestIP} - ${ipData.org} - ${ipData.city} - ${ipData.country}`);
    });
});

Server.use(express.static(path.join(__dirname, 'public')));


Server.listen(PORT, function () {
    console.log('SpeedTest server -> Rodando...');
});
