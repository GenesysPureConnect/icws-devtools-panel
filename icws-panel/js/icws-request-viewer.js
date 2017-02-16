(function(){
    var directiveName = 'icwsRequestViewer';

    angular.module('IcwsPanel').directive(directiveName, [function(){
        return {
            restrict: 'E',
            templateUrl: 'icws-request-viewer.html',
            replace: true,
            scope: {
                request: '='
            },
            controllerAs: 'viewerCtrl',
            controller: function($scope) {
                function getSizeIfAvailable(prop) {
                    const rSize = $scope.request.size;
                    if (rSize && rSize[prop] !== undefined) {
                        return rSize[prop];
                    } else {
                        return 'pending';
                    }
                }

                this.getRequestHeaderSize = () => {
                    return getSizeIfAvailable('headers');
                };

                this.getRequestBodySize = () => {
                    return getSizeIfAvailable('body');
                };
            }
        };
    }]);
})();
