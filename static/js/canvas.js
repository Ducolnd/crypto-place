"use strict";

import { newPixel } from "./sidebar";
import Konva from "konva";
import React from "react";
import { render } from "react-dom";
import { Image, Stage, Layer, Text, Rect, Group } from "react-konva"
import useImage from 'use-image';

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

export function init() {
    render(<App />, document.getElementById("place"));
}

/// React Components

function CanvasImage() {
    const [image] = useImage("images/canvas.png");
    return <Image image={image} />
}

export class Canvas extends React.Component {
    state = {
        stageScale: 1,
        stageX: 0,
        stageY: 0,
        relativePos: {},
        pixels: [],
    }

    handleWheel = (e) => {
        const scaleBy = 1.04;
        const stage = e.target.getStage();
        const oldScale = stage.scaleX();
        const mousePointTo = {
            x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
            y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale
        };

        const newScale = e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;

        this.setState({
            stageScale: newScale,
            stageX: -(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale,
            stageY: -(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale
        });
    }

    getPos = (e) => {
        let shape = e.target;
        let pos = shape.getRelativePointerPosition();

        console.log(pos);

        let pixels = [...this.state.pixels, {
            x: pos.x,
            y: pos.y,
        }];

        this.setState({ pixels });
    }

    updateState() {

    }

    render() {
        return (
            <Stage
                width={window.innerWidth}
                height={window.innerHeight}
                onWheel={this.handleWheel}
                // onMouseDown={this.handleMouseMove}
                // onMouseMove={this.handleMouseMove}
                scaleX={this.state.stageScale}
                scaleY={this.state.stageScale}
                x={this.state.stageX}
                y={this.state.stageY}
            >


                <Layer imageSmoothingEnabled={false}>

                    <Group draggable onMouseDown={this.getPos}>

                        <CanvasImage/>
                        <Rect x={100} y={100} width={100} height={100} fill="red" />

                        {this.state.pixels.map((square, i) => {                            
                            return <Rect
                                x={Math.floor(square.x)}
                                y={Math.floor(square.y)}
                                width={1}
                                height={1}
                                stroke="black"
                                strokeWidth={0.01}
                                fill="red"
                                key={i}
                            />
                        })}

                    </Group>

                    <Text text="Try click on rect" />
                </Layer>
            </Stage>
        )
    }
}

class App extends React.Component {
    render() {
        return (
            <Canvas />
        )
    }
}