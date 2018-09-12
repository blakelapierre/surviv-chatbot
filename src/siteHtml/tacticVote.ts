export const tacticVoteHtml =
`<!doctype html>
<html>
  <title>tactic votes</title>
  <style>
    body {
      text-align: center;

      background-color: #0f0;
    }

    div {
      display: flex;

      justify-content: center;
      align-items: center;
    }

    voters {

    }

    tactic {
      flex: 0 1 auto;

      padding: 0.25em;

      background-color: #ccc;
      border: solid 1px #fff;
    }

    voter {
      padding: 0.25em;

      font-size: 0.85em;

      background-color: #fff;
      border: solid 1px #ccc;
    }
  </style>
  <script>
    connectToServer();

    function connectToServer() {
      var ws = new WebSocket('ws://localhost:9876');

      ws.addEventListener('open', function() {
        console.log('ws open');
      });

      ws.addEventListener('close', function() {
        console.log('ws close');

        setTimeout(connectToServer, 1500);
      });

      ws.addEventListener('error', function() {
        console.log('ws error!', error);
      });

      ws.addEventListener('message', function(message) {
        console.log(message);

        var tactic_votes = JSON.parse(message.data).tactic_votes;

        var votes = Object.keys(tactic_votes).reduce(function(agg, tactic) {
          agg.push([tactic, Object.keys(tactic_votes[tactic])]);
          return agg;
        }, []);

        var sorted = votes.sort(function(a, b) {
          return a[1].length <= b[1].length ? -1 : 1;
        });

        // const votes = _.reduce(tactic_votes, (agg, votes, tactic) => {
        //   agg.push([tactic, Object.keys(votes)]);
        //   return agg;
        // }, []);

        var html = sorted.reverse().map(function(item) {
          var tactic = item[0],
              voters = item[1];

              if (voters.length > 0) return '<div><voters>' + voters.length + '</voters> - <tactic>' + tactic + '</tactic>' + voters.map(function(voter){return '<voter>' + voter + '</voter>';}) + '</div>';
          return '';
        });

        document.body.innerHTML = html.join('');
        // document.body.innerHTML = JSON.stringify(sorted.reverse());
      });
    }
  </script>
</html>`;