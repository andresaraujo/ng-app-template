/**
 * Created by andres on 4/8/14.
 */
angular.module('myApp',
    [
        'templates',
        'ui.router',
        'main'
    ])
    .config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
        $stateProvider
            .state("default", {url: "/main", controller: "MainCtrl", templateUrl:"main/main.tpl.html"});
        $urlRouterProvider.otherwise("/main");
    }]);