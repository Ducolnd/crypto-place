import { newPixel } from "./sidebar";

export let colors = [
    [22, 23, 26],
    [127, 6, 34],
    [214, 36, 17],
    [255, 132, 38],
    [255, 209, 0],
    [250, 253, 255],
    [255, 128, 164],
    [255, 38, 116],
    [148, 33, 106],
    [67, 0, 103,],
    [35, 73, 117,],
    [104, 174, 212],
    [191, 255, 60],
    [16, 210, 117],
    [0, 120, 153],
    [0, 40, 89],
];

class Pixel {
    constructor(x, y, color, oldColor) {
        this.x = x;
        this.y = y;
        this.color = color;

        // The pixel it replaces so we can revert it
        this.oldColor = oldColor;
    }
}

export class Canvas {
    bufferedPixels = {};

    isDragging = false;
    dragStart = { x: 0, y: 0 };
    mouseimagepos = { x: 0, y: 0 };
    zoomPoint = { x: 0, y: 0 };
    cameraOffset = { x: 0, y: 0 };
    cameraZoom = 1;
    MAX_ZOOM = 80;
    MIN_ZOOM = 0.6;
    SCROLL_SENSITIVITY = 0.15;
    visibleSize = { x: 0, y: 0 };
    mouse;
    acutalmousee;
    canvas;
    color;
    image;
    imageData;

    constructor() {
        console.log("Creating canvas");

        this.canvas = document.getElementById("cryptoplace");
        this.ctx = this.canvas.getContext('2d');
    }

    init() {
        console.log("Initializing  Canvas");
        window.currentColor = 0;

        this.image = new Image();
        this.imageData;
        this.image.src = 'images/canvas.png';
        this.image.onload = () => {
            this.ctx.imageSmoothingEnabled = false;
            this.ctx.drawImage(this.image, 0, 0);

            this.imageData = this.ctx.getImageData(0, 0, this.image.width, this.image.height);

            this.setupEvents();
            
            this.draw()
        }
    }

    draw() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this.visibleSize.x = $("#cryptoContainer").width();
        this.visibleSize.y = $("#cryptoContainer").height();

        this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        var newCanvas = $("<canvas>")
            .attr("width", this.image.width)
            .attr("height", this.image.height)[0]
        newCanvas.getContext("2d").putImageData(this.imageData, 0, 0);

        this.ctx.translate(this.cameraOffset.x, this.cameraOffset.y);

        this.ctx.translate(this.zoomPoint.x, this.zoomPoint.y)
        this.ctx.scale(this.cameraZoom, this.cameraZoom)
        this.ctx.translate(-this.zoomPoint.x, -this.zoomPoint.y)

        // No smoothing -> pixel
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.drawImage(newCanvas, 0, 0)

        requestAnimationFrame(() => this.draw())
    }

    onPointerDown(e) {
        e.preventDefault();

        // Left click
        if (e.which == 1) {
            // Make sure it's in bounds
            if (
                this.mouseimagepos.x <= this.image.width && this.mouseimagepos.y <= this.image.height &&
                this.mouseimagepos.x >= 0 && this.mouseimagepos.y >= 0
            ) {
                if (Object.keys(this.bufferedPixels).length <= 100) {
                    let start = coordToIndex(this.mouseimagepos.x, this.mouseimagepos.y, this.image)

                    let color = colors[window.currentColor];

                    // A pixel has already been placed, don't replace oldPixel
                    if (`${this.mouseimagepos.x}${this.mouseimagepos.y}` in this.bufferedPixels) {
                        this.bufferedPixels[`${this.mouseimagepos.x}${this.mouseimagepos.y}`].color = color
                    }
                    // No pixel placed yet, oldPixel will be set
                    else {
                        this.bufferedPixels[`${this.mouseimagepos.x}${this.mouseimagepos.y}`] = (new Pixel(this.mouseimagepos.x, this.mouseimagepos.y, color, this.imageData.data.slice(start, start + 3)))
                    }

                    setPixelColor(this.imageData.data, this.mouseimagepos.x, this.mouseimagepos.y, color, this.image);
                    newPixel(this.bufferedPixels);
                }
            }

            // Middle mouse click
        } else if (e.which == 2) {
            this.isDragging = true
            this.dragStart.x = getEventLocation(e).x / this.cameraZoom - this.cameraOffset.x
            this.dragStart.y = getEventLocation(e).y / this.cameraZoom - this.cameraOffset.y
        } else if (e.button == 2) {
            // Right Click
        }
    }

    onPointerUp(_) {
        this.isDragging = false
    }

    // Change on screen coordinate data and MouseImagePos data for calculations
    adjustMouseImagePos(e) {
        this.acutalmousee = getMousePos(this.canvas, e);

        this.mouseimagepos.x = Math.floor((this.acutalmousee.x - this.cameraOffset.x) / this.cameraZoom - (this.zoomPoint.x / this.cameraZoom - this.zoomPoint.x));
        this.mouseimagepos.y = Math.floor((this.acutalmousee.y - this.cameraOffset.y) / this.cameraZoom - (this.zoomPoint.y / this.cameraZoom - this.zoomPoint.y));

        this.zoomPoint.x = Math.round((this.visibleSize.x / 2 - this.cameraOffset.x) / this.cameraZoom - (this.zoomPoint.x / this.cameraZoom - this.zoomPoint.x));
        this.zoomPoint.y = Math.round((this.visibleSize.y / 2 - this.cameraOffset.y) / this.cameraZoom - (this.zoomPoint.y / this.cameraZoom - this.zoomPoint.y));

        // Show zoom and mouse position on sidebar
        $("#mousex").html(this.mouseimagepos.x);
        $("#mousey").html(this.mouseimagepos.y);
        $("#zoom").html(this.cameraZoom.toFixed(2));
    }

    onPointerMove(e) {
        this.mouse = getEventLocation(e);
        this.adjustMouseImagePos(e);

        if (e.which == 2) {
            if (this.isDragging) {
                this.cameraOffset.x = (this.mouse.x / this.cameraZoom - this.dragStart.x)
                this.cameraOffset.y = (this.mouse.y / this.cameraZoom - this.dragStart.y)
            }
        }
    }

    adjustZoom(e) {
        if (!this.isDragging) {
            this.cameraZoom *= Math.exp((e.deltaY < 0 ? 1 : -1) * this.SCROLL_SENSITIVITY);

            // Update on screen stuff
            this.adjustMouseImagePos(e);

            // Keep zoom in bounds
            this.cameraZoom = Math.min(this.cameraZoom, this.MAX_ZOOM)
            this.cameraZoom = Math.max(this.cameraZoom, this.MIN_ZOOM)
        }
    }

    setupEvents() {
        function resetPixel(inx) {
            let pixel = this.bufferedPixels[inx];
            if (pixel != null) {
                setPixelColor(this.imageData.data, pixel.x, pixel.y, pixel.oldColor, this.image);

                delete this.bufferedPixels[inx];
                newPixel(this.bufferedPixels);
            }
        }

        this.canvas.addEventListener('mousedown', (e) => this.onPointerDown(e))
        this.canvas.addEventListener('mouseup', (e) => this.onPointerUp(e))
        this.canvas.addEventListener('mousemove', (e) => this.onPointerMove(e))
        this.canvas.addEventListener('wheel', (e) => this.adjustZoom(e))

        let timeout;
        // If mouse is not moved, pixels is deleted
        $("#cryptoplace").on("mousedown", (e) => {
            if (e.button == 1) {
                const bufferedMouseimagepos = Object.assign({}, this.mouseimagepos);

                timeout = setTimeout(function () {
                    if (JSON.stringify(bufferedMouseimagepos) === JSON.stringify(this.mouseimagepos)) {
                        resetPixel(`${bufferedMouseimagepos.x}${bufferedMouseimagepos.y}`);
                    }
                }, 125);
            }
        }).on("mouseup mouseleave", (e) => {
            if (e.button == 1) {
                clearTimeout(timeout);
            }
        });


        $("#bufferedPixels").on("click", ".pixelentry", function () {
            resetPixel($(this).attr("loc"));
        })
    }
}

function getEventLocation(e) {
    return { x: e.clientX, y: e.clientY }
}

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