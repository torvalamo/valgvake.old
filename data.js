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
        {code: '01', fetch: null},
        {code: '02', fetch: null},
        {code: '03', fetch: null},
        {code: '04', fetch: null},
        {code: '05', fetch: null},
        {code: '06', fetch: null},
        {code: '07', fetch: null},
        {code: '08', fetch: null},
        {code: '09', fetch: null},
        {code: '10', fetch: null},
        {code: '11', fetch: null},
        {code: '12', fetch: null},
        {code: '14', fetch: null},
        {code: '15', fetch: null},
        {code: '16', fetch: null},
        {code: '17', fetch: null},
        {code: '18', fetch: null},
        {code: '19', fetch: null},
        {code: '20', fetch: null},
    ]
};

process.on('uncaughtException', (e) => {
    data.error = e.message;
});

exports.request = function getNational(repeat, delay) {
    getPath('/api/2017/st', (obj) => {
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
        data.total.counts.mandates = p.mandater ? p.mandater.resultat.antall : 0;
        
        // Own percentage calculation for more decimals
        var votes = obj.partier.reduce((sum, p) => {
            if (p.id.partikode == 'BLANKE') return sum;
            return sum + p.stemmer.resultat.antall.total;
        }, 0) || 1;
        
        data.total.counts.percentage = p.stemmer.resultat.antall.total / votes;
        
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
        c.counts.mandates = p.mandater ? p.mandater.resultat.antall : 0;
        
        // Own percentage calculation for more decimals
        var votes = obj.partier.reduce((sum, p) => {
            if (p.id.partikode == 'BLANKE') return sum;
            return sum + p.stemmer.resultat.antall.total;
        }, 0) || 1;
        
        c.counts.percentage = p.stemmer.resultat.antall.total / votes;
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
            }
        });
        msg.on('close', () => {
            repeat && setTimeout(() => request(repeat, delay), delay || 60000);
        });
    }).end();
}