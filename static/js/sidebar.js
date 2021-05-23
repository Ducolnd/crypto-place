colors = [
    [22,	23,	26],
    [127,	6,	34],
    [214,	36,	17],
    [255,	132, 38],
    [255,	209, 0],
    [250,	253, 255],
    [255,	128, 164],
    [255,	38,	116],
    [148,	33,	106],
    [67,	0,	103,],
    [35,	73,	117,],
    [104,	174,	212],
    [191,	255,	60],
    [16,	210,	117],
    [0,	120,	153],
    [0,	40,	89],
];

$(document).ready(function () {

    for (var i = 0; i < colors.length; i++) {
        color = colors[i];

        let element = $(`<div class='colorbox' id=${i}></div>`)
        console.log(color[0], color[1], color[2])
        element.css("background-color", `rgb(${color[0]}, ${color[1]}, ${color[2]})`)
        $("#colors").append(element);

    }

    $(".colorbox").on("click", function () {
        $("#colors").children().css("border", "none");
        $(this).css("border", "3px black solid")
    })
});