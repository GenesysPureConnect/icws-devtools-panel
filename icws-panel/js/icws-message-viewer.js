(function(){
    let directiveName = 'icwsMessageViewer';

    angular.module('IcwsPanel').directive(directiveName, [function () {
        return {
            restrict: 'E',
            templateUrl: 'templates/icws-message-viewer.html',
            replace: true,
            scope: {
                message: '=',
                dark: '='
            },
            controller: ['$scope', function ($scope) {
                $scope.$watch('message', function (message) {
                    $scope.stringified = JSON.stringify(message, null, 4);
                });

                $scope.copy = () => {
                    let copyText = document.querySelector('#rawJson');
                    copyText.select();
                    document.execCommand('copy');
                };
            }]
        };
    }]);
})();
