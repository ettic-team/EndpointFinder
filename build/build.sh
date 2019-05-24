#!/bin/bash

main="`dirname $0`/../"

browserify "$main/index.js" -s module -o "$main/java-package/src/main/resources/ca/zhack/endpointfinder/main.js"

cd "$main/java-package/"
mvn package 
