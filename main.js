'use strict'

var ArgumentParser = require('argparse').ArgumentParser;
var pck = require('./package.json');
var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');

var parser = new ArgumentParser({
  version: pck.version,
  addHelp: true,
  description: 'Help A Brother Out'
});

parser.addArgument(
  [ '-c', '--classify' ],
  {
    action: 'append',
    help: 'Specify classification option',
    required: true
  }
);

parser.addArgument(
  [ '-d', '--data' ],
  {
    help: 'Data directory to select from',
    required: true
  }
);

parser.addArgument(
  [ '-o', '--output' ],
  {
    help: 'Output directory to write to',
    required: true
  }    
);

function classify(id, classification) {
    if (id == null) throw new Error('no-id');

    console.log(id, classification);
    
    return { state: 'ok' };
}

var args = parser.parseArgs();

let data = null;

fs.readdir(args.data, function(err, items) {
    if (err) throw new Error(err);
    console.log(items.length, 'files');
    
    data = items;
});

function next() {
    let id = data[Math.floor(Math.random() * data.length)];
    var obj = JSON.parse(fs.readFileSync(`${args.data}/${id}`, 'utf8'));
    return { id: id, text: obj.textBody };
}

var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var router = express.Router(); 

router.get('/classifications', function (req, res) {
  res.json(args.classify);   
});

router.get('/next', function (req, res) {
  res.json(next());   
});

router.post('/classify', function (req, res) {
  res.json(classify(req.body.id, req.body.classification));   
});

app.use('/api', router);
app.use(express.static(__dirname + '/distribution'));
app.get('/', function(req, res) {
  res.sendfile(__dirname + '/distribution/index.html');
});

var port = process.env.PORT || 3000;
app.listen(port);

console.log('Listening on port', port);