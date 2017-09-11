angular
    .module('resApp', [])
    .controller('ResultatCtr', ['$scope', '$http',
                                function($scope, $http) {
        $scope.fetch = {};
        $scope.counties = [];
        $scope.municipal = [];
        $scope.total = {};
        function fetch() {
            $scope.fetch.status = 0;
            console.log('Henter data..')
            $http
                .get('data.json')
                .then(function(res) {
                    $scope.total = res.data.total;
                    $scope.counties = res.data.counties;
                    $scope.municipal = res.data.municipal;
                console.log($scope.municipal);
                    var d = new Date();
                    d.setTime(Date.parse(res.data.fetch));
                    $scope.fetch = {
                        time: d,
                        status: 1
                    };
                    $scope.error = res.data.error;
                    if ($scope.error) {
                        $scope.fetch.status = -1;
                        console.log(res.data.error);
                    }
                /* test data 
                $scope.counties[3].counts.votes = 32400;
                $scope.counties[3].counts.percentage = 43.124;
                $scope.counties[4].counted.votes = 123;
                $scope.total.counts = {
                    votes: 32400,
                    earlyVotes: 1829
                };
                $scope.total.attendance = 2171682;
                $scope.total.counted.votes = 812792;
                */
                    $scope.mostVotes = getMostVotes();
            });
            setTimeout(fetch, 60000);
        };
        fetch();
                                    
        function getMostVotes() {
            var sorted = $scope.counties.sort((a, b) => {
                var v = b.counts.votes - a.counts.votes;
                if (v == 0) return a.name.localeCompare(b.name);
                else return v;
            });
            if (sorted.length) return sorted[0].code;
            else return null;
        }
                                    
        function getTopCounty() {
            if ($scope.topCounty) return $scope.topCounty;
            else return $scope.mostVotes;
        }
        $scope.getTopCounty = getTopCounty;
        function setTopCounty(code) {
            $scope.topCounty = code;
            cookie('topCounty', code);
        }
        $scope.setTopCounty = setTopCounty;
        setTopCounty(cookie('topCounty'));
                                    
        function toggleContext() {
            $scope.context = !$scope.context;
            cookie('context', $scope.context ? 1 : null);
        }
        $scope.toggleContext = toggleContext;
        console.log('setting context', !!cookie('context'));
        $scope.context = !!cookie('context');
                                    
        function setOrderTerm(field, reverse, field2, reverse2) {
            var _field;
            if (field2) {
                _field = [field, field2];
                cookie('orderBy2', field2);
            }
            if (!field2) {
                _field = field;
                cookie('orderBy2', null);
            }
            
            if ($scope.orderBy == field || (field2 && $scope.orderBy.length == 2)) {
                $scope.orderReverse = !$scope.orderReverse;
                cookie('orderReverse', $scope.orderReverse ? 1 : null);
                return;
            }
            $scope.orderBy = _field;
            $scope.orderReverse = !!reverse;
            cookie('orderBy', field);
            cookie('orderReverse', $scope.orderReverse ? 1 : null);
        }
        $scope.setOrderTerm = setOrderTerm;
        $scope.orderBy = cookie('orderBy2') ? [cookie('orderBy'), cookie('orderBy2')] : cookie('orderBy') || 'name';
        $scope.orderReverse = !!cookie('orderReverse');
                                    
        $scope.showMunicipals = false;
    }]);