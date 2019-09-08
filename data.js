const http = require('https');
const vm = require('vm');

const PARTIKODE = 'LIBS';

const data = exports.data = {
    fetch: null,
    total: {
        counted: {
            votes: 0,
            earlyVotes: 0,
            percentage: null
        },
        counts: {
            votes: 0,
            earlyVotes: 0,
            percentage: null
        }
    },
    counties: [
        {code: '03', fetch: null},
        {code: '11', fetch: null},
        {code: '15', fetch: null},
        {code: '18', fetch: null},
        {code: '30', fetch: null},
        {code: '34', fetch: null},
        {code: '38', fetch: null},
        {code: '42', fetch: null},
        {code: '46', fetch: null},
        {code: '50', fetch: null},
        {code: '54', fetch: null}
    ]
};
const municipal = exports.municipal = {};

process.on('uncaughtException', (e) => {
    data.error = e.message;
});

exports.request = function getNational(repeat, delay) {
    getPath('/api/2019/fy', (obj) => {
        data.fetch = obj.tidspunkt.rapportGenerert;
        
        data.total.counted.votes = obj.stemmer.total;
        data.total.counted.earlyVotes = obj.stemmer.fhs;
        data.total.counted.percentage = obj.opptalt.prosent;
        data.total.counted.mandates = obj.mandater.antall;
        
        var p = obj.partier.filter((p) => {
            return p.id.partikode == PARTIKODE;
        }).pop();
        
        data.total.counts.votes = p.stemmer.resultat.antall.total;
        data.total.counts.earlyVotes = p.stemmer.resultat.antall.fhs;
        data.total.counts.percentage = p.stemmer.resultat.prosent || 0;
        data.total.counts.mandates = p.mandater ? (p.mandater.resultat ? p.mandater.resultat.antall : p.mandater.prognose.antall) : 0;
        
        // Own percentage calculation for more decimals
        var votes = obj.partier.reduce((sum, p) => {
            if (p.id.partikode == 'BLANKE') return sum;
            return sum + p.stemmer.resultat.antall.total;
        }, 0);
        
        data.total.counts.percentage = (p.stemmer.resultat.antall.total / votes) * 100;
        
        console.log('TOTAL', votes, p.stemmer.resultat.antall.total, data.total.counts.percentage);
        
        // Check counties for updates
        data.counties.forEach((c, i) => {
            var l = obj._links.related.filter((l) => {
                return c.code == l.nr;
            }).pop();
            if (l.rapportGenerert != c.fetch) {
                getCounty(c.code);
            }
        });
        
        repeat && setTimeout(() => getNational(repeat, delay), delay || 60000);
    });
}

function getCounty(nr) {
    getPath('/api/2017/st/' + nr, (obj) => {
        var c = data.counties.filter((c) => {
            return c.code == obj.id.nr;
        }).pop();
        
        c.fetch = obj.tidspunkt.rapportGenerert;
        
        c.code = obj.id.nr;
        c.name = obj.id.navn;
        
        c.counted = {};
        c.counted.votes = obj.stemmer.total;
        c.counted.earlyVotes = obj.stemmer.fhs;
        c.counted.percentage = obj.opptalt.prosent;
        c.counted.mandates = obj.mandater.antall;
        
        var p = obj.partier.filter((p) => {
            return p.id.partikode == PARTIKODE;
        }).pop();
        
        c.counts = {};
        c.counts.votes = p.stemmer.resultat.antall.total;
        c.counts.earlyVotes = p.stemmer.resultat.antall.fhs;
        c.counts.percentage = p.stemmer.resultat.prosent || 0;
        c.counts.mandates = p.mandater ? (p.mandater.resultat ? p.mandater.resultat.antall : p.mandater.prognose.antall) : 0;
        
        // Own percentage calculation for more decimals
        var votes = obj.partier.reduce((sum, p) => {
            if (p.id.partikode == 'BLANKE') return sum;
            return sum + p.stemmer.resultat.antall.total;
        }, 0);
        
        c.counts.percentage = (p.stemmer.resultat.antall.total / votes) * 100;
        
        obj._links.related.forEach((r) => {
            getMunicipal(c.code, r.nr);
        });
    });
}

function getMunicipal(county, nr) {
    getPath('/api/2017/st/' + county + '/' + nr, (obj) => {
        var p = obj.partier.filter((p) => {
            return p.id.partikode == PARTIKODE;
        }).pop();
        
        // Own percentage calculation for more decimals
        var votes = obj.partier.reduce((sum, p) => {
            if (p.id.partikode == 'BLANKE') return sum;
            return sum + p.stemmer.resultat.antall.total;
        }, 0);
        
        municipal[nr] = {
            county: obj._links.up.navn,
            code: obj.id.nr,
            name: obj.id.navn,
            counts: {
                votes: p.stemmer.resultat.antall.total,
                earlyVotes: p.stemmer.resultat.antall.fhs,
                percentage: (p.stemmer.resultat.antall.total / votes) * 100
            }
        };
    });
}

function getPath(path, cb) {
    http.request({
        protocol: 'https:',
        hostname: 'valgresultat.no',
        port: 443,
        path: path,
        method: 'GET'
    }, (msg) => {
        msg.setEncoding('utf8');
        var raw = '';
        msg.on('data', (chunk) => {
            raw += chunk;
        });
        msg.on('end', () => {
            try {
                cb(JSON.parse(raw));
            } catch(e) {
                data.error = e.message;
                console.log(e);
            }
        });
        msg.on('close', () => {
            repeat && setTimeout(() => request(repeat, delay), delay || 60000);
        });
    }).end();
}