(function(){
    var directiveName = 'icwsRequestViewer';

    angular.module('IcwsPanel').directive(directiveName, [function(){
        return {
            restrict: 'E',
            templateUrl: 'icws-request-viewer.html',
            replace: true,
            scope: {
                request: '='
            }
        };
    }]);
})();
