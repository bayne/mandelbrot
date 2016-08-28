function Complex(real, im) {
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
        this.real = k1 - k2;
        this.im = k1 + k3;
        return this;
    };
    this.add = function(z) {
        this.real = this.real + z.real;
        this.im = this.im + z.im;
        return this;
    };
}
function Coord(x, y, c, i) {
    this.x = x;
    this.y = y;
    this.c = c;
    this.i = i;
}
function cqp(z, c) {
    return z.multiply(z).add(c);
}
function iterate(values, maxIteration) {
    var coords = [];
    values.forEach(function(entry) {
        var complex = entry.c
        var i = 0;
        var result = new Complex(0,0);
        while(i < maxIteration && result.magnitude() < 2.0) {
            result = cqp(result, complex);
            i = i + 1;
        }
        coords.push(new Coord(entry.x, entry.y, result, i));
    });
    return coords;
}
function Transformer(rasterSize) {
    var centerX = (rasterSize.width/2);
    var centerY = (rasterSize.height/2);
    this.forward = function(raster) {
        raster.forEach(function(entry) {
            entry.x = (entry.x - centerX)/centerX;
            entry.y = (entry.y - centerY)/centerY;
        });
        return raster;
    };
    this.reverse = function(normal) {
        normal.forEach(function(entry) {
            entry.x = (entry.x*centerX + centerX);
            entry.y = (entry.y*centerY + centerY);
        });
        return normal;
    };
}
window.onload = function () {
    document.getElementsById('go').onclick = function() {
        function setPixel(imageData, x, y, r, g, b, a) {
            index = (x + y * imageData.width) * 4;
            imageData.data[index+0] = r;
            imageData.data[index+1] = g;
            imageData.data[index+2] = b;
            imageData.data[index+3] = a;
        }
        var element = document.getElementById('canvas1');
        var canvas = document.getElementById('canvas1').getContext('2d');
        var imageData = canvas.createImageData(element.width, element.height);
        var rasterSize = {width: element.width, height: element.height};
        var raster = [];
        for(var i = 0; i < rasterSize.width; i++) {
            for(var j = 0; j < rasterSize.height; j++) {
                var complex = new Complex(0,0);
                raster.push(new Coord(i, j, complex, 0));
            }
        }
        var transformer = new Transformer(rasterSize);
        var normals = transformer.forward(raster);

        var scale = parseFloat(document.getElementById('scale').value) || 1;
        var xOffset = parseFloat(document.getElementById('xoffset').value) || 0;
        var yOffset = parseFloat(document.getElementById('yoffset').value) || 0;

        normals.forEach(function(entry) {
            entry.c.real = entry.x/scale+xOffset;
            entry.c.im = entry.y/scale+yOffset;
        });
        var max = 70;
        var result = iterate(normals, max);
        raster = transformer.reverse(result);
        raster.forEach(function(entry) {
            var intensity = (entry.i/max)*255;
            setPixel(imageData, entry.x, entry.y, intensity, 0, 0, 255);
        });
        canvas.putImageData(imageData,0,0);
    };

};

