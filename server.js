var express = require('express');
var app     = express();
var http    = require('http').Server(app);
var io      = require('socket.io')(http);
var ECT     = require('ect');
var fs      = require('fs');

// ディープコピーが簡単なように JSON で取り扱う
var defaultPositions = JSON.stringify([
    {
        target: 'nose',
        params: { top: 163, left: 462, angle: 0, scaleX: 0.75, scaleY: 0.75, originX: 'center', originY: 'center' }
    },
    {
        target: 'mouth',
        params: { top: 210, left: 470, angle: 0, scaleX: 0.75, scaleY: 0.75, originX: 'center', originY: 'center' }
    },
    {
        target: 'eye_l',
        params: { top: 142, left: 504, angle: 0, scaleX: 0.75, scaleY: 0.75, originX: 'center', originY: 'center' }
    },
    {
        target: 'eye_r',
        params: { top: 140, left: 431, angle: 0, scaleX: 0.75, scaleY: 0.75, originX: 'center', originY: 'center' }
    },
    {
        target: 'cheek_l',
        params: { top: 167, left: 411, angle: 0, scaleX: 0.75, scaleY: 0.75, originX: 'center', originY: 'center' }
    },
    {
        target: 'cheek_r',
        params: { top: 176, left: 517, angle: 0, scaleX: 0.75, scaleY: 0.75, originX: 'center', originY: 'center' }
    },
    {
        target: 'arm_l',
        params: { top: 162, left: 630, angle: 0, scaleX: 0.75, scaleY: 0.75, originX: 'center', originY: 'center' }
    },
    {
        target: 'arm_r',
        params: { top: 178, left: 317, angle: 0, scaleX: 0.75, scaleY: 0.75, originX: 'center', originY: 'center' }
    },
    {
        target: 'leg_l',
        params: { top: 475, left: 547, angle: 0, scaleX: 0.75, scaleY: 0.75, originX: 'center', originY: 'center' }
    },
    {
        target: 'leg_r',
        params: { top: 483, left: 442, angle: 0, scaleX: 0.75, scaleY: 0.75, originX: 'center', originY: 'center' }
    },
    {
        target: 'body',
        params: { top: 257, left: 477, angle: 0, scaleX: 0.75, scaleY: 0.75, originX: 'center', originY: 'center' }
    },
    {
        target: 'head',
        params: { top: 138, left: 477, angle: 0, scaleX: 0.75, scaleY: 0.75, originX: 'center', originY: 'center' }
    }
]);

// 各パーツの位置をサーバー側で一元管理
var positions = JSON.parse(defaultPositions);

io.on('connection', function(socket){
    // 新規ユーザーのロードが完了したら
    socket.on('part_loaded', function(name){
        // 現時点でのパーツの位置を新規ユーザーだけに送信
        positions.forEach(function(item, idx) {
            if (item.target == name) {
                socket.emit('part_change', item);
            }
        });
    });

    // 誰かがパーツを動かしたとき
    socket.on('part_change', function(data){
        // positions を最新のデータで更新
        positions.forEach(function(item, idx) {
            if (item.target == data.target) {
                positions[idx] = data;
            }
        });
        // 動かした本人以外に最新のパーツ位置を送信
        socket.broadcast.emit('part_change', data);
    });

    // 誰かがリセットボタンを押したとき
    socket.on('parts_reset', function(){
        // positions をデフォルトに戻す
        positions = JSON.parse(defaultPositions);
        // 全員にパーツ位置を送信
        positions.forEach(function(item) {
            io.emit('part_change', item);
        });
    });

    // 誰かがスナップショットボタンを押したとき
    socket.on('snapshot_taken', function(z_indicies){

        var sorted_pos = [];
        positions.forEach(function(pos){
            var idx = z_indicies[pos.target];
            sorted_pos[idx] = pos;
        });

        var unixtime = (new Date()).getTime();
        // 現在のパーツ位置を保存
        fs.writeFile(unixtime + '.json', JSON.stringify(sorted_pos));
        // 動かした本人だけをスナップショット画面に誘導
        socket.emit('redirect_to_snapshot', unixtime);
    });
});

// 本番向け socket.io の設定 ----------------------------------------

// io.enable('browser client minification');  // minified されたクライアントファイルを送信する
// io.enable('browser client etag');          // バージョンによって etag によるキャッシングを有効にする
// io.set('log level', 1);                    // ログレベルを設定(デフォルトより下げている)
// io.set('transports', [                     // 全てのtransportを有効にする
//     'websocket',
//     'flashsocket',
//     'htmlfile',
//     'xhr-polling',
//     'jsonp-polling'
// ]);

// Web サーバーの設定 -----------------------------------------------

// app 配下の静的ファイルをホスティング
app.use(express.static('app'));

// テンプレートエンジンの設定
var ectRenderer = ECT({ watch: true, ext: '.ect' });
app.set('views', 'app/views')
app.set('view engine', 'ect')
app.engine('ect', ectRenderer.render);

// メイン画面のレンダリング
app.get('/', function(req, res){
    res.render("main", {});
});

// スナップショット画面のレンダリング
app.get('/snapshot/:snapshot_id', function(req, res){
    fs.readFile(req.params.snapshot_id + '.json', function(err, data) {
        if (err) {
            return res.redirect("/");
        }
        res.render("snapshot", {positions: JSON.parse(data)});
    });
});

http.listen(3000);
