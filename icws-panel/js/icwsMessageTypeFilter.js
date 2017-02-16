(function(){
    angular.module('IcwsPanel').filter('icwsMessageType', function(){
        const messageTypePrefix = 'urn:inin.com:';
        return function(input) {
            if (typeof input === 'object' && '__type' in input) {
                input = input.__type;
            }
            if (typeof input === 'string' && input.startsWith(messageTypePrefix)) {
                return input.substring(messageTypePrefix.length);
            }
            return input;
        };
    });
})();
