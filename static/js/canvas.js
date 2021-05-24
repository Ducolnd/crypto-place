// Most of the camera movement code comes from this codepen: https://codepen.io/chengarda/pen/wRxoyB
// Thanks random internet person.

class Pixel {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
    }
}

// Should be global
let bufferedPixels = [];
let currentColor = 0;

$(document).ready(function() {
    // Load canvas
    let canvas = document.getElementById("cryptoplace")
    let ctx = canvas.getContext('2d')

    // load image
    var image = new Image();
    let imageData;
    image.src = 'images/cat.png';
    image.onload = function () {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(image, 0, 0);

        imageData = ctx.getImageData(0, 0, image.width, image.height);
        console.log(imageData);
        draw()

    }

    let isDragging = false
    let dragStart = { x: 0, y: 0 }
    let mouse;
    let acutalmousee;
    let mouseimagepos = {x: 0, y: 0}
    let cameraOffset = { x: 0, y: 0 }
    let cameraZoom = 1
    let MAX_ZOOM = 100
    let MIN_ZOOM = 0.1
    let SCROLL_SENSITIVITY = 0.005

    function draw()
    {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        cWidth = canvas.width;
        cHeight = canvas.height;
        
        ctx.clearRect(0,0, window.innerWidth, window.innerHeight)
        // Draw image

        var newCanvas = $("<canvas>")
        .attr("width", imageData.width)
        .attr("height", imageData.height)[0];
        newCanvas.getContext("2d").putImageData(imageData, 0, 0);

        
        ctx.translate(cameraOffset.x, cameraOffset.y);
        // ctx.translate( cWidth / 2, cHeight / 2 )
        ctx.scale(cameraZoom, cameraZoom)
        // ctx.translate( -cWidth / 2 + cameraOffset.x, -cHeight / 2 + cameraOffset.y )
        

        ctx.imageSmoothingEnabled = false;
        // ctx.drawImage(image, 0, 0);
        ctx.drawImage(newCanvas, 0, 0)
            
        requestAnimationFrame( draw )
    }

    // Gets the relevant location from a mouse or single touch event
    function getEventLocation(e)
    {
        if (e.touches && e.touches.length == 1)
        {
            return { x:e.touches[0].clientX, y: e.touches[0].clientY }
        }
        else if (e.clientX && e.clientY)
        {
            return { x: e.clientX, y: e.clientY }        
        }
    }

    function onPointerDown(e)
    {
        if (e.which == 1) {

            if (
                mouseimagepos.x <= image.width && mouseimagepos.y <= image.height &&
                mouseimagepos.x >= 0 && mouseimagepos.y >= 0
            ) { 
                let start = coordToIndex(mouseimagepos.x, mouseimagepos.y, image)
    
                color = colors[currentColor];
                bufferedPixels.push(new Pixel(mouseimagepos.x, mouseimagepos.y, color))
    
                imageData.data[start + 0] = color[0];
                imageData.data[start + 1] = color[1];
                imageData.data[start + 2] = color[2];
                imageData.data[start + 3] = 255;
    
                newPixel();
                
            }
        }
        isDragging = true
        dragStart.x = getEventLocation(e).x/cameraZoom - cameraOffset.x
        dragStart.y = getEventLocation(e).y/cameraZoom - cameraOffset.y
    }

    function onPointerUp(e)
    {
        isDragging = false
        initialPinchDistance = null
        lastZoom = cameraZoom
    }

    function onPointerMove(e)
    {
        mouse = getEventLocation(e);
        acutalmousee = getMousePos(canvas, e);

        mouseimagepos.x = Math.round((acutalmousee.x - cameraOffset.x) / cameraZoom);
        mouseimagepos.y = Math.round((acutalmousee.y - cameraOffset.y) / cameraZoom);

        $("#mousex").html(mouseimagepos.x);
        $("#mousey").html(mouseimagepos.y);

        if (e.which == 2) {
            if (isDragging)
            {
                cameraOffset.x = (mouse.x/cameraZoom - dragStart.x)
                cameraOffset.y = (mouse.y/cameraZoom - dragStart.y)
            }
        }
    }

    function handleTouch(e, singleTouchHandler)
    {
        if ( e.touches.length == 1 )
        {
            singleTouchHandler(e)
        }
        else if (e.type == "touchmove" && e.touches.length == 2)
        {
            isDragging = false
            handlePinch(e)
        }
    }

    let initialPinchDistance = null
    let lastZoom = cameraZoom

    function handlePinch(e)
    {
        e.preventDefault()
        
        let touch1 = { x: e.touches[0].clientX, y: e.touches[0].clientY }
        let touch2 = { x: e.touches[1].clientX, y: e.touches[1].clientY }
        
        // This is distance squared, but no need for an expensive sqrt as it's only used in ratio
        let currentDistance = (touch1.x - touch2.x)**2 + (touch1.y - touch2.y)**2
        
        if (initialPinchDistance == null)
        {
            initialPinchDistance = currentDistance
        }
        else
        {
            adjustZoom( null, currentDistance/initialPinchDistance )
        }
    }

    function adjustZoom(zoomAmount, zoomFactor)
    {
        if (!isDragging)
        {
            if (zoomAmount)
            {
                cameraZoom += zoomAmount
            }
            else if (zoomFactor)
            {
                cameraZoom = zoomFactor*lastZoom
            }
            
            cameraZoom = Math.min( cameraZoom, MAX_ZOOM )
            cameraZoom = Math.max( cameraZoom, MIN_ZOOM )
            
        }
    }

    canvas.addEventListener('mousedown', onPointerDown)
    canvas.addEventListener('touchstart', (e) => handleTouch(e, onPointerDown))
    canvas.addEventListener('mouseup', onPointerUp)
    canvas.addEventListener('touchend',  (e) => handleTouch(e, onPointerUp))
    canvas.addEventListener('mousemove', onPointerMove)
    canvas.addEventListener('touchmove', (e) => handleTouch(e, onPointerMove))
    canvas.addEventListener( 'wheel', (e) => adjustZoom(e.deltaY*SCROLL_SENSITIVITY))
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

