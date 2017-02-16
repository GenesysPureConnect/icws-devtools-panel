(function(){
    var directiveName = 'icwsMessageViewer';

    angular.module('IcwsPanel').directive(directiveName, [function(){
        return {
            restrict: 'E',
            templateUrl: 'templates/icws-message-viewer.html',
            replace: true,
            scope: {
                message: '='
            }
        };
    }]);
})();
