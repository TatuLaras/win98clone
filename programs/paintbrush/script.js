var painting = false;
var tool = 'pen';
var canvas = document.querySelector('#paint-window');
var canvasPreview = document.querySelector('#paint-window-preview');

var graphics = canvas.getContext('2d');
var graphicsPreview = canvasPreview.getContext('2d');

var currentColor = [0, 0, 0];

// Pen tool var
let x = 0,
    y = 0;

// Line tool var
var lineStartX = 0,
    lineStartY = 0;

// Flood fill var
var startColor;
var imageData;

graphics.fillStyle = '#FFFFFF';
graphics.fillRect(0, 0, canvas.width, canvas.height);

const parseColor = (input) => {
    var m = input.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
    if (m) {
        return [m[1], m[2], m[3]];
    }
};

const startPainting = (e) => {
    painting = true;

    switch (tool) {
        case 'pen':
            [x, y] = [e.offsetX, e.offsetY];
            break;

        case 'line':
            [lineStartX, lineStartY] = [e.offsetX, e.offsetY];
            break;
    }
};

const stopPainting = (e) => {
    painting = false;

    switch (tool) {
        case 'line':
            stopPaintingWithLine(e);
            break;

        case 'bucket':
            floodFill(e.offsetX, e.offsetY, currentColor);
            break;
    }
};

const mousemove = (e) => {
    if (painting) {
        switch (tool) {
            case 'pen':
                paintWithPen(e);
                break;

            case 'line':
                paintWithLine(e);
                break;
        }
    }
};

const setColor = (e) => {
    const style = getComputedStyle(e.target);
    graphics.strokeStyle = style.backgroundColor;
    currentColor = parseColor(style.backgroundColor.toString());
    graphicsPreview.strokeStyle = style.backgroundColor;
};

const setTool = (newTool, e) => {
    tool = newTool;

    // luokka visuaalisia juttuja varten
    var toolButtons = document.querySelectorAll('.tool-button');
    toolButtons.forEach((tb) => tb.classList.remove('current'));
    e.target.classList.add('current');
};

// Painting with tools
const paintWithPen = (e) => {
    const newX = e.offsetX;
    const newY = e.offsetY;

    graphics.beginPath();
    graphics.moveTo(x, y);
    graphics.lineTo(newX, newY);
    graphics.stroke();
    //[x, y] = [newX, newY];
    x = newX;
    y = newY;
};

const paintWithLine = (e) => {
    graphicsPreview.clearRect(0, 0, canvasPreview.width, canvasPreview.height);
    graphicsPreview.beginPath();
    graphicsPreview.moveTo(lineStartX, lineStartY);
    graphicsPreview.lineTo(e.offsetX, e.offsetY);
    graphicsPreview.stroke();
};

const stopPaintingWithLine = (e) => {
    graphicsPreview.clearRect(0, 0, canvasPreview.width, canvasPreview.height);
    graphics.beginPath();
    graphics.moveTo(lineStartX, lineStartY);
    graphics.lineTo(e.offsetX, e.offsetY);
    graphics.stroke();
    [lineStartX, lineStartY] = [0, 0];
};

// Floodfill

function getPixel(imageData, x, y) {
    if (x < 0 || y < 0 || x >= imageData.width || y >= imageData.height) {
        return [-1, -1, -1, -1]; // impossible color
    } else {
        const offset = (y * imageData.width + x) * 4;
        return imageData.data.slice(offset, offset + 4);
    }
}

function setPixel(imageData, x, y, color) {
    const offset = (y * imageData.width + x) * 4;
    imageData.data[offset + 0] = color[0];
    imageData.data[offset + 1] = color[1];
    imageData.data[offset + 2] = color[2];
    imageData.data[offset + 3] = 255;
}

function colorsMatch(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}

function floodFill(x, y, fillColor) {
    // read the pixels in the canvas
    const imageData = graphics.getImageData(0, 0, canvas.width, canvas.height);

    // get the color we're filling
    const targetColor = getPixel(imageData, x, y);

    // check we are actually filling a different color
    if (!colorsMatch(targetColor, fillColor)) {
        const pixelsToCheck = [x, y];
        while (pixelsToCheck.length > 0) {
            const y = pixelsToCheck.pop();
            const x = pixelsToCheck.pop();

            const currentColor = getPixel(imageData, x, y);
            if (colorsMatch(currentColor, targetColor)) {
                setPixel(imageData, x, y, fillColor);
                pixelsToCheck.push(x + 1, y);
                pixelsToCheck.push(x - 1, y);
                pixelsToCheck.push(x, y + 1);
                pixelsToCheck.push(x, y - 1);
            }
        }

        // put the data back
        graphics.putImageData(imageData, 0, 0);
    }
}

canvasPreview.addEventListener('mousedown', startPainting);
canvasPreview.addEventListener('mouseup', stopPainting);
canvasPreview.addEventListener('mousemove', mousemove);
