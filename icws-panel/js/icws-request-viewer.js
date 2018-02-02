(function(){
    var directiveName = 'icwsRequestViewer';

    angular.module('IcwsPanel').directive(directiveName, [function(){
        return {
            restrict: 'E',
            templateUrl: 'icws-request-viewer.html',
            replace: true,
            scope: {
                request: '=',
                entry: '=',
                dark: '='
            },
            controller: ['$scope', function ($scope) {
                $scope.$watch('request', function (request) {
                    $scope.stringifiedRequest = JSON.stringify(request, null, 4);
                    $scope.stringifiedResponse = JSON.stringify(request.responseContent, null, 4);
                });

                $scope.copyRequest = () => {
                    let copyText = document.querySelector('#rawJsonRequest');
                    copyText.select();
                    document.execCommand('copy');
                };

                $scope.copyResponse = () => {
                    let copyText = document.querySelector('#rawJsonResponse');
                    copyText.select();
                    document.execCommand('copy');
                };
            }]
        };
    }]);
})();
