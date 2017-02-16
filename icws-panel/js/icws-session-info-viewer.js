(function(){
    var directiveName = 'icwsSessionInfoViewer';

    angular.module('IcwsPanel').directive(directiveName, [function(){
        return {
            restrict: 'E',
            templateUrl: 'templates/icws-session-info-viewer.html',
            replace: true,
            scope: {
                data: '='
            }
        };
    }]);
})();
