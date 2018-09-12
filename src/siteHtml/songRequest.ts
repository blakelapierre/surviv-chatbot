export const songRequestHtml =
`<!doctype html>
<html>
  <style>
    body {
      position: fixed;

      top: 0;
      left: 0;
      right: 0;
      bottom: 0;

      padding: 0;
      margin: 0;

      height: 100%;

      text-align: center;
    }

    iframe {
      width: 100%;
      height: 100%;
    }
  </style>
  <script>
    var songs = [],
        currentSong;

    connectToServer();

    function connectToServer() {
      var ws = new WebSocket('ws://localhost:9878');

      ws.addEventListener('open', function() {
        console.log('ws open');
      });

      ws.addEventListener('close', function() {
        console.log('ws close');

        setTimeout(connectToServer, 1500);
      });

      ws.addEventListener('error', function(error) {
        console.log('ws error!', error);
      });

      ws.addEventListener('message', function(message) {
        console.log(message);

        //var song = JSON.parse(message.data).song;
        var data = JSON.parse(message.data);

        if (data.request) {
          currentSong = data.request;

          document.body.innerHTML = '<div>' + currentSong + '</div><iframe src="' + currentSong + '" ></iframe>';
        }
      });

      // ws.addEventListener('message', function(message) {
      //   console.log(message);

      //   //var song = JSON.parse(message.data).song;
      //   var data = JSON.parse(message.data);

      //   if (data.request) {
      //     songs.push(data);

      //     var html = songs.map(function(song) {
      //       return song.request;
      //     }).join('');

      //     if (songs.length === 1) {
      //       currentSong = songs[0];
      //     }

      //     html += '<div>' + currentSong.request + '</div><iframe src="' + currentSong.request + '" ></iframe>';

      //     document.body.innerHTML = html;
      //   }
      // });
    }
  </script>
  <body>
    <div>https://youtube.com</div>
    <iframe src="https://youtube.com"></iframe>
  </body>
</html>`;