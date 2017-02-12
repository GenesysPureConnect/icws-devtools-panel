angular.module('IcwsPanel', []).controller('AppCtrl', ['$scope', '$window', function AppCtrl($scope, $window){
    var ctrl = this;

    this.messages = [];

    // Create a connection to the background page
    var backgroundPageConnection = chrome.runtime.connect({
        name: "icws-panel"
    });

    backgroundPageConnection.onMessage.addListener(message => {
        if (message.type === 'status') {
            console.log(`Status message from background page: ${message.data}`);
        } else if (message.type === 'icws-message') {
            $scope.$apply(() => this.messages.push(message));
        }
    });
}]);
