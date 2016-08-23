'use strict'

var ArgumentParser = require('argparse').ArgumentParser;
var pck = require('./package.json');
var express = require('express');
var bodyParser = require('body-parser');
var cookies = require('cookies').express;
var shortid = require('shortid');
var fs = require('fs');
var fsx = require('fs-extra');

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

let data = null;

function classify(id, classification, who) {
    if (id == null) throw new Error('no-id');

    console.log(id, ',' , who, ',' , classification);
    
    let out = `${args.output}/${classification}`;
    
    fsx.ensureDirSync(out);
    fsx.move(`${args.data}/${id}`, `${out}/${id}`, function (err) {
        if (err) return console.error(err);
    });

    let index = data.indexOf(id);
    if (index > -1) {
        data.splice(index, 1);
    } else {
        console.error('Could not find id in data', id)
    }

    return { state: 'ok' };
}

var args = parser.parseArgs();

fs.readdir(args.data, function(err, items) {
    if (err) throw new Error(err);
    console.log('#', items.length, 'files');
    
    data = items;
});


function excludeThread(t) {
    let m = t.trim();
    
    let pos = m.search(/---[-]*\s*original/i);
    if (pos !== -1) {
        return excludeThread(m.substring(0, pos));
    }

    pos = m.search(/---[-]*\s*forward/i);
    if (pos !== -1) {
        return excludeThread(m.substring(0, pos));
    }

    pos = m.search(/--[-]*boundary/i);
    if (pos !== -1) {
        return excludeThread(m.substring(0, pos));
    }

    pos = m.search(/^\s+$(?:.|\n)*^\s*to:(?:.|\n)+^\s*subject:/mi);
    if (pos !== -1) {
        return excludeThread(m.substring(0, pos));
    }

    return m;
}

function next() {
    let t = '';
    let id = 0;
    
    while (t.length === 0) {
        if (data.length === 0) {
            throw new Error('nothing-to-classify');
        }

        id = data[Math.floor(Math.random() * data.length)];
        
        //id = '728236.1075846106450.JavaMail.evans@thyme';

        var obj = JSON.parse(fs.readFileSync(`${args.data}/${id}`, 'utf8'));
        t = excludeThread(obj.textBody);
        //t = obj.textBody; //excludeThread(obj.textBody);

        if (t.length === 0) {
            classify(id, 'empty');
        }
    }

    return { id: id, text: t };
}

function makeId() {
    return shortid.generate();
}

var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookies());
app.use(function (req, res, next) {
  // check if client sent cookie
  let who = req.cookies.get('who');
  if (who == null || who == '')
  {
    who = makeId();
    res.cookies.set('who', who, { maxAge: 60 * 1000 * 60 * 24 * 7, httpOnly: true });
  }
  next();
});

var router = express.Router(); 

router.get('/classifications', function (req, res) {
  res.json(args.classify);   
});

router.get('/next', function (req, res) {
  res.json(next());   
});

router.post('/classify', function (req, res) {
  res.json(classify(req.body.id, req.body.classification, req.cookies.get('who')));   
});

app.use('/api', router);
app.use(express.static(__dirname + '/distribution'));
app.get('/', function(req, res) {
  res.sendfile(__dirname + '/distribution/index.html');
});

var port = process.env.PORT || 3000;
app.listen(port);

console.log('# Listening on port', port);