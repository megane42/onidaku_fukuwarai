window.onload = function() {
    var canvas = new fabric.Canvas('canvas');
    var socket = io();
    var partsList = ['body', 'head', 'nose', 'mouth', 'eye_l', 'eye_r', 'cheek_l', 'cheek_r', 'arm_l', 'arm_r', 'leg_l', 'leg_r'];
    var parts = {};

    // Z座標を取れるようにする: https://github.com/kangax/fabric.js/issues/135#issuecomment-187721990
    fabric.Object.prototype.getZIndex = function() {
        return this.canvas.getObjects().indexOf(this);
    }

    partsList.forEach(function(name) {
        var opt = {};
        // let を使って変数をブロックスコープにしないと、処理前に次のループに進んで内容が上書きされてシマウマ
        let img = new fabric.Image(document.getElementById(name), opt);

        ['moving', 'scaling', 'rotating'].forEach(function(event) {
            img.on(event, function() {
                // 大きいパーツはクリックしても最前面に来ないようにする
                if(name != 'body' && name != 'head') {
                    img.bringToFront();
                }
                socket.emit('part_change', {
                    target: name,
                    params: {
                        top     : img.getTop(),
                        left    : img.getLeft(),
                        angle   : img.getAngle(),
                        scaleX  : img.getScaleX(),
                        scaleY  : img.getScaleY(),
                        originX : 'center',
                        originY : 'center'
                    }
                });
            });
        });

        parts[name] = img;
        canvas.add(img);
        socket.emit('part_loaded', name);
    });

    socket.on('part_change', function(data){
        parts[data.target].set(data.params);
        parts[data.target].setCoords();
        if(data.target != 'body' && data.target != 'head') {
            parts[data.target].bringToFront();
        }
        canvas.renderAll();
    });

    socket.on('redirect_to_snapshot', function(snapshot_id){
        window.open('/snapshot/' + snapshot_id, '_blank');
    });

    document.getElementById('reset_button').onclick = function(){
        socket.emit('parts_reset');
    };

    document.getElementById('snapshot_button').onclick = function(){
        var z_indicies = {};
        partsList.forEach(function(name) {
            z_indicies[name] = parts[name].getZIndex();
        });
        socket.emit('snapshot_taken', z_indicies);
    };
};
