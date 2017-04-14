var express = require('express');
var app     = express();
var http    = require('http').Server(app);
var io      = require('socket.io')(http);

// ディープコピーが簡単なように JSON で取り扱う
var defaultPositions = JSON.stringify([
    {
        target: 'nose',
        params: { top: 199, left: 278, angle: 0, scaleX: 1, scaleY: 1, originX: 'center', originY: 'center' }
    },
    {
        target: 'mouth',
        params: { top: 270, left: 283, angle: 0, scaleX: 1, scaleY: 1, originX: 'center', originY: 'center' }
    },
    {
        target: 'eye_l',
        params: { top: 179, left: 333, angle: 0, scaleX: 1, scaleY: 1, originX: 'center', originY: 'center' }
    },
    {
        target: 'eye_r',
        params: { top: 175, left: 230, angle: 0, scaleX: 1, scaleY: 1, originX: 'center', originY: 'center' }
    },
    {
        target: 'cheek_l',
        params: { top: 220, left: 212, angle: 0, scaleX: 1, scaleY: 1, originX: 'center', originY: 'center' }
    },
    {
        target: 'cheek_r',
        params: { top: 227, left: 351, angle: 0, scaleX: 1, scaleY: 1, originX: 'center', originY: 'center' }
    },
    {
        target: 'arm_l',
        params: { top: 217, left: 501, angle: 0, scaleX: 1, scaleY: 1, originX: 'center', originY: 'center' }
    },
    {
        target: 'arm_r',
        params: { top: 228, left: 84, angle: 0, scaleX: 1, scaleY: 1, originX: 'center', originY: 'center' }
    },
    {
        target: 'leg_l',
        params: { top: 630, left: 393, angle: 0, scaleX: 1, scaleY: 1, originX: 'center', originY: 'center' }
    },
    {
        target: 'leg_r',
        params: { top: 644, left: 256, angle: 0, scaleX: 1, scaleY: 1, originX: 'center', originY: 'center' }
    },
    {
        target: 'body',
        params: { top: 344, left: 294, angle: 0, scaleX: 1, scaleY: 1, originX: 'center', originY: 'center' }
    },
    {
        target: 'head',
        params: { top: 181, left: 294, angle: 0, scaleX: 1, scaleY: 1, originX: 'center', originY: 'center' }
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
    socket.on('parts_reset', function(data){
        // positions をデフォルトに戻す
        positions = JSON.parse(defaultPositions);
        // 全員にパーツ位置を送信
        positions.forEach(function(item) {
            io.emit('part_change', item);
        });
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

app.get('/', function(req, res){
  res.sendFile(__dirname + '/app/index.html');
});

// app 配下の静的ファイルをホスティング
app.use(express.static('app'));

http.listen(3000);
