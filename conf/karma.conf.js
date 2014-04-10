module.exports = function (karma) {
    karma.set({

        basePath: '../',
        frameworks: [ 'jasmine' ],
        plugins: [
            'karma-coverage',
            'karma-jasmine',
            'karma-chrome-launcher'
        ],
        preprocessors: {},
        reporters: ['dots'],

        port: 9018,
        runnerPort: 9100,
        urlRoot: '/',

        autoWatch: true,
        singleRun: false,

        browsers: ['Chrome']
    });
};