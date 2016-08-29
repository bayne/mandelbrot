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
    this.z = new Complex(0, 0);
}
function cqp(z, c) {
    return z.multiply(z).add(c);
}
function iterate(values, i) {
    values.forEach(function(entry) {
        var complex = entry.c;
        var result = entry.z;
        //while(i < maxIteration && result.magnitude() < 2.0) {
        if (result.magnitude() < 2.0) {
            result = cqp(result, complex);
            entry.z = result;
            entry.i = i;
        }
    });
    return values;
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
    var transformer = new Transformer(rasterSize);


    var n = 0;
    function init() {
        n = 0;
        raster = [];

        for(var i = 0; i < rasterSize.width; i++) {
            for(var j = 0; j < rasterSize.height; j++) {
                var complex = new Complex(0,0);
                raster.push(new Coord(i, j, complex, 0));
            }
        }

        transformer.forward(raster);

        var scale = parseFloat(document.getElementById('scale').value) || 1;
        var xOffset = parseFloat(document.getElementById('xoffset').value) || 0;
        var yOffset = parseFloat(document.getElementById('yoffset').value) || 0;

        raster.forEach(function(entry) {
            entry.c.real = entry.x/scale+xOffset;
            entry.c.im = entry.y/scale+yOffset;
        });
        transformer.reverse(raster);

        canvas.putImageData(imageData,0,0);
    }

    function RenderFrame() {
        if (n > 40) {
            return;
        }
        imageData = canvas.getImageData(0,0, element.width, element.height);


        var max = n;
        transformer.forward(raster);
        //while (n < 20) {
            n = n + 1;
            raster = iterate(raster, n);
            console.log(n);
        //}

        //var result = iterate(normals, max);
        //var result = normals;


        transformer.reverse(raster);
        raster.forEach(function(entry) {
            var intensity = ((entry.i/max)*255) - 125;
            if (intensity < 0) {
                intensity = -intensity;
            }
            setPixel(imageData, entry.x, entry.y, 125-intensity, 0, 0, 255);
        });
        canvas.putImageData(imageData,0,0);
    }

    init();
    setInterval(RenderFrame, 200);
    document.getElementById('go').onclick = function () {
        init();
    };

};

