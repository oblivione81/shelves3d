/**
 * Created with JetBrains RubyMine.
 * User: oblivion
 * Date: 22/11/12
 * Time: 0.52
 * To change this template use File | Settings | File Templates.
 */

function hsvToRgb(h, s, v){
    var r, g, b;

    var i = Math.floor(h * 6);
    var f = h * 6 - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);

    switch(i % 6){
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }

    return [r * 255, g * 255, b * 255];
}

function colorToHex(r, g, b)
{
    return b | (g << 8) | (r << 16);
}

var _utils_golden_ratio_conjugate = 0.618033988749895;
var _utils_random_color_seed = Math.random();

function random_color()
{
    _utils_random_color_seed += _utils_golden_ratio_conjugate;
    _utils_random_color_seed %= 1;
    return hsvToRgb(_utils_random_color_seed, 0.5, 0.95);
}

function interpColor(colorA, colorB, alpha)
{
    var blended = new THREE.Color();

    blended.r = colorA.r * alpha + colorB.r * (1 - alpha);
    blended.g = colorA.g * alpha + colorB.g * (1 - alpha);
    blended.b = colorA.b * alpha + colorB.b * (1 - alpha);

    return blended;
}

function interpVector3(v1, v2, alpha)
{
    var interp = new THREE.Vector3();

    interp.x = v1.x * (1-alpha) + v2.x *  alpha;
    interp.y = v1.y * (1-alpha) + v2.y *  alpha;
    interp.z = v1.z * (1-alpha) + v2.z *  alpha;

    return interp;
}

function fromScreenToRenderer(screenCoord, canvasName)
{
    var canvasWidth = $("#"+canvasName).innerWidth();
    var canvasHeight = $("#"+canvasName).innerWidth();

    var x = 2 * ((screenCoord.x - $("#"+canvasName).offset().left) / canvasWidth) - 1;
    var y = -2 * ((screenCoord.y - $("#"+canvasName).offset().top) / canvasHeight) + 1;

    return new THREE.Vector2(x, y);
}

var __logEnabled = true;


function clearLog()
{
    if (__logEnabled)
        $("#div_log").text("");
}
function logVector(name, v)
{
    if (__logEnabled)
        appendLog(name + ":" + v.x + "," + v.y + "," + v.z);
}
function appendLog(text)
{
    if (__logEnabled)
        $("#div_log").append("<br>" + text);
}