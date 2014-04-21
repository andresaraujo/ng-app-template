ng-app-template
===============

##### Build

`gulp build`

Executes the tasks that are required to run the application in development. Compiles LESS files to CSS, runs test,
lint files, create angular template from html files.

The built files are placed in the `/build` directory

##### Dist

`gulp dist`

Executes the tasks that are required to run the application in production. Concatenates and minify application files
in bundle.js and vendor files in bundle_vendor.js.

The files are placed in the `/dist` directory

##### Watch

`gulp watch`

When a js file changes runs the build task

