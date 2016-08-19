import { select, selectAll } from 'd3-selection';
import { json, request } from 'd3-request';

let count = 0;
let selected = null;
let id = null;

function transform(t) {

    return t.trim().replace(/\n/g, '<br/>');
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
                if (err) throw new Error('Failed: ' + rawData);
                next();
            }
        );
}

function next() {
    selected = null;
    id = null;
    select('#classify').selectAll('button').classed('rs-btn--selected', false);

    loadData('/api/next')
        .then(d => {
            id = d.id;

            select('#text').html(transform(d.text));
        })
        .catch(e => console.error(e));
}

const loadData = (url) => new Promise((ok, ko) => json(url, (err, data) => err == null ? ok(data) : ko(err)));

let classifications = loadData('/api/classifications');

document.addEventListener('DOMContentLoaded', () => {
    classifications.then(d => {
        let options = select('#classify').selectAll('button').data(d);
        options = options.enter().append('button').merge(options);

        options
            .text(d => d)
            .attr('class', 'rs-btn--blue')
            .on('click', function (c) {
                options.classed('rs-btn--selected', d => d === c);
                selected = c;
            });
    });

    next();
    select('#done').on('click', done);
    select('#skip').on('click', next);
});