(function() {
    /**
     *
     * @param $scope
     * @constructor
     */
    function MainCtrl($scope) {
        this.who = "main!";
    }

    MainCtrl.prototype = {
        init: function () {
        }
    };

    var ctrl = ['$scope', MainCtrl];

    angular.module('main', [])
        .config(function () {})
        .controller("MainCtrl", ctrl);
})();
