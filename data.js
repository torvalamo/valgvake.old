const http = require('https');
const vm = require('vm');

const PARTIKODE = 'LIBS';
const YEAR = '2019';

const data = exports.data = {
    fy: {
		fetch: null,
		update: null,
		all: {
			votes: 0,
			earlyVotes: 0,
			percentage: null,
			mandates: 0
		},
		our: {
			votes: 0,
			earlyVotes: 0,
			percentage: null,
			mandates: 0
		},
		counties: []
	},
    ko: {
		fetch: null,
		update: null,
		all: {
			votes: 0,
			earlyVotes: 0,
			counted: null,
			mandates: 0
		},
		our: {
			votes: 0,
			earlyVotes: 0,
			percentage: null,
			mandates: 0
		},
		municipals: []
	},
	municipals: []
};

process.on('uncaughtException', (e) => {
    data.error = e.message;
});

exports.request = function getNational(repeat, delay) {
    getPath('/api/' + YEAR + '/fy', (obj) => {
        data.fy.fetch = obj.tidspunkt.rapportGenerert;
		data.fy.update = obj.tidspunkt.sisteStemmer;
        
        data.fy.all.votes = obj.stemmer.total;
        data.fy.all.earlyVotes = obj.stemmer.fhs;
        data.fy.all.counted = obj.opptalt.forelopig;
        data.fy.all.mandates = obj.mandater.antall;
        
        var p = obj.partier.filter((p) => {
            return p.id.partikode == PARTIKODE;
        });
		
		if (p.length == 0) return;
		p = p.pop();
        
        data.fy.our.votes = p.stemmer.resultat.antall.total;
        data.fy.our.earlyVotes = p.stemmer.resultat.antall.fhs;
        data.fy.our.percentage = p.stemmer.resultat.prosent || 0;
        data.fy.our.mandates = p.mandater ? (p.mandater.resultat ? p.mandater.resultat.antall : p.mandater.prognose.antall) : 0;
        
		data.fy.counties = [];
		
		// Grab all counties updates
		obj._links.related.forEach( l => {
			data.fy.counties.push( { code: l.nr } );
			getCounty( l.nr );
		});
		
        repeat && setTimeout(() => getNational(repeat, delay), delay || 60000);
    });
	getNational2();
}

function getNational2() {
	getPath('/api/' + YEAR + '/ko', obj => {
        data.ko.fetch = obj.tidspunkt.rapportGenerert;
		data.ko.update = obj.tidspunkt.sisteStemmer;
        
        data.ko.all.votes = obj.stemmer.total;
        data.ko.all.earlyVotes = obj.stemmer.fhs;
        data.ko.all.counted = obj.opptalt.forelopig;
        data.ko.all.mandates = obj.mandater.antall;
        
        var p = obj.partier.filter((p) => {
            return p.id.partikode == PARTIKODE;
        });
		
		if (p.length == 0) return;
		p = p.pop();
        
        data.ko.our.votes = p.stemmer.resultat.antall.total;
        data.ko.our.earlyVotes = p.stemmer.resultat.antall.fhs;
        data.ko.our.percentage = p.stemmer.resultat.prosent || 0;
        data.ko.our.mandates = p.mandater ? ( p.mandater.resultat ? p.mandater.resultat.antall : p.mandater.prognose.antall ) : 0;
        
		data.municipals = [];
		
		// Grab all municipalities updates
		obj._links.related.forEach( l => {
			data.ko.municipals.push( { code: l.nr } );
			getMunicipalCounty( l.nr );
		});
    });
}

function getCounty(nr) {
    getPath('/api/' + YEAR + '/fy/' + nr, (obj) => {
        var c = data.fy.counties.filter( c => {
            return c.code == obj.id.nr;
        }).pop();
        
        c.fetch = obj.tidspunkt.rapportGenerert;
		c.update = obj.tidspunkt.sisteStemmer;
        
        c.name = obj.id.navn;
        
		c.all = {
			votes: obj.stemmer.total,
			earlyVotes: obj.stemmer.fhs,
			counted: obj.opptalt.forelopig,
			mandates: obj.mandater.antall
		};
        
        var p = obj.partier.filter((p) => {
            return p.id.partikode == PARTIKODE;
        });
		
		if (p.length == 0) return;
		p = p.pop();
        
		c.our = {
			votes: p.stemmer.resultat.antall.total,
			earlyVotes: p.stemmer.resultat.antall.fhs,
			percentage: p.stemmer.resultat.prosent || 0,
			mandates: p.mandater ? 
				( p.mandater.resultat ? 
				 	p.mandater.resultat.antall : 
				 	p.mandater.prognose.antall ) : 0,
			nextMandate: p.mandater ? 
				( p.mandater.resultat ? 
				 	p.mandater.resultat.nesteMandat.mandatrang :
				 	p.mandater.prognose.nesteMandat.mandatrang ) : '-'
		};
    });
}

function getMunicipalCounty(code) {
    getPath('/api/' + YEAR + '/ko/' + code, (obj) => {
        var c = data.ko.municipals.filter( c => {
            return c.code == obj.id.nr;
        }).pop();
        
        c.fetch = obj.tidspunkt.rapportGenerert;
		c.update = obj.tidspunkt.sisteStemmer;
        
        c.name = obj.id.navn;
        
		c.all = {
			votes: obj.stemmer.total,
			earlyVotes: obj.stemmer.fhs,
			counted: obj.opptalt.forelopig,
			mandates: obj.mandater.antall
		};
        
        var p = obj.partier.filter((p) => {
            return p.id.partikode == PARTIKODE;
        });
		
		if (p.length == 0) return;
		p = p.pop();
        
		c.our = {
			votes: p.stemmer.resultat.antall.total,
			earlyVotes: p.stemmer.resultat.antall.fhs,
			percentage: p.stemmer.resultat.prosent || 0,
			mandates: p.mandater ? 
				( p.mandater.resultat ? 
				 	p.mandater.resultat.antall : 
				 	p.mandater.prognose.antall ) : 0,
		};
		
		c.municipals = [];
		
        obj._links.related.forEach((r) => {
			c.municipals.push( r.nr );
			data.municipals.push( { code: r.nr, county: c.code } );
            getMunicipal(c.code, r.nr );
        });
    });
}

function getMunicipal(county, nr) {
    getPath('/api/' + YEAR + '/ko/' + county + '/' + nr, (obj) => {
		var m = data.municipals.filter( m => {
			return m.code == nr;
		}).pop();
		
		m.name = obj.id.navn;
		
		m.all = {
			votes: obj.stemmer.total,
			earlyVotes: obj.stemmer.fhs,
			counted: obj.opptalt.forelopig,
			mandates: obj.mandater.antall
		};
		
        var p = obj.partier.filter((p) => {
            return p.id.partikode == PARTIKODE;
        });
		
		if (p.length == 0) return;
		p = p.pop();
		
		m.our = {
			votes: p.stemmer.resultat.antall.total,
			earlyVotes: p.stemmer.resultat.antall.fhs,
			percentage: p.stemmer.resultat.prosent || 0,
			mandates: p.mandater ? 
				( p.mandater.resultat ? 
				 	p.mandater.resultat.antall : 
				 	p.mandater.prognose.antall ) : 0,
			nextMandate: p.mandater ? 
				( p.mandater.resultat ? 
				 	p.mandater.resultat.nesteMandat.mandatrang :
				 	p.mandater.prognose.nesteMandat.mandatrang ) : '-'
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
				//console.log('got...', path);
                cb(JSON.parse(raw));
            } catch(e) {
                data.error = e.message;
                console.log(e);
            }
        });
    }).end();
}