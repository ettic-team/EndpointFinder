#!/bin/bash

main="`dirname $0`/../"

browserify "$main/index.js" -s module -o "$main/java-package/src/main/resources/main.js"

#cat "$main/build/es6-shim.min.js" "$main/java-package/src/main/resources/main.js" > "$main/java-package/src/main/resources/main-with-shim.js"

cd "$main/java-package/"
mvn package
