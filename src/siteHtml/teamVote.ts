export const teamVoteHtml =
`<!doctype html>
<html>
  <head>
    <style>
      body {
        margin: 0;
        padding: 0;

        position: fixed;

        left: 0;
        right: 0;
        bottom: 0;
        top: 0;

        display: flex;

        flex-direction: column;
      }

      display {
        flex: 0 0 auto;

        display: flex;

        justify-content: space-between;
      }

      iframe {
        flex: 1 1 auto;

        border: none;
      }
    </style>
    <script>
      var iframe = document.createElement('iframe');
          display = document.createElement('display');

      var teams = document.createElement('teams'),
          currentTeam = document.createElement('current-team'),
          nextTeam = document.createElement('next-team');

      var teamsEl = teams;

      nextTeam.innerHTML = 'Next Team';

      currentTeam.innerHTML = 'To add team, say: !team &lt;invite_code&gt;, in chat';

      display.appendChild(teams);
      display.appendChild(currentTeam);
      display.appendChild(nextTeam);

      var ws = new WebSocket('ws://localhost:9877');
      var teamIndex = 0;

      iframe.src = 'http://surviv.io';

      var teams;

      nextTeam.addEventListener('click', function(event) {
        joinNextTeam();
      });

      ws.addEventListener('message', function(message) {
        console.log('message', message);

        teams = Object.keys(JSON.parse(message.data).teams);

        teamsEl.innerHTML = teams.length > 0 ? JSON.stringify(teams) : 'No teams';

        // if (teams.length > 0) iframe.src = 'http://surviv.io#' + teams[teamIndex = ++teamIndex % teams.length];
        if (teams.length === 1) joinNextTeam();
      });

      function joinNextTeam() {
        if (teams && teams.length > 0) setTeam(teams[teamIndex = ++teamIndex % teams.length]);
      }

      function setTeam(team) {
        iframe.src = 'http://surviv.io#' + team;
        currentTeam.innerHTML = team;
      }

      function load() {
        document.body.appendChild(iframe);
        document.body.appendChild(display);
      }
    </script>
  </head>
  <body onload="load()"></body>
</html>`;