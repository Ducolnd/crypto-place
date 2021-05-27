class Pixel {
    constructor(x, y, color, oldColor) {
        this.x = x;
        this.y = y;
        this.color = color;

        // The pixel it replaces so we can revert it
        this.oldColor = oldColor;
    }

}

// Should be global
let bufferedPixels = {};
let currentColor = 0;

$(document).ready(function() {
    // Load canvas
    let canvas = document.getElementById("cryptoplace")
    let ctx = canvas.getContext('2d')

    // load image
    let image = new Image();
    let imageData;
    image.src = 'images/canvas.png';
    image.onload = function () {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(image, 0, 0);

        imageData = ctx.getImageData(0, 0, image.width, image.height);
        draw()
    }

    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    let mouse;
    let acutalmousee;
    let mouseimagepos = {x: 0, y: 0};
    let zoomPoint = {x: 0, y: 0};
    let cameraOffset = { x: 0, y: 0 };
    let cameraZoom = 1;
    let MAX_ZOOM = 80;
    let MIN_ZOOM = 0.6;
    let SCROLL_SENSITIVITY = 0.15;
    // The part of the canvas that's actually visible
    let visibleSize = {x: 0, y: 0};

    function draw()
    {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        cWidth = canvas.width;
        cHeight = canvas.height;

        visibleSize.x = $("#cryptoContainer").width();
        visibleSize.y = $("#cryptoContainer").height();
        
        ctx.clearRect(0,0, window.innerWidth, window.innerHeight);

        var newCanvas = $("<canvas>")
            .attr("width", image.width)
            .attr("height", image.height)[0]
        newCanvas.getContext("2d").putImageData(imageData, 0, 0);
        
        ctx.translate(cameraOffset.x, cameraOffset.y);

        ctx.translate(zoomPoint.x, zoomPoint.y)
        ctx.scale(cameraZoom, cameraZoom)
        ctx.translate( -zoomPoint.x, -zoomPoint.y )
        
        // No smoothing -> pixel
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(newCanvas, 0, 0)
            
        requestAnimationFrame( draw )
    }

    // Gets the relevant location from a mouse
    function getEventLocation(e) {
        return { x: e.clientX, y: e.clientY }        
    }

    function onPointerDown(e) {
        // Left click
        if (e.which == 1) {
            // Make sure it's in bounds
            if (
                mouseimagepos.x <= image.width && mouseimagepos.y <= image.height &&
                mouseimagepos.x >= 0 && mouseimagepos.y >= 0
            ) { 
                if (Object.keys(bufferedPixels).length <= 100) {
                    let start = coordToIndex(mouseimagepos.x, mouseimagepos.y, image)
        
                    color = colors[currentColor];
    
                    // A pixel has already been placed, don't replace oldPixel
                    if (`${mouseimagepos.x}${mouseimagepos.y}` in bufferedPixels) {
                        bufferedPixels[`${mouseimagepos.x}${mouseimagepos.y}`].color = color
                    } 
                    // No pixel placed yet, oldPixel will be set
                    else {
                        bufferedPixels[`${mouseimagepos.x}${mouseimagepos.y}`] = (new Pixel(mouseimagepos.x, mouseimagepos.y, color, imageData.data.slice(start, start + 3)))
                    }
        
                    setPixelColor(imageData.data, mouseimagepos.x, mouseimagepos.y, color, image);
                    newPixel();               
                }
            }

        // Middle mouse click
        } else if (e.which = 2) {
            isDragging = true
            dragStart.x = getEventLocation(e).x/cameraZoom - cameraOffset.x
            dragStart.y = getEventLocation(e).y/cameraZoom - cameraOffset.y
        }
    }

    function onPointerUp(e) {
        isDragging = false
    }

    // Change on screen coordinate data and MouseImagePos data for calculations
    function adjustMouseImagePos(e) {
        acutalmousee = getMousePos(canvas, e);

        mouseimagepos.x = Math.round((acutalmousee.x - cameraOffset.x) / cameraZoom - (zoomPoint.x / cameraZoom - zoomPoint.x));
        mouseimagepos.y = Math.round((acutalmousee.y - cameraOffset.y) / cameraZoom - (zoomPoint.y / cameraZoom - zoomPoint.y));

        zoomPoint.x = Math.round((visibleSize.x / 2 - cameraOffset.x) / cameraZoom - (zoomPoint.x / cameraZoom - zoomPoint.x));
        zoomPoint.y = Math.round((visibleSize.y / 2 - cameraOffset.y) / cameraZoom - (zoomPoint.y / cameraZoom - zoomPoint.y));

        $("#mousex").html(mouseimagepos.x);
        $("#mousey").html(mouseimagepos.y);
        $("#zoom").html(cameraZoom.toFixed(2));
    }

    function onPointerMove(e)
    {
        mouse = getEventLocation(e);
        adjustMouseImagePos(e);

        if (e.which == 2) {
            if (isDragging)
            {
                cameraOffset.x = (mouse.x/cameraZoom - dragStart.x)
                cameraOffset.y = (mouse.y/cameraZoom - dragStart.y)
            }
        }
    }

    function adjustZoom(e, zoomAmount)
    {
        if (!isDragging)
        {
            cameraZoom *= Math.exp((e.deltaY < 0 ? 1 : -1) * SCROLL_SENSITIVITY);

            // Update on screen stuff
            adjustMouseImagePos(e);
            
            // Keep zoom in bounds
            cameraZoom = Math.min( cameraZoom, MAX_ZOOM )
            cameraZoom = Math.max( cameraZoom, MIN_ZOOM )      
        }
    }


    $("#bufferedPixels").on("click", ".pixelentry", function() {
        let pixel = bufferedPixels[$(this).attr("loc")];
        setPixelColor(imageData.data, pixel.x, pixel.y, pixel.oldColor, image);

        delete bufferedPixels[$(this).attr("loc")];
        newPixel();
    })

    canvas.addEventListener('mousedown', onPointerDown)
    canvas.addEventListener('mouseup', onPointerUp)
    canvas.addEventListener('mousemove', onPointerMove)
    canvas.addEventListener('wheel', (e) => adjustZoom(e, e.deltaY*SCROLL_SENSITIVITY))
});

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
        y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
    };
}

function coordToIndex(x, y, image) {
    return y * (image.width * 4) + x * 4;
}

function setPixelColor(data, x, y, color, image) {
    let start = coordToIndex(x, y, image);

    data[start + 0] = color[0];
    data[start + 1] = color[1];
    data[start + 2] = color[2];
    data[start + 3] = 255;
}