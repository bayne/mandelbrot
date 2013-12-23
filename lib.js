(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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


},{"Complex":2}],2:[function(require,module,exports){

var Complex = function(real, im){
	this.real = real;
	this.im = im;
};

var prototype = Complex.prototype = {

	fromRect: function(a, b){
		this.real = a;
		this.im = b;
		return this;
	},

	fromPolar: function(r, phi){
		if (typeof r == 'string'){
			var parts = r.split(' ');
			r = parts[0];
			phi = parts[1];
		}
		return this.fromRect(
			r * Math.cos(phi),
			r * Math.sin(phi)
		);
	},

	toPrecision: function(k){
		return this.fromRect(
			this.real.toPrecision(k),
			this.im.toPrecision(k)
		);
	},

	toFixed: function(k){
		return this.fromRect(
			this.real.toFixed(k),
			this.im.toFixed(k)
		);
	},

	finalize: function(){
		this.fromRect = function(a, b){
			return new Complex(a, b);
		};
		if (Object.defineProperty){
			Object.defineProperty(this, 'real', {writable: false, value: this.real});
			Object.defineProperty(this, 'im', {writable: false, value: this.im});
		}
		return this;
	},

	magnitude: function(){
		var a = this.real, b = this.im;
		return Math.sqrt(a * a + b * b);
	},

	angle: function(){
		return Math.atan2(this.im, this.real);
	},

	conjugate: function(){
		return this.fromRect(this.real, -this.im);
	},

	negate: function(){
		return this.fromRect(-this.real, -this.im);
	},

	multiply: function(z){
		z = Complex.from(z);
		var a = this.real, b = this.im;
		return this.fromRect(
			z.real * a - z.im * b,
			b * z.real + z.im * a
		);
	},

	divide: function(z){
		z = Complex.from(z);
		var divident = (Math.pow(z.real, 2) + Math.pow(z.im, 2)),
			a = this.real, b = this.im;
		return this.fromRect(
			(a * z.real + b * z.im) / divident,
			(b * z.real - a * z.im) / divident
		);
	},

	add: function(z){
		z = Complex.from(z);
		return this.fromRect(this.real + z.real, this.im + z.im);
	},

	subtract: function(z){
		z = Complex.from(z);
		return this.fromRect(this.real - z.real, this.im - z.im);
	},

	pow: function(z){
		z = Complex.from(z);
		var result = z.multiply(this.clone().log()).exp(); // z^w = e^(w*log(z))
		return this.fromRect(result.real, result.im);
	},

	sqrt: function(){
		var abs = this.magnitude(),
			sgn = this.im < 0 ? -1 : 1;
		return this.fromRect(
			Math.sqrt((abs + this.real) / 2),
			sgn * Math.sqrt((abs - this.real) / 2)
		);
	},

	log: function(k){
		if (!k) k = 0;
		return this.fromRect(
			Math.log(this.magnitude()),
			this.angle() + k * 2 * Math.PI
		);
	},

	exp: function(){
		return this.fromPolar(
			Math.exp(this.real),
			this.im
		);
	},

	sin: function(){
		var a = this.real, b = this.im;
		return this.fromRect(
			Math.sin(a) * cosh(b),
			Math.cos(a) * sinh(b)
		);
	},

	cos: function(){
		var a = this.real, b = this.im;
		return this.fromRect(
			Math.cos(a) * cosh(b),
			Math.sin(a) * sinh(b) * -1
		);
	},

	tan: function(){
		var a = this.real, b = this.im,
			divident = Math.cos(2 * a) + cosh(2 * b);
		return this.fromRect(
			Math.sin(2 * a) / divident,
			sinh(2 * b) / divident
		);
	},

	sinh: function(){
		var a = this.real, b = this.im;
		return this.fromRect(
			sinh(a) * Math.cos(b),
			cosh(a) * Math.sin(b)
		);
	},

	cosh: function(){
		var a = this.real, b = this.im;
		return this.fromRect(
			cosh(a) * Math.cos(b),
			sinh(a) * Math.sin(b)
		);
	},

	tanh: function(){
		var a = this.real, b = this.im,
			divident = cosh(2 * a) + Math.cos(2 * b);
		return this.fromRect(
			sinh(2 * a) / divident,
			Math.sin(2 * b) / divident
		);
	},

	clone: function(){
		return new Complex(this.real, this.im);
	},

	toString: function(polar){
		if (polar) return this.magnitude() + ' ' + this.angle();

		var ret = '', a = this.real, b = this.im;
		if (a) ret += a;
		if (a && b || b < 0) ret += b < 0 ? '-' : '+';
		if (b){
			var absIm = Math.abs(b);
			if (absIm != 1) ret += absIm;
			ret += 'i';
		}
		return ret || '0';
	},

	equals: function(z){
		z = Complex.from(z);
		return (z.real == this.real && z.im == this.im);
	}

};

var alias = {
	abs: 'magnitude',
	arg: 'angle',
	phase: 'angle',
	conj: 'conjugate',
	mult: 'multiply',
	dev: 'divide',
	sub: 'subtract'
};

for (var a in alias) prototype[a] = prototype[alias[a]];

var extend = {

	from: function(real, im){
		if (real instanceof Complex) return new Complex(real.real, real.im);
		var type = typeof real;
		if (type == 'string'){
			if (real == 'i') real = '0+1i';
			var match = real.match(/(\d+)?([\+\-]\d*)[ij]/);
			if (match){
				real = match[1];
				im = (match[2] == '+' || match[2] == '-') ? match[2] + '1' : match[2];
			}
		}
		real = +real;
		im = +im;
		return new Complex(isNaN(real) ? 0 : real, isNaN(im) ? 0 : im);
	},

	fromPolar: function(r, phi){
		return new Complex(1, 1).fromPolar(r, phi);
	},

	i: new Complex(0, 1).finalize(),

	one: new Complex(1, 0).finalize()

};

for (var e in extend) Complex[e] = extend[e];

var sinh = function(x){
	return (Math.pow(Math.E, x) - Math.pow(Math.E, -x)) / 2;
};

var cosh = function(x){
	return (Math.pow(Math.E, x) + Math.pow(Math.E, -x)) / 2;
};

module.exports = Complex;


},{}]},{},[1])