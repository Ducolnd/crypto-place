"use strict";

import React from "react";
import { Image, Stage, Layer, Rect, Group } from "react-konva"
import useImage from 'use-image';

export const colors = [
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

/// React Components

class CanvasImage extends React.Component {
    state = {
        image: null,
        src: "images/canvas.png",
    };

    componentDidMount() {
        this.loadImage();

        setInterval(this.loadImage, 10000); // Reload image every 10 seconds
    }

    componentWillUnmount() {
        this.image.removeEventListener('load', this.handleLoad);
    }
    loadImage = () => {
        // save to "this" to remove "load" handler on unmount        
        this.image = new window.Image();
        this.image.src = this.state.src
        this.image.addEventListener('load', this.handleLoad);
    }
    handleLoad = () => {
        this.setState({
            image: this.image
        });

        this.imageNode.getLayer().batchDraw();
    };
    render() {
        return (
            <Image
                image={this.state.image}
                ref={node => {
                    this.imageNode = node;
                }}
                stroke="black"
                strokeWidth={1}
            />
        );
    }
}

export class Canvas extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            stageScale: 4,
            stageX: 0,
            stageY: 0,
            relativePos: {},
            newPixelCallback: props.newPixel,
        }
    }

    handleWheel = (e) => {
        const scaleBy = 0.94;
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

    onClick = (e) => {
        // New pixel placed
        if (e.evt.button === 2) {
            let shape = e.target;
            let pos = shape.getRelativePointerPosition();

            this.state.newPixelCallback(pos);
        }
    }

    render() {
        return (
            <Stage
                width={window.innerWidth}
                height={window.innerHeight}
                onWheel={this.handleWheel}
                scaleX={this.state.stageScale}
                scaleY={this.state.stageScale}
                x={this.state.stageX}
                y={this.state.stageY}
                onContextMenu={(e) => {
                    e.evt.preventDefault(); // Prevent right click menu
                }}
            >
                <Layer imageSmoothingEnabled={false}>
                    <Group draggable onMouseDown={this.onClick}>

                        <CanvasImage />

                        {this.props.pixels.map((square, i) => {
                            return <Rect
                                x={Math.floor(square.x)}
                                y={Math.floor(square.y)}
                                width={1}
                                height={1}
                                stroke="black"
                                strokeWidth={0.01}
                                fill={`rgb(${square.r},${square.g},${square.b})`}
                                key={i}
                                listening={false}
                            />
                        })}

                    </Group>
                </Layer>
            </Stage>
        )
    }
}