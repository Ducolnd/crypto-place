import {sendPixels, activateCardano} from "./wallet";
import { Canvas, colors } from "./canvas";


function rgb(color) {
    return `rgb(${color[0]}, ${color[1]}, ${color[2]})`
}

//  Add pixel to the sidebar
export function newPixel(bufferedPixels) {
    $("#bufferedPixels").empty();

    for(let [_, pixel] of Object.entries(bufferedPixels)) {
        let element = $(`<div class="pixelentry"><span>&#9632</span>(${pixel.x}, ${pixel.y})</div>`);
        
        element.children("span").css("color", rgb(pixel.color));
        element.attr("loc", `${pixel.x}${pixel.y}`)
        
        $("#bufferedPixels").prepend(element);
    }
    let numPixels = Object.keys(bufferedPixels).length;
    $("#pixelCounter").html(numPixels > 10 ? `${numPixels} - too many` : numPixels)
}

$(document).ready(function () {

    let canvas = new Canvas();
    canvas.init();

    // Activate Cardano
    activateCardano();
    $("#connectBtn").click(function() {
        activateCardano();
    });

    // Draw 'select color' 
    for (var i = 0; i < colors.length; i++) {
        let color = colors[i];

        let element = $(`<div class='colorbox' id=${i}></div>`)
        element.css("background-color", `rgb(${color[0]}, ${color[1]}, ${color[2]})`)
        $("#colors").append(element);
    }

    // When a color is selected
    $(".colorbox").click(function () {
        $("#colors").children().css("border", "none");

        window.currentColor = parseInt($(this).attr("id"));
        $(this).css("border", "3px black solid")
    })

    // When pixels are submitted via button
    $("#submitPixels").click(function () {
        let pixels = [];

        // Perform a couple of checks
        let numPixels = Object.keys(canvas.bufferedPixels).length
        if (numPixels == 0 || numPixels >= 100) {
            return;
        }

        // Format correctly
        for(let [_, val] of Object.entries(canvas.bufferedPixels)) {
            pixels.push([
                val.x,
                val.y,
                val.color[0],
                val.color[1],
                val.color[2],
            ])
        }

        console.log(pixels);
        // Construct the transaction with the pixels
        sendPixels(pixels);

        // Update sidebar
        newPixel({});
    })
});