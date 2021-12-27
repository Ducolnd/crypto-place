import { sendPixels, activateCardano } from "./wallet";
import { Canvas, colors } from "./canvas";

import React from "react";
import { render } from 'react-dom';

// React Components

class App extends React.Component {
    constructor(props) {

        super(props);

        this.state = {
            currentColor: [0, 0, 0],
            bufferedPixels: {},
            retainPixels: [], // Keep on showing submitted pixels for a while
            transaction: {},
        }
    }

    newPixel = (pos) => {
        if (this.state.bufferedPixels.length > 100) {
            return
        }

        const pixel = {
            x: Math.floor(pos.x),
            y: Math.floor(pos.y),
            r: this.state.currentColor[0],
            g: this.state.currentColor[1],
            b: this.state.currentColor[2],
        };
        const key = `${Math.floor(pos.x)}${Math.floor(pos.y)}`; // Replace if already exists
        
        if (key in this.state.bufferedPixels) {
            let p = this.state.bufferedPixels[key];

            // Remove pixel if color is same 
            if (p.r === pixel.r && p.g === pixel.g && p.b === pixel.b) {
                let n = {...this.state.bufferedPixels};
                delete n[key];

                this.setState({
                    bufferedPixels: {...n},
                })
                
            } else {
                this.setState({
                    bufferedPixels: {...this.state.bufferedPixels, [key]: pixel},
                })
            }

        } else {
            this.setState({
                bufferedPixels: {...this.state.bufferedPixels, [key]: pixel},
            })
        }
    }

    newColor = (index) => {
        let color = colors[index];
        
        this.setState({
            currentColor: color,
        })
    }

    removedPixel = (index) => {
        let another = this.state.bufferedPixels;
        let key = Object.keys(this.state.bufferedPixels)[index];

        delete another.key;
        
        this.setState({
            bufferedPixels: another,
        })
    }


    handleSubmit = () => {
        let pixels = this.state.bufferedPixels;

        // Perform a couple of checks
        let numPixels = pixels.length
        if (numPixels == 0 || numPixels >= 100) {
            return;
        }

        // Construct the transaction with the pixels
        sendPixels(Object.values(pixels)).then(
            hash => {
                console.log("The transaction was successful!", hash);
                $("#hash-success").html(`<p style="overflow-wrap: break-word;">The transaction was successful!: <a target="_blank" href=${'https://explorer.cardano-testnet.iohkdev.io/en/transaction?id=' + hash}>${hash}</a></p>`);

                // Remove pixels from sidebar and update retainpixels
                this.setState({
                    retainPixels: [...this.state.retainPixels, ...Object.values(this.state.bufferedPixels)],
                    bufferedPixels: [],
                });
        
                // After two minutes the canvas has most likely already been updated so we remove the pixels
                setTimeout(() => {
                    this.setState({
                        retainPixels: [],
                    })
                },  2 * 60 * 1000);
            },
            failure => {
                console.log("Failure on computing transactoin:", failure);
                $("#hash-success").html(`<p>Failure on computing transaction</p>`);
            }
        );
    }

    render() {
        return (
            <div className="container-fluid">
                <div className="row">

                    <div className="col-lg-3">
                        <ColorBox newColor={this.newColor} colors={colors} />
                    </div>

                    <div className="col-lg-7">
                        <div id="pageMain">
                            <div id="cryptoContainer">
                                <Canvas pixels={[...this.state.retainPixels, ...Object.values(this.state.bufferedPixels)]} newPixel={this.newPixel} />
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-2">
                        <SideBar pixels={Object.values(this.state.bufferedPixels)} handleSubmit={this.handleSubmit} removedPixel={this.removedPixel} />
                    </div>

                </div>
            </div>
        )
    }
}

class SideBar extends React.Component {
    constructor(props) {
        super(props)
    }

    handleSubmit = () => {
        this.props.handleSubmit();
    }

    removedPixel = (key) => {
        this.props.removedPixel(key);
    }

    render() {
        const numPixels = this.props.pixels.length;

        return (
            <div id="sidebar">
                <p><b>Buffered Pixels:</b></p>
                <p id="pixelCounter">{numPixels} {numPixels > 100 && " - can't place more than 100 pixels!!"}</p>
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

class ColorBox extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            selected: 1,
        }
    }
    
    newColor = (index) => {
        this.setState({
            selected: index,
        });
        this.props.newColor(index);
    }
    
    render() {
        return (
                <div id="colors">
                    <div><h1>Select Color</h1><p> (Click)</p></div>
                    {this.props.colors.map((color, i) => {
                        if (i === this.state.selected) {
                            return (
                                <div style={{border: "3px black solid", backgroundColor: rgb(color)}} onClick={() => this.newColor(i)} className="colorbox" key={i}></div>
                            )
                        } else {
                            return (
                                <div onClick={() => this.newColor(i)} className="colorbox" key={i} style={{ "backgroundColor": rgb(color) }}></div>
                            )
                        }
                    })}
                </div>
        )
    }
}

// Etc
export function renderApp() {
    render(<App />, document.getElementById("root"));
}


function rgb(color) {
    return `rgb(${color[0]}, ${color[1]}, ${color[2]})`
}

// Jquery

$(document).ready(function () {
    renderApp();

    let element = <button id="connectBtn" className="btn btn-dark">Click to connect</button>
    render(element, document.getElementById("connected-root"))

    // Activate Cardano
    activateCardano();
    $("#connectBtn").click(function () {
        activateCardano();
    });

    $("#pageMain").bind("wheel mousewheel", function(e) {e.preventDefault()});
});