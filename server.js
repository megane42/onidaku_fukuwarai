var express = require('express');
var app     = express();
var http    = require('http').Server(app);
var io      = require('socket.io')(http);
var fs      = require('fs');
var mongo   = require('./mongo');

// ディープコピーが簡単なように JSON で取り扱う
var defaultPositions = JSON.stringify({
    'body'    : { top: 257, left: 477, angle: 0, scaleX: 0.75, scaleY: 0.75, originX: 'center', originY: 'center' },
    'head'    : { top: 138, left: 477, angle: 0, scaleX: 0.75, scaleY: 0.75, originX: 'center', originY: 'center' },
    'nose'    : { top: 163, left: 462, angle: 0, scaleX: 0.75, scaleY: 0.75, originX: 'center', originY: 'center' },
    'mouth'   : { top: 210, left: 470, angle: 0, scaleX: 0.75, scaleY: 0.75, originX: 'center', originY: 'center' },
    'eye_l'   : { top: 142, left: 504, angle: 0, scaleX: 0.75, scaleY: 0.75, originX: 'center', originY: 'center' },
    'eye_r'   : { top: 140, left: 431, angle: 0, scaleX: 0.75, scaleY: 0.75, originX: 'center', originY: 'center' },
    'cheek_l' : { top: 167, left: 411, angle: 0, scaleX: 0.75, scaleY: 0.75, originX: 'center', originY: 'center' },
    'cheek_r' : { top: 176, left: 517, angle: 0, scaleX: 0.75, scaleY: 0.75, originX: 'center', originY: 'center' },
    'arm_l'   : { top: 162, left: 630, angle: 0, scaleX: 0.75, scaleY: 0.75, originX: 'center', originY: 'center' },
    'arm_r'   : { top: 178, left: 317, angle: 0, scaleX: 0.75, scaleY: 0.75, originX: 'center', originY: 'center' },
    'leg_l'   : { top: 475, left: 547, angle: 0, scaleX: 0.75, scaleY: 0.75, originX: 'center', originY: 'center' },
    'leg_r'   : { top: 483, left: 442, angle: 0, scaleX: 0.75, scaleY: 0.75, originX: 'center', originY: 'center' }
});

// 各パーツの位置をサーバー側で一元管理
var positions = JSON.parse(defaultPositions);

io.on('connection', function(socket){

    // 新規ユーザーのロードが完了したら
    socket.on('part_loaded', function(name){
        // 現時点でのパーツの位置を新規ユーザーだけに送信
        socket.emit('part_change', name, positions[name]);
    });

    // 誰かがパーツを動かしたとき
    socket.on('part_change', function(data){
        // positions を最新のデータで更新
        positions[data.target] = data.params;
        // 動かした本人以外に最新のパーツ位置を送信
        socket.broadcast.emit('part_change', data.target, data.params);
    });

    // 誰かがリセットボタンを押したとき
    socket.on('parts_reset', function(){
        // positions をデフォルトに戻す
        positions = JSON.parse(defaultPositions);
        // 全員に各パーツ位置を送信
        for (name in positions) {
            io.emit('part_change', name, positions[name]);
        }
    });

    // 誰かがスナップショットボタンを押したとき
    socket.on('snapshot_taken', function(z_indicies){
        // Z座標情報を保存
        for (name in z_indicies) {
            positions[name]['z_index'] = z_indicies[name];
        }

        var unixtime = (new Date()).getTime();

        // 現在のパーツ位置を外部に保存
        mongo.insertDocument(Object.assign({'timestamp': unixtime}, positions), function(err, result){
            if (err !== null) {
                console.log(err);
            } else {
                // 保存に成功したら、動かした本人だけをスナップショット画面に誘導
                socket.emit('redirect_to_snapshot', unixtime);
            }
        });
    });
});

// Web サーバーの設定 -----------------------------------------------

// app 配下の静的ファイルをホスティング
app.use(express.static('app'));

// テンプレートエンジンの設定
app.set('views', __dirname + '/app/views');
app.set('view engine', 'ejs');

// メイン画面のレンダリング
app.get('/', function(req, res){
    res.render("main", {});
});

// スナップショット画面のレンダリング
app.get('/snapshot/:snapshot_id', function(req, res){
    var unixtime = parseInt(req.params.snapshot_id);
    mongo.findDocumentByTimestamp((unixtime), function(err, result){
        if (err !== null) {
            console.log(err);
            return res.redirect("/");
        }
        res.render("snapshot", {positions: result});
    });
});

http.listen(3000);
