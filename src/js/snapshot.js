window.onload = function() {
    var canvas = new fabric.Canvas('canvas');

    var len = Object.keys(positions).length;
    for (var i = 0; i < len; i++) {
        for (name in positions) {
            if (positions[name]['z_index'] === i) {
                var opt = {};
                // let を使って変数をブロックスコープにしないと、処理前に次のループに進んで内容が上書きされてシマウマ
                let img = new fabric.Image(document.getElementById(name), opt);
                img.set(positions[name]);
                img.setCoords();
                canvas.add(img);
            }
        }
    }

    canvas.renderAll();
};
