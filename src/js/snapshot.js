window.onload = function() {
    var canvas = new fabric.Canvas('canvas');
    positions.forEach(function(pos) {
        var name = pos.target;
        var params = pos.params;
        var opt = {};
        // let を使って変数をブロックスコープにしないと、処理前に次のループに進んで内容が上書きされてシマウマ
        let img = new fabric.Image(document.getElementById(name), opt);
        img.set(params);
        img.setCoords();
        canvas.add(img);
    });
    canvas.renderAll();
};
