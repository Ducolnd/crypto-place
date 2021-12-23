import { sendPixels, activateCardano } from "./wallet";
import { Canvas, colors, init } from "./canvas";

import React, { useRef } from "react";
import { render } from 'react-dom';

// document.addEventListener("#cryptoContainer", event => event.preventDefault());

// React Components

class App extends React.Component {
    constructor(props) {

        super(props);

        this.state = {
            currentColor: [0, 0, 0],
            bufferedPixels: [],
        }
    }

    newPixel = (pos) => {
        console.log(pos);
        const pixel = {
            x: Math.floor(pos.x),
            y: Math.floor(pos.y),
            r: this.state.currentColor[0],
            g: this.state.currentColor[1],
            b: this.state.currentColor[2],
        };

        this.setState({
            bufferedPixels: [...this.state.bufferedPixels, pixel],
        })
    }

    newColor = (index) => {
        let color = colors[index];
        
        this.setState({
            currentColor: color,
        })
    }

    removedPixel = (index) => {
        let another = [...this.state.bufferedPixels];
        another.splice(index, 1);
        
        this.setState({
            bufferedPixels: another,
        })
    }

    render() {
        return (
            <div>
                <div id="pageMain">
                    <div id="cryptoContainer">
                        <Canvas pixels={this.state.bufferedPixels} newPixel={this.newPixel} />
                    </div>
                    <SideBar pixels={this.state.bufferedPixels} removedPixel={this.removedPixel} />
                </div>

                <ColorBox newColor={this.newColor} colors={colors} />
            </div>
        )
    }
}

class SideBar extends React.Component {
    constructor(props) {
        super(props)

        this.state = props;
    }

    handleSubmit = () => {
        let pixels = [];

        // Perform a couple of checks
        let numPixels = Object.keys(canvas.bufferedPixels).length
        if (numPixels == 0 || numPixels >= 100) {
            return;
        }

        // Format correctly
        for (let [_, val] of Object.entries(canvas.bufferedPixels)) {
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
        sendPixels(pixels).then(
            hash => {
                console.log("Transaction was successful: hash", hash);
                $("#hash-success").html(`<p>Success. Transation hash: <a target="_blank" href=${'https://explorer.cardano-testnet.iohkdev.io/en/transaction?id=' + hash}>${hash}</a></p>`);
            },
            failure => {
                $("#hash-success").html(`<p>Failure</p>`);
            }
        );

        // Update sidebar
        newPixel({});
    }

    removedPixel = (key) => {
        this.state.removedPixel(key);
    }

    render() {
        return (
            <div id="infobar">
                <p><b>Buffered Pixels:</b></p>
                <p id="pixelCounter">{this.state.numPlaced}</p>
                <div id="bufferedPixels">
                    {this.props.pixels.map((pixel, i) => {
                        return <div onClick={() => this.removedPixel(i)} key={i} className="pixelentry"><span style={{color: `rgb(${pixel.r},${pixel.g},${pixel.b})`}}>&#9632;</span>({pixel.x}, {pixel.y})</div>
                    })}
                </div>

                <button onClick={this.handleSubmit} type="button" className="btn btn-success" id="submitPixels">Submit Pixels</button>

                <div id="hash-success">Hash will appear here</div>

                <div id="pixelInfo">
                    <p id="pixelInfoText">
                        Mousepos:
                        x <span id="mousex"></span>
                        y <span id="mousey"></span>
                        Zoom: <span id="zoom"></span>
                    </p>
                    <p>Pixel placed by: <span id="pixelPlacedBy"></span></p>
                    <p>Pixel history</p>
                </div>
            </div>
        )
    }
}


function ColorBox(props) {
    let newColor = (index) => {
        props.newColor(index);
    }
    
    return (
        <div className="container">
            <div id="colors">
                <div><h1>Select Color</h1><p> (Click)</p></div>
                {props.colors.map((color, i) => {
                    return (
                        <div onClick={() => newColor(i)} className="colorbox" key={i} style={{ "backgroundColor": rgb(color) }}></div>
                    )
                })}
            </div>
        </div>
    )
}

// Etc
export function renderApp() {
    render(<App />, document.getElementById("root"));
}


function rgb(color) {
    return `rgb(${color[0]}, ${color[1]}, ${color[2]})`
}

// Jquery

//  Add pixel to the sidebar
export function newPixel(bufferedPixels) {
    $("#bufferedPixels").empty();

    for (let [_, pixel] of Object.entries(bufferedPixels)) {
        let element = $(`<div class="pixelentry"><span>&#9632</span>(${pixel.x}, ${pixel.y})</div>`);

        element.children("span").css("color", rgb(pixel.color));
        element.attr("loc", `${pixel.x}${pixel.y}`)

        $("#bufferedPixels").prepend(element);
    }
    let numPixels = Object.keys(bufferedPixels).length;
    $("#pixelCounter").html(numPixels > 10 ? `${numPixels} - too many` : numPixels)
}

$(document).ready(function () {
    renderApp();

    // Activate Cardano
    activateCardano();
    $("#connectBtn").click(function () {
        activateCardano();
    });

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
        for (let [_, val] of Object.entries(canvas.bufferedPixels)) {
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
        sendPixels(pixels).then(
            hash => {
                console.log("Transaction was successful: hash", hash);
                $("#hash-success").html(`<p>Success. Transation hash: <a target="_blank" href=${'https://explorer.cardano-testnet.iohkdev.io/en/transaction?id=' + hash}>${hash}</a></p>`);
            },
            failure => {
                $("#hash-success").html(`<p>Failure</p>`);
            }
        );

        // Update sidebar
        newPixel({});
    })
});