(function(){
    var directiveName = 'icwsJsonPrettyPrint';

    function jsonToHtml(input) {
        let json = (typeof input === 'string') ? input : JSON.stringify(input, undefined, 2);
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            let cls = 'number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'key';
                } else {
                    cls = 'string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'boolean';
            } else if (/null/.test(match)) {
                cls = 'null';
            }
            // Strip quotes from key names
            if (cls === 'key') {
                match = match.replace('"', '');
            }
            return '<span class="' + cls + '">' + match + '</span>';
        });
    }

    angular.module('IcwsPanel').directive(directiveName, ['$sce', '$parse', '$compile', function($sce, $parse, $compile){
        return {
            restrict: 'A',
            compile: function icwsJsonPrettyPrintCompile(tElement, tAttrs) {
                var icwsJsonPrettyPrintGetter = $parse(tAttrs[directiveName]);
                var icwsJsonPrettyPrintWatch = $parse(tAttrs[directiveName], function sceValueOf(val) {
                    // Unwrap the value to compare the actual inner safe value, not the wrapper object.
                    return $sce.valueOf(val);
                });
                $compile.$$addBindingClass(tElement);

                return function icwsPrettyPrintJsonLink(scope, element, attr) {
                    $compile.$$addBindingInfo(element, attr[directiveName]);

                    scope.$watch(icwsJsonPrettyPrintWatch, function icwsJsonPrettyPrintWatchAction() {
                        // The watched value is the unwrapped value. To avoid re-escaping, use the direct getter.
                        var value = jsonToHtml(icwsJsonPrettyPrintGetter(scope));
                        element.html($sce.getTrustedHtml(value) || '');
                    });

                    element.addClass('icws-json-pretty-print');
                };
            }
        };
    }]);
})();
