(function(){
    var directiveName = 'icwsDocLink',
        baseUrl = 'https://webbuild.ininlab.com/doc/icws/main_systest/Internal';

    function getRequestUrl(request) {
        var url = request.urlTemplate.replace(/\{/g, '(').replace(/\}/g, ')');

        if (!/\/$/.test(url)) {
            url += '/';
        }

        url += 'index.htm' + '#' + request.verb.toLowerCase();

        return baseUrl + url;
    }

    function getMessageUrl(message) {
        return baseUrl + '/searchTermsPage.htm?text=' + encodeURIComponent(message.__type);
    }

    angular.module('IcwsPanel').directive(directiveName, [function(){
        return {
            restrict: 'E',
            template: '<a href="{{ url }}" target="icwsdevtoolsdoc" ng-show="url"><ng-transclude></ng-transclude></a>',
            replace: true,
            transclude: true,
            scope: {
                entry: '='
            },
            link: function(scope) {
                scope.$watch('entry', function(){
                    if (!scope.entry) { 
                        scope.url = ''; 
                    }
                    else if (scope.entry.type === 'message') {
                        scope.url = getMessageUrl(scope.entry.content);
                    }
                    else if (scope.entry.type === 'request') {
                        scope.url = getRequestUrl(scope.entry.content);
                    }       
                }, true);
            }
        };
    }]);
})();
