import { select, selectAll } from 'd3-selection';
import { json, request } from 'd3-request';

let count = 0;
let selected = null;
let id = null;
let defaultSelection = null;

function transform(t) {

    return t.replace(/\n/g, '<br/>');
}

function done() {
    if (id == null) throw new Error('no-id');

    count++;
    select('#count').text(`${count} done`);

    request('/api/classify')
        .header('Content-Type', 'application/json')
        .post(
            JSON.stringify({ id: id, classification: selected }),
            function (err, rawData){
                if (err) console.error('Failed to classify.', err);
                next();
            }
        );
}

function load() {
    return loadData('/api/next')
        .then(d => {
            let t = transform(d.text);
            if (t.length === 0) {
                console.log(d.id, 'was empty');
            }
            return { id: d.id, text: t };
        });
}

function issue() {
    request('/api/classify')
        .header('Content-Type', 'application/json')
        .post(
            JSON.stringify({ id: id, classification: 'issue' }),
            function (err, rawData){
                if (err) throw new Error('Failed: ' + rawData);
                next();
            }
        );
}

function next() {
    selected = defaultSelection;
    id = null;
    select('#classify').selectAll('button').classed('rs-btn--selected', d => d === selected);

    load()
        .then(d => {
            id = d.id;
            select('#text').html(d.text);
        })
        .catch(e => console.error(e));
}

const loadData = (url) => new Promise((ok, ko) => json(url, (err, data) => err == null ? ok(data) : ko(err)));


let classifications = loadData('/api/classifications');

document.addEventListener('DOMContentLoaded', () => {
    classifications.then(d => {
        defaultSelection = d[0];
        selected = defaultSelection;
        let options = select('#classify').selectAll('button').data(d);
        options = options.enter().append('button').merge(options);

        options
            .text(d => d)
            .attr('class', 'rs-btn--blue')
            .classed('rs-btn--selected', d => d === selected)
            .on('click', function (c) {
                options.classed('rs-btn--selected', d => d === c);
                selected = c;
            });
    });

    next();
    select('#done').on('click', done);
    select('#skip').on('click', issue);
});