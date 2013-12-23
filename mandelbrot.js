var Complex = require('Complex');
var width, height;
function getComplex(i,j) {
    var i = (i - width/2) - width/2;
    var j = j - height/2;
    return new Complex(i/(width/2),j/(height/2));
}
function cqp(c, lastResult) {
    var result = new Complex(lastResult.real, lastResult.im);
    return result.multiply(lastResult).add(c);
}
function getDivergencyRate(result, lastResult, i, j, iteration) {
    var rate = new Complex(result.real, result.im).magnitude();
    return rate - lastResult.magnitude();
}
function traverse(callback) {
    for (var i = 0; i < width; i++) {
        for (var j = 0; j < height; j++) {
            callback(i,j);
        }
    }
}
function iterate(lastResult) {
    var c = 0;
    var result = create(width, height);
    traverse(function(i,j) {
        c = getComplex(i, j);
        result[i][j] = cqp(c, lastResult[i][j]);
    });
    return result;
}
function create(width, height) {
    var newBitmap = [];
    for (var i = 0; i < width; i++) {
        newBitmap[i] = [];
    }
    return newBitmap;
}
function getBitmap(result, lastResult, iteration) {
    var bitmap = create(width, height);
    traverse(function(i,j) {
        bitmap[i][j] = getDivergencyRate(result[i][j], lastResult[i][j], i, j, iteration);
    });
    return bitmap;
}
function generateBitmap(width, height, iteration, lastResult) {
    var bitmap = create(width, height);
    var result = [[]];
    result = iterate(lastResult);
    bitmap = getBitmap(result, lastResult, iteration);
    traverse(function(i,j) {
        lastResult[i][j] = null;
    });
    return {
        lastResult: result,
        bitmap: bitmap
    };
}
window.onload = function() {
    function setPixel(imageData, x, y, r, g, b, a) {
        index = (x + y * imageData.width) * 4;
        imageData.data[index+0] = r;
        imageData.data[index+1] = g;
        imageData.data[index+2] = b;
        imageData.data[index+3] = a;
    }
    function getStatsBitmap(bitmap) {
        var distribution = [];
        traverse(function(i,j) {
            if (isFinite(bitmap[i][j])) {
                distribution.push(bitmap[i][j]);
            }
        });
        distribution = distribution.sort(function(a,b) { return a - b; });
        return {
            median: distribution[distribution.length/2],
            min: distribution[0],
            max: distribution[distribution.length-1],
            q1: distribution[distribution.length/4],
            q2: distribution[(3*distribution.length)/4],
            distribution: distribution
        };
    }
    var element = document.getElementById('canvas1');
    width = element.width;
    height = element.height;
    var lastResult = create(width, height);
    traverse(function(i,j) {
        lastResult[i][j] = Complex.from(0);
    });

    var object = generateBitmap(width, height, 0, lastResult);
    lastResult = object.lastResult;
    var bitmap = object.bitmap;
    var stats = getStatsBitmap(bitmap);
    var canvas = document.getElementById('canvas1').getContext('2d');
    var imageData = canvas.createImageData(width, height);
    var iterations = 40;
    for(var i =0; i <iterations; i++) {
        setTimeout(function () {
            traverse(function(i,j) {
                var intensity = Math.min(255, bitmap[i][j]);
                setPixel(imageData, i, j, intensity, 0, 0, 255);
            });
            canvas.putImageData(imageData,0,0);
            object = generateBitmap(width, height, i, lastResult);
            lastResult = object.lastResult;
            bitmap = object.bitmap;

        }, 200*i);
    }
    console.log(imageData);
    console.log(stats);
    console.log(bitmap);
};

