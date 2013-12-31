(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Complex = function(real, im)
{
    this.real = real;
    this.im = im;
    this.magnitude = function() {
        return Math.sqrt(this.real*this.real + this.im*this.im);
    };
    this.multiply = function(z) {
        var a = this.real, b = this.im,
            c = z.real, d = z.im;
        var k1 = a*(c + d);
        var k2 = d*(a + b);
        var k3 = c*(b - a);
        return new Complex(
            k1 - k2,
            k1 + k3
        );
    };
    this.add = function(z) {
        return new Complex(
            this.real + z.real,
            this.im + z.im
        );
    };
}
var width, height;
var divergency = null;

function getComplex(i,j) {
    var i = (i - width/2) - width/2;
    var j = j - height/2;
    return new Complex(i/(width/2),j/(height/2));
}
function cqp(c, lastResult) {
    var result = new Complex(lastResult.real, lastResult.im);
    return result.multiply(lastResult).add(c);
}
function Divergency(width, height) {
    var cache = create(width, height);

    this.put = function(i,j,v) {
        cache[i][j] = v;
    }
    this.has = function(i,j) {
        return cache[i][j] != undefined;
    }
    this.get = function(i,j) {
        return cache[i][j];
    }
}
function getDivergencyRate(result, lastResult, i, j, iteration) {
    if (result.magnitude() > 2.0) {
        divergency.put(i,j,iteration);
        return iteration;
    } else {
        return 0;
    }
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
    var comp = 0;
    var iteration = function(i,j) {
        if (!divergency.has(i,j)) {
            c = getComplex(i, j);
            result[i][j] = cqp(c, lastResult[i][j]);
        } else {
            result[i][j] = lastResult[i][j];
        }
    };
    traverse(iteration);
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
        if (divergency.has(i,j)) {
            bitmap[i][j] = divergency.get(i,j);
        } else {
            bitmap[i][j] = getDivergencyRate(result[i][j], lastResult[i][j], i, j, iteration);
        }
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
    divergency = new Divergency(width, height);
    var lastResult = create(width, height);
    traverse(function(i,j) {
        lastResult[i][j] = new Complex(0,0);
    });

    var object = generateBitmap(width, height, 0, lastResult);
    lastResult = object.lastResult;
    var bitmap = object.bitmap;
    var stats = getStatsBitmap(bitmap);
    var canvas = document.getElementById('canvas1').getContext('2d');
    var imageData = canvas.createImageData(width, height);
    var iterations = 20;
    var setPixels = function(i,j) {
        var intensity = (bitmap[i][j]/iterations)*255;
        setPixel(imageData, i, j, intensity, 0, 0, 255);
    }
    for(var i =0; i < iterations; i++) {
        traverse(setPixels);
        canvas.putImageData(imageData,0,0);
        object = generateBitmap(width, height, i, lastResult);
        lastResult = object.lastResult;
        bitmap = object.bitmap;
    }
    console.log(imageData);
    console.log(stats);
    console.log(bitmap);
};


},{}]},{},[1])