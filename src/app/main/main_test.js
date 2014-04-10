describe('MainCtrl', function () {
    var $scope, createController;

    beforeEach(module('main'));

    beforeEach(inject(function($injector) {
        var $rootScope = $injector.get('$rootScope');
        var $controller = $injector.get('$controller');

        $scope = $rootScope.$new();

        createController = function() {
            return $controller('MainCtrl', {
                '$scope': $scope
            });
        };
    }));

    it('Shoud have a working MainCtrl', inject(function () {
        var ctrl = createController();
        expect(ctrl).toBeTruthy();
        expect(ctrl.who).toBe("main!");

    }));
});
