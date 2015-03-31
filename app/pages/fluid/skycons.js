var Skycons;

(function(global) {
    "use strict";
    
    /* Set up a RequestAnimationFrame shim so we can animate efficiently FOR
   * GREAT JUSTICE. */
    var requestInterval, cancelInterval;
    
    (function() {
        var raf = global.requestAnimationFrame       ||
            global.webkitRequestAnimationFrame ||
            global.mozRequestAnimationFrame    ||
            global.oRequestAnimationFrame      ||
            global.msRequestAnimationFrame     ,
            caf = global.cancelAnimationFrame        ||
            global.webkitCancelAnimationFrame  ||
            global.mozCancelAnimationFrame     ||
            global.oCancelAnimationFrame       ||
            global.msCancelAnimationFrame      ;
        
        if(raf && caf) {
            requestInterval = function(fn, delay) {
                var handle = {value: null};
                
                function loop() {
                    handle.value = raf(loop);
                    fn();
                }
                
                loop();
                return handle;
            };
            
            cancelInterval = function(handle) {
                caf(handle.value);
            };
        }
        
        else {
            requestInterval = setInterval;
            cancelInterval = clearInterval;
        }
    }());
    
    /* Catmull-rom spline stuffs. */
    /*
  function upsample(n, spline) {
    var polyline = [],
        len = spline.length,
        bx  = spline[0],
        by  = spline[1],
        cx  = spline[2],
        cy  = spline[3],
        dx  = spline[4],
        dy  = spline[5],
        i, j, ax, ay, px, qx, rx, sx, py, qy, ry, sy, t;

    for(i = 6; i !== spline.length; i += 2) {
      ax = bx;
      bx = cx;
      cx = dx;
      dx = spline[i    ];
      px = -0.5 * ax + 1.5 * bx - 1.5 * cx + 0.5 * dx;
      qx =        ax - 2.5 * bx + 2.0 * cx - 0.5 * dx;
      rx = -0.5 * ax            + 0.5 * cx           ;
      sx =                   bx                      ;

      ay = by;
      by = cy;
      cy = dy;
      dy = spline[i + 1];
      py = -0.5 * ay + 1.5 * by - 1.5 * cy + 0.5 * dy;
      qy =        ay - 2.5 * by + 2.0 * cy - 0.5 * dy;
      ry = -0.5 * ay            + 0.5 * cy           ;
      sy =                   by                      ;

      for(j = 0; j !== n; ++j) {
        t = j / n;

        polyline.push(
          ((px * t + qx) * t + rx) * t + sx,
          ((py * t + qy) * t + ry) * t + sy
        );
      }
    }

    polyline.push(
      px + qx + rx + sx,
      py + qy + ry + sy
    );

    return polyline;
  }

  function downsample(n, polyline) {
    var len = 0,
        i, dx, dy;

    for(i = 2; i !== polyline.length; i += 2) {
      dx = polyline[i    ] - polyline[i - 2];
      dy = polyline[i + 1] - polyline[i - 1];
      len += Math.sqrt(dx * dx + dy * dy);
    }

    len /= n;

    var small = [],
        target = len,
        min = 0,
        max, t;

    small.push(polyline[0], polyline[1]);

    for(i = 2; i !== polyline.length; i += 2) {
      dx = polyline[i    ] - polyline[i - 2];
      dy = polyline[i + 1] - polyline[i - 1];
      max = min + Math.sqrt(dx * dx + dy * dy);

      if(max > target) {
        t = (target - min) / (max - min);

        small.push(
          polyline[i - 2] + dx * t,
          polyline[i - 1] + dy * t
        );

        target += len;
      }

      min = max;
    }

    small.push(polyline[polyline.length - 2], polyline[polyline.length - 1]);

    return small;
  }
  */
    
    /* Define skycon things. */
    /* FIXME: I'm *really really* sorry that this code is so gross. Really, I am.
   * I'll try to clean it up eventually! Promise! */
    var KEYFRAME = 500,
        STROKE = 0.08,
        TWO_PI = 2.0 * Math.PI,
        TWO_OVER_SQRT_2 = 2.0 / Math.sqrt(2);
    
    function circle(ctx, x, y, r) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, TWO_PI, false);
        ctx.fill();
    }
    
    function line(ctx, ax, ay, bx, by) {
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
    }
    
    function puff(ctx, t, cx, cy, rx, ry, rmin, rmax) {
        var c = Math.cos(t * TWO_PI),
            s = Math.sin(t * TWO_PI);
        
        rmax -= rmin;
        
        circle(
            ctx,
            cx - s * rx,
            cy + c * ry + rmax * 0.5,
            rmin + (1 - c * 0.5) * rmax
        );
    }
    
    function puffs(ctx, t, cx, cy, rx, ry, rmin, rmax) {
        var i;
        
        for(i = 5; i--; )
            puff(ctx, t + i / 5, cx, cy, rx, ry, rmin, rmax);
    }
    
    function cloud(ctx, t, cx, cy, cw, s, color) {
        t /= 30000;
        
        var a = cw * 0.21,
            b = cw * 0.12,
            c = cw * 0.24,
            d = cw * 0.28;
        
        ctx.fillStyle = color;
        puffs(ctx, t, cx, cy, a, b, c, d);
        
        ctx.globalCompositeOperation = 'destination-out';
        puffs(ctx, t, cx, cy, a, b, c - s, d - s);
        ctx.globalCompositeOperation = 'source-over';
    }
    
    function sun(ctx, t, cx, cy, cw, s, color) {
        t /= 120000;
        
        var a = cw * 0.25 - s * 0.5,
            b = cw * 0.32 + s * 0.5,
            c = cw * 0.50 - s * 0.5,
            i, p, cos, sin;
        
        ctx.strokeStyle = color;
        ctx.lineWidth = s;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        
        ctx.beginPath();
        ctx.arc(cx, cy, a, 0, TWO_PI, false);
        ctx.stroke();
        
        for(i = 8; i--; ) {
            p = (t + i / 8) * TWO_PI;
            cos = Math.cos(p);
            sin = Math.sin(p);
            line(ctx, cx + cos * b, cy + sin * b, cx + cos * c, cy + sin * c);
        }
    }
    
    function moon(ctx, t, cx, cy, cw, s, color) {
        t /= 15000;
        
        var a = cw * 0.29 - s * 0.5,
            b = cw * 0.05,
            c = Math.cos(t * TWO_PI),
            p = c * TWO_PI / -16;
        
        ctx.strokeStyle = color;
        ctx.lineWidth = s;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        
        cx += c * b;
        
        ctx.beginPath();
        ctx.arc(cx, cy, a, p + TWO_PI / 8, p + TWO_PI * 7 / 8, false);
        ctx.arc(cx + Math.cos(p) * a * TWO_OVER_SQRT_2, cy + Math.sin(p) * a * TWO_OVER_SQRT_2, a, p + TWO_PI * 5 / 8, p + TWO_PI * 3 / 8, true);
        ctx.closePath();
        ctx.stroke();
    }
    
    function rain(ctx, t, cx, cy, cw, s, color) {
        t /= 1350;
        
        var a = cw * 0.16,
            b = TWO_PI * 11 / 12,
            c = TWO_PI *  7 / 12,
            i, p, x, y;
        
        ctx.fillStyle = color;
        
        for(i = 4; i--; ) {
            p = (t + i / 4) % 1;
            x = cx + ((i - 1.5) / 1.5) * (i === 1 || i === 2 ? -1 : 1) * a;
            y = cy + p * p * cw;
            ctx.beginPath();
            ctx.moveTo(x, y - s * 1.5);
            ctx.arc(x, y, s * 0.75, b, c, false);
            ctx.fill();
        }
    }
    
    function sleet(ctx, t, cx, cy, cw, s, color) {
        t /= 750;
        
        var a = cw * 0.1875,
            b = TWO_PI * 11 / 12,
            c = TWO_PI *  7 / 12,
            i, p, x, y;
        
        ctx.strokeStyle = color;
        ctx.lineWidth = s * 0.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        
        for(i = 4; i--; ) {
            p = (t + i / 4) % 1;
            x = Math.floor(cx + ((i - 1.5) / 1.5) * (i === 1 || i === 2 ? -1 : 1) * a) + 0.5;
            y = cy + p * cw;
            line(ctx, x, y - s * 1.5, x, y + s * 1.5);
        }
    }
    
    function snow(ctx, t, cx, cy, cw, s, color) {
        t /= 3000;
        
        var a  = cw * 0.16,
            b  = s * 0.75,
            u  = t * TWO_PI * 0.7,
            ux = Math.cos(u) * b,
            uy = Math.sin(u) * b,
            v  = u + TWO_PI / 3,
            vx = Math.cos(v) * b,
            vy = Math.sin(v) * b,
            w  = u + TWO_PI * 2 / 3,
            wx = Math.cos(w) * b,
            wy = Math.sin(w) * b,
            i, p, x, y;
        
        ctx.strokeStyle = color;
        ctx.lineWidth = s * 0.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        
        for(i = 4; i--; ) {
            p = (t + i / 4) % 1;
            x = cx + Math.sin((p + i / 4) * TWO_PI) * a;
            y = cy + p * cw;
            
            line(ctx, x - ux, y - uy, x + ux, y + uy);
            line(ctx, x - vx, y - vy, x + vx, y + vy);
            line(ctx, x - wx, y - wy, x + wx, y + wy);
        }
    }
    
    function fogbank(ctx, t, cx, cy, cw, s, color) {
        t /= 30000;
        
        var a = cw * 0.21,
            b = cw * 0.06,
            c = cw * 0.21,
            d = cw * 0.28;
        
        ctx.fillStyle = color;
        puffs(ctx, t, cx, cy, a, b, c, d);
        
        ctx.globalCompositeOperation = 'destination-out';
        puffs(ctx, t, cx, cy, a, b, c - s, d - s);
        ctx.globalCompositeOperation = 'source-over';
    }
    
    /*
  var WIND_PATHS = [
        downsample(63, upsample(8, [
          -1.00, -0.28,
          -0.75, -0.18,
          -0.50,  0.12,
          -0.20,  0.12,
          -0.04, -0.04,
          -0.07, -0.18,
          -0.19, -0.18,
          -0.23, -0.05,
          -0.12,  0.11,
           0.02,  0.16,
           0.20,  0.15,
           0.50,  0.07,
           0.75,  0.18,
           1.00,  0.28
        ])),
        downsample(31, upsample(16, [
          -1.00, -0.10,
          -0.75,  0.00,
          -0.50,  0.10,
          -0.25,  0.14,
           0.00,  0.10,
           0.25,  0.00,
           0.50, -0.10,
           0.75, -0.14,
           1.00, -0.10
        ]))
      ];
  */
    
    var WIND_PATHS = [
        [
            -0.7500, -0.1800, -0.7219, -0.1527, -0.6971, -0.1225,
            -0.6739, -0.0910, -0.6516, -0.0588, -0.6298, -0.0262,
            -0.6083,  0.0065, -0.5868,  0.0396, -0.5643,  0.0731,
            -0.5372,  0.1041, -0.5033,  0.1259, -0.4662,  0.1406,
            -0.4275,  0.1493, -0.3881,  0.1530, -0.3487,  0.1526,
            -0.3095,  0.1488, -0.2708,  0.1421, -0.2319,  0.1342,
            -0.1943,  0.1217, -0.1600,  0.1025, -0.1290,  0.0785,
            -0.1012,  0.0509, -0.0764,  0.0206, -0.0547, -0.0120,
            -0.0378, -0.0472, -0.0324, -0.0857, -0.0389, -0.1241,
            -0.0546, -0.1599, -0.0814, -0.1876, -0.1193, -0.1964,
            -0.1582, -0.1935, -0.1931, -0.1769, -0.2157, -0.1453,
            -0.2290, -0.1085, -0.2327, -0.0697, -0.2240, -0.0317,
            -0.2064,  0.0033, -0.1853,  0.0362, -0.1613,  0.0672,
            -0.1350,  0.0961, -0.1051,  0.1213, -0.0706,  0.1397,
            -0.0332,  0.1512,  0.0053,  0.1580,  0.0442,  0.1624,
            0.0833,  0.1636,  0.1224,  0.1615,  0.1613,  0.1565,
            0.1999,  0.1500,  0.2378,  0.1402,  0.2749,  0.1279,
            0.3118,  0.1147,  0.3487,  0.1015,  0.3858,  0.0892,
            0.4236,  0.0787,  0.4621,  0.0715,  0.5012,  0.0702,
            0.5398,  0.0766,  0.5768,  0.0890,  0.6123,  0.1055,
            0.6466,  0.1244,  0.6805,  0.1440,  0.7147,  0.1630,
            0.7500,  0.1800
        ],
        [
            -0.7500,  0.0000, -0.7033,  0.0195, -0.6569,  0.0399,
            -0.6104,  0.0600, -0.5634,  0.0789, -0.5155,  0.0954,
            -0.4667,  0.1089, -0.4174,  0.1206, -0.3676,  0.1299,
            -0.3174,  0.1365, -0.2669,  0.1398, -0.2162,  0.1391,
            -0.1658,  0.1347, -0.1157,  0.1271, -0.0661,  0.1169,
            -0.0170,  0.1046,  0.0316,  0.0903,  0.0791,  0.0728,
            0.1259,  0.0534,  0.1723,  0.0331,  0.2188,  0.0129,
            0.2656, -0.0064,  0.3122, -0.0263,  0.3586, -0.0466,
            0.4052, -0.0665,  0.4525, -0.0847,  0.5007, -0.1002,
            0.5497, -0.1130,  0.5991, -0.1240,  0.6491, -0.1325,
            0.6994, -0.1380,  0.7500, -0.1400
        ]
    ],
        WIND_OFFSETS = [
            {start: 0.36, end: 0.11},
            {start: 0.56, end: 0.16}
        ];
    
    function leaf(ctx, t, x, y, cw, s, color) {
        var a = cw / 8,
            b = a / 3,
            c = 2 * b,
            d = (t % 1) * TWO_PI,
            e = Math.cos(d),
            f = Math.sin(d);
        
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = s;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        
        ctx.beginPath();
        ctx.arc(x        , y        , a, d          , d + Math.PI, false);
        ctx.arc(x - b * e, y - b * f, c, d + Math.PI, d          , false);
        ctx.arc(x + c * e, y + c * f, b, d + Math.PI, d          , true );
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        ctx.stroke();
    }
    
    function swoosh(ctx, t, cx, cy, cw, s, index, total, color) {
        t /= 2500;
        
        var path = WIND_PATHS[index],
            a = (t + index - WIND_OFFSETS[index].start) % total,
            c = (t + index - WIND_OFFSETS[index].end  ) % total,
            e = (t + index                            ) % total,
            b, d, f, i;
        
        ctx.strokeStyle = color;
        ctx.lineWidth = s;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        
        if(a < 1) {
            ctx.beginPath();
            
            a *= path.length / 2 - 1;
            b  = Math.floor(a);
            a -= b;
            b *= 2;
            b += 2;
            
            ctx.moveTo(
                cx + (path[b - 2] * (1 - a) + path[b    ] * a) * cw,
                cy + (path[b - 1] * (1 - a) + path[b + 1] * a) * cw
            );
            
            if(c < 1) {
                c *= path.length / 2 - 1;
                d  = Math.floor(c);
                c -= d;
                d *= 2;
                d += 2;
                
                for(i = b; i !== d; i += 2)
                    ctx.lineTo(cx + path[i] * cw, cy + path[i + 1] * cw);
                
                ctx.lineTo(
                    cx + (path[d - 2] * (1 - c) + path[d    ] * c) * cw,
                    cy + (path[d - 1] * (1 - c) + path[d + 1] * c) * cw
                );
            }
            
            else
                for(i = b; i !== path.length; i += 2)
                    ctx.lineTo(cx + path[i] * cw, cy + path[i + 1] * cw);
            
            ctx.stroke();
        }
        
        else if(c < 1) {
            ctx.beginPath();
            
            c *= path.length / 2 - 1;
            d  = Math.floor(c);
            c -= d;
            d *= 2;
            d += 2;
            
            ctx.moveTo(cx + path[0] * cw, cy + path[1] * cw);
            
            for(i = 2; i !== d; i += 2)
                ctx.lineTo(cx + path[i] * cw, cy + path[i + 1] * cw);
            
            ctx.lineTo(
                cx + (path[d - 2] * (1 - c) + path[d    ] * c) * cw,
                cy + (path[d - 1] * (1 - c) + path[d + 1] * c) * cw
            );
            
            ctx.stroke();
        }
        
        if(e < 1) {
            e *= path.length / 2 - 1;
            f  = Math.floor(e);
            e -= f;
            f *= 2;
            f += 2;
            
            leaf(
                ctx,
                t,
                cx + (path[f - 2] * (1 - e) + path[f    ] * e) * cw,
                cy + (path[f - 1] * (1 - e) + path[f + 1] * e) * cw,
                cw,
                s,
                color
            );
        }
    }
    
    Skycons = function(opts) {
        this.list        = [];
        this.interval    = null;
        this.color       = opts && opts.color ? opts.color : "black";
        this.resizeClear = !!(opts && opts.resizeClear);
    };
    
    Skycons.CLEAR_DAY = function(ctx, t, color) {
        var w = ctx.canvas.width,
            h = ctx.canvas.height,
            s = Math.min(w, h);
        
        sun(ctx, t, w * 0.5, h * 0.5, s, s * STROKE, color);
    };
    
    Skycons.CLEAR_NIGHT = function(ctx, t, color) {
        var w = ctx.canvas.width,
            h = ctx.canvas.height,
            s = Math.min(w, h);
        
        moon(ctx, t, w * 0.5, h * 0.5, s, s * STROKE, color);
    };
    
    Skycons.PARTLY_CLOUDY_DAY = function(ctx, t, color) {
        var w = ctx.canvas.width,
            h = ctx.canvas.height,
            s = Math.min(w, h);
        
        sun(ctx, t, w * 0.625, h * 0.375, s * 0.75, s * STROKE, color);
        cloud(ctx, t, w * 0.375, h * 0.625, s * 0.75, s * STROKE, color);
    };
    
    Skycons.PARTLY_CLOUDY_NIGHT = function(ctx, t, color) {
        var w = ctx.canvas.width,
            h = ctx.canvas.height,
            s = Math.min(w, h);
        
        moon(ctx, t, w * 0.667, h * 0.375, s * 0.75, s * STROKE, color);
        cloud(ctx, t, w * 0.375, h * 0.625, s * 0.75, s * STROKE, color);
    };
    
    Skycons.CLOUDY = function(ctx, t, color) {
        var w = ctx.canvas.width,
            h = ctx.canvas.height,
            s = Math.min(w, h);
        
        cloud(ctx, t, w * 0.5, h * 0.5, s, s * STROKE, color);
    };
    
    Skycons.RAIN = function(ctx, t, color) {
        var w = ctx.canvas.width,
            h = ctx.canvas.height,
            s = Math.min(w, h);
        
        rain(ctx, t, w * 0.5, h * 0.37, s * 0.9, s * STROKE, color);
        cloud(ctx, t, w * 0.5, h * 0.37, s * 0.9, s * STROKE, color);
    };
    
    Skycons.SLEET = function(ctx, t, color) {
        var w = ctx.canvas.width,
            h = ctx.canvas.height,
            s = Math.min(w, h);
        
        sleet(ctx, t, w * 0.5, h * 0.37, s * 0.9, s * STROKE, color);
        cloud(ctx, t, w * 0.5, h * 0.37, s * 0.9, s * STROKE, color);
    };
    
    Skycons.SNOW = function(ctx, t, color) {
        var w = ctx.canvas.width,
            h = ctx.canvas.height,
            s = Math.min(w, h);
        
        snow(ctx, t, w * 0.5, h * 0.37, s * 0.9, s * STROKE, color);
        cloud(ctx, t, w * 0.5, h * 0.37, s * 0.9, s * STROKE, color);
    };
    
    Skycons.WIND = function(ctx, t, color) {
        var w = ctx.canvas.width,
            h = ctx.canvas.height,
            s = Math.min(w, h);
        
        swoosh(ctx, t, w * 0.5, h * 0.5, s, s * STROKE, 0, 2, color);
        swoosh(ctx, t, w * 0.5, h * 0.5, s, s * STROKE, 1, 2, color);
    };
    
    Skycons.FOG = function(ctx, t, color) {
        var w = ctx.canvas.width,
            h = ctx.canvas.height,
            s = Math.min(w, h),
            k = s * STROKE;
        
        fogbank(ctx, t, w * 0.5, h * 0.32, s * 0.75, k, color);
        
        t /= 5000;
        
        var a = Math.cos((t       ) * TWO_PI) * s * 0.02,
            b = Math.cos((t + 0.25) * TWO_PI) * s * 0.02,
            c = Math.cos((t + 0.50) * TWO_PI) * s * 0.02,
            d = Math.cos((t + 0.75) * TWO_PI) * s * 0.02,
            n = h * 0.936,
            e = Math.floor(n - k * 0.5) + 0.5,
            f = Math.floor(n - k * 2.5) + 0.5;
        
        ctx.strokeStyle = color;
        ctx.lineWidth = k;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        
        line(ctx, a + w * 0.2 + k * 0.5, e, b + w * 0.8 - k * 0.5, e);
        line(ctx, c + w * 0.2 + k * 0.5, f, d + w * 0.8 - k * 0.5, f);
    };
    
    Skycons.prototype = {
        add: function(el, draw) {
            var obj;
            
            if(typeof el === "string")
                el = document.getElementById(el);
            
            obj = {
                element: el,
                context: el.getContext("2d"),
                drawing: draw
            };
            
            this.list.push(obj);
            this.draw(obj, KEYFRAME);
        },
        set: function(el, draw) {
            var i;
            
            if(typeof el === "string")
                el = document.getElementById(el);
            
            for(i = this.list.length; i--; )
                if(this.list[i].element === el) {
                    this.list[i].drawing = draw;
                    this.draw(this.list[i], KEYFRAME);
                    return;
                }
            
            this.add(el, draw);
        },
        remove: function(el) {
            var i;
            
            if(typeof el === "string")
                el = document.getElementById(el);
            
            for(i = this.list.length; i--; )
                if(this.list[i].element === el) {
                    this.list.splice(i, 1);
                    return;
                }
        },
        draw: function(obj, time) {
            var canvas = obj.context.canvas;
            
            if(this.resizeClear)
                canvas.width = canvas.width;
            
            else
                obj.context.clearRect(0, 0, canvas.width, canvas.height);
            
            obj.drawing(obj.context, time, this.color);
        },
        play: function() {
            var self = this;
            
            this.pause();
            this.interval = requestInterval(function() {
                var now = Date.now(),
                    i;
                
                for(i = self.list.length; i--; )
                    self.draw(self.list[i], now);
            }, 1000 / 60);
        },
        pause: function() {
            var i;
            
            if(this.interval) {
                cancelInterval(this.interval);
                this.interval = null;
            }
        }
    };
}(this));

/*! Copyright (c) 2013 Brandon Aaron (http://brandonaaron.net)
 * Licensed under the MIT License (LICENSE.txt).
 *
 * Thanks to: http://adomas.org/javascript-mouse-wheel/ for some pointers.
 * Thanks to: Mathias Bank(http://www.mathias-bank.de) for a scope bug fix.
 * Thanks to: Seamus Leahy for adding deltaX and deltaY
 *
 * Version: 3.1.3
 *
 * Requires: 1.2.2+
 */

(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if (typeof exports === 'object') {
        // Node/CommonJS style for Browserify
        module.exports = factory;
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function ($) {

    var toFix = ['wheel', 'mousewheel', 'DOMMouseScroll', 'MozMousePixelScroll'];
    var toBind = 'onwheel' in document || document.documentMode >= 9 ? ['wheel'] : ['mousewheel', 'DomMouseScroll', 'MozMousePixelScroll'];
    var lowestDelta, lowestDeltaXY;

    if ( $.event.fixHooks ) {
        for ( var i = toFix.length; i; ) {
            $.event.fixHooks[ toFix[--i] ] = $.event.mouseHooks;
        }
    }

    $.event.special.mousewheel = {
        setup: function() {
            if ( this.addEventListener ) {
                for ( var i = toBind.length; i; ) {
                    this.addEventListener( toBind[--i], handler, false );
                }
            } else {
                this.onmousewheel = handler;
            }
        },

        teardown: function() {
            if ( this.removeEventListener ) {
                for ( var i = toBind.length; i; ) {
                    this.removeEventListener( toBind[--i], handler, false );
                }
            } else {
                this.onmousewheel = null;
            }
        }
    };

    $.fn.extend({
        mousewheel: function(fn) {
            return fn ? this.bind("mousewheel", fn) : this.trigger("mousewheel");
        },

        unmousewheel: function(fn) {
            return this.unbind("mousewheel", fn);
        }
    });


    function handler(event) {
        var orgEvent = event || window.event,
            args = [].slice.call(arguments, 1),
            delta = 0,
            deltaX = 0,
            deltaY = 0,
            absDelta = 0,
            absDeltaXY = 0,
            fn;
        event = $.event.fix(orgEvent);
        event.type = "mousewheel";

        // Old school scrollwheel delta
        if ( orgEvent.wheelDelta ) { delta = orgEvent.wheelDelta; }
        if ( orgEvent.detail )     { delta = orgEvent.detail * -1; }

        // New school wheel delta (wheel event)
        if ( orgEvent.deltaY ) {
            deltaY = orgEvent.deltaY * -1;
            delta  = deltaY;
        }
        if ( orgEvent.deltaX ) {
            deltaX = orgEvent.deltaX;
            delta  = deltaX * -1;
        }

        // Webkit
        if ( orgEvent.wheelDeltaY !== undefined ) { deltaY = orgEvent.wheelDeltaY; }
        if ( orgEvent.wheelDeltaX !== undefined ) { deltaX = orgEvent.wheelDeltaX * -1; }

        // Look for lowest delta to normalize the delta values
        absDelta = Math.abs(delta);
        if ( !lowestDelta || absDelta < lowestDelta ) { lowestDelta = absDelta; }
        absDeltaXY = Math.max(Math.abs(deltaY), Math.abs(deltaX));
        if ( !lowestDeltaXY || absDeltaXY < lowestDeltaXY ) { lowestDeltaXY = absDeltaXY; }

        // Get a whole value for the deltas
        fn = delta > 0 ? 'floor' : 'ceil';
        delta  = Math[fn](delta / lowestDelta);
        deltaX = Math[fn](deltaX / lowestDeltaXY);
        deltaY = Math[fn](deltaY / lowestDeltaXY);

        // Add event and delta to the front of the arguments
        args.unshift(event, delta, deltaX, deltaY);

        return ($.event.dispatch || $.event.handle).apply(this, args);
    }

}));

(function(c,f,g,b){var d=c(this),i=d.scrollTop()||f.pageYOffset,h=false;var e=function(){return !!("ontouchstart" in f)||!!("onmsgesturechange" in f)};var a={init:function(j){return this.each(function(){var q=c(this),m=q.data("hook");if(typeof(m)==="undefined"){var p={reloadPage:true,dynamic:true,textRequired:false,scrollWheelSelected:false,swipeDistance:50,loaderClass:"hook-loader",spinnerClass:"hook-spinner",loaderTextClass:"hook-text",loaderText:"Reloading...",reloadEl:function(){}};m=c.extend({},p,j);q.data("hook",m)}else{m=c.extend({},m,j)}if(m.dynamic===true){var k="<div class="+m.loaderClass+">";k+="<div class="+m.spinnerClass+"/>";k+="</div>";var o="<span class="+m.loaderTextClass+">"+m.loaderText+"</span>";q.append(k);if(m.textRequired===true){q.addClass("hook-with-text");q.append(o)}}if(!e()){if(m.scrollWheelSelected===true){d.on("mousewheel",function(r,s){a.onScroll(q,m,s)})}else{d.on("scroll",function(){a.onScroll(q,m)})}}else{var n=0,l=0;d.on("touchstart",function(r){n=r.originalEvent.touches[0].pageY});d.on("touchmove",function(r){l=r.originalEvent.touches[0].pageY+n;i=c(this).scrollTop();if(l<m.swipeDistance){r.preventDefault()}if(l>m.swipeDistance&&n<=40){a.onSwipe(q,m)}});d.on("touchend",function(){l=0})}})},onScroll:function(k,j,l){i=d.scrollTop();if(j.scrollWheelSelected===true&&(l>=150&&i<=0)){if(h===false){a.reload(k,j);h=true}}if(j.scrollWheelSelected===false&&i<=0){if(h===false){a.reload(k,j);h=true}}},onSwipe:function(k,j){if(i<=0){a.reload(k,j)}},reload:function(k,j){k.show();k.animate({marginTop:"0px"},200);k.delay(500).slideUp(200,function(){if(j.reloadPage){f.location.reload(true)}h=false});if(!j.reloadPage){j.reloadEl()}},destroy:function(){return c(this).each(function(){var j=c(this);j.empty();j.removeData("hook")})}};c.fn.hook=function(){var j=arguments[0];if(a[j]){j=a[j];arguments=Array.prototype.slice.call(arguments,1)}else{if(typeof(j)==="object"||!j){j=a.init}else{c.error("Method "+j+" does not exist on jQuery.pluginName");return this}}return j.apply(this,arguments)}})(jQuery,window,document);