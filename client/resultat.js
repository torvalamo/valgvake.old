angular
    .module('resApp', [])
    .controller('ResultatCtr', ['$scope', '$http',
                                function($scope, $http) {
        $scope.fetch = {};
        $scope.fy = [];
        $scope.ko = [];
		$scope.municipals = [];
        function fetch() {
            $scope.fetch.status = 0;
            console.log('Henter data..')
            $http
                .get('data.json')
                .then(function(res) {
                    $scope.fy = res.data.fy;
					$scope.ko = res.data.ko;
					$scope.municipals = res.data.municipals;
                    var d = new Date();
                    d.setTime(Date.parse(res.data.fy.fetch));
                    $scope.fetch = {
                        time: d,
                        status: 1
                    };
                    $scope.error = res.data.error;
                    if ($scope.error) {
                        $scope.fetch.status = -1;
                        console.log(res.data.error);
                    }
            		setTimeout(fetch, 60000);
            });
        };
        fetch();
                                    
        function setActiveCounty(code) {
			if ($scope.activeCounty == code) {
				$scope.activeCounty == null;
				cookie('activeCounty', null);
				$scope.filterMuni = {};
				console.log("unset active county:", $scope.activeCounty);
			} else {
				$scope.activeCounty = code;
				cookie('activeCounty', code);
				$scope.filterMuni = { county: code };
			}
        }
        $scope.setActiveCounty = setActiveCounty;
		$scope.activeCounty = cookie('activeCounty');
		$scope.filterMuni = {};
                                    
        function setFyOrderTerm(field, reverse) {
            if ($scope.fyOrderBy == field) {
                $scope.fyOrderReverse = !$scope.fyOrderReverse;
			} else {
            	$scope.fyOrderReverse = !!reverse;
			}
            $scope.fyOrderBy = field;
            cookie('fyOrderBy', field);
            cookie('fyOrderReverse', $scope.fyOrderReverse ? 1 : null);
        }
									
        $scope.setFyOrderTerm = setFyOrderTerm;
        $scope.fyOrderBy = cookie('fyOrderBy') || 'name';
        $scope.fyOrderReverse = !!cookie('fyOrderReverse');
                                    
        function setKoOrderTerm(field, reverse) {
            if ($scope.koOrderBy == field) {
                $scope.koOrderReverse = !$scope.koOrderReverse;
			} else {
            	$scope.koOrderReverse = !!reverse;
			}
            $scope.koOrderBy = field;
            cookie('koOrderBy', field);
            cookie('koOrderReverse', $scope.koOrderReverse ? 1 : null);
        }
									
        $scope.setKoOrderTerm = setKoOrderTerm;
        $scope.koOrderBy = cookie('koOrderBy') || 'name';
        $scope.koOrderReverse = !!cookie('koOrderReverse');
    }]);