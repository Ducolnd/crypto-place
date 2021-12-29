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
    [255, 255, 255],
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
        src: process.env.NETWORK == "testnet" ? "/images/testnet.png" : "/images/mainnet.png",
    };

    componentDidMount() {
        this.loadImage();

        setInterval(this.loadImage, 10000); // Reload image every 10 seconds
    }

    componentWillUnmount() {
        this.image.removeEventListener('load', this.handleLoad);
    }
    loadImage = () => {
        if (!document.hidden) { // Detect if user is active
            this.image = new window.Image();
            this.image.src = this.state.src + "?cache=" + Date.now();
            this.image.addEventListener('load', this.handleLoad);
        }
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
            />
        );
    }
}

export class Canvas extends React.Component {
    constructor(props) {
        super(props);

        this.drawing = false;
        this.pos = [];

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
            this.drawing = true;

            let shape = e.target;
            let pos = shape.getRelativePointerPosition();

            let key = `${Math.floor(pos.x)}${Math.floor(pos.y)}`;

            if (!this.pos.includes(key)) {
                this.state.newPixelCallback(pos);
                this.pos.push(`${Math.floor(pos.x)}${Math.floor(pos.y)}`);
            }
        }
    }

    onMove = (e) => {
        if (!this.drawing) {
            return;
        }

        let shape = e.target;
        let pos = shape.getRelativePointerPosition();

        let key = `${Math.floor(pos.x)}${Math.floor(pos.y)}`;

        if (!this.pos.includes(key)) {
            this.state.newPixelCallback(pos);
            this.pos.push(`${Math.floor(pos.x)}${Math.floor(pos.y)}`);
        }
    }

    onEnd = (e) => {
        if (e.evt.button === 2) {
            this.drawing = false;
            this.pos = [];
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
                    <Group
                        draggable
                        onMouseDown={this.onClick}
                        onMouseMove={this.onMove}
                        onMouseUp={this.onEnd}
                    >
                        <Rect
                            stroke="black"
                            strokeWidth={1}
                            width={100}
                            height={100}
                            listening={false}
                        />

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