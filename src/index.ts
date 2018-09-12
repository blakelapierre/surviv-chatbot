//https://api.twitch.tv/kraken/oauth2/authorize?response_type=token&client_id=q6batx0epp608isickayubi39itsckt&redirect_uri=https://twitchapps.com/tmi/&scope=chat_login+channel_editor+channel_feed_edit+channel_feed_read+channel_read+channel_subscriptions+user:edit+clips:edit

import * as tmi from 'tmi.js';

import * as _ from 'lodash';

import * as ws from 'ws';
import * as http from 'http';

import * as url from 'url';

import {writeFileSync, readFileSync} from 'fs';

const db = loadDB();

function sendFunction(socket, fn) {
  if (socket.readyState === 4) socket.send(fn.toString());
}

const addUser = name => {
  if (!db.data.users[name]) {
    const now = new Date().getTime();
    db.data.users[name] = db.data.users[name] || {first: now};
    db.log.push([now, 'user', name]);
  }
  else sayToChannel(`Welcome back, ${name}!`);
}

let lastWriteVersion;
function saveDB() {
  if (lastWriteVersion === undefined || db.log.length > lastWriteVersion) {
    try {
      console.log('writing db...');
      writeFileSync('./db.json', JSON.stringify(db));
      lastWriteVersion = db.log.length;
    }
    catch (e) {
      console.error('error writing database!', e);
    }
  }
}

function loadDB() {
  const newDB = () => ({
    log: [],
    data: {
      users: {}
    }
  });

  try {
    const db = JSON.parse(readFileSync('./db.json').toString()) || newDB();
    console.log('database loaded');
    return db;
  }
  catch (e) {
    console.log('error loading database; NEW DATABASE CREATED!', e);
    return newDB();
  }
}

setInterval(saveDB, 20 * 1000);

const transforms = {
  'user': (time, data, name) => {
    if (!data.users[name]) {
      data.users[name] = {first: time}
    }
    else sayToChannel(`Welcome back, ${name}!`);
  }
};

function rebuildDB(log, transforms) {
  return log.reduce((data, item) => modify(data, item, transforms), {});
}

function modify(data, item, transforms) {
  const [time, transformName, ...rest] = item,
        transform = transforms[transformName];

  return transform(time, data, ...rest) || data;
}

process.on('beforeExit', event => {
  console.log('beforeExit');
  saveDB();
});

process.on('SIGTERM', () => {
  console.log('SIGTERM', );

  saveDB();

  process.exit();
});

import {tacticVoteHtml} from './siteHtml/tacticVote';
import {songRequestHtml} from './siteHtml/songRequest';
import {teamVoteHtml} from './siteHtml/teamVote';


const tacticVoteSocketServer = new ws.Server({port: 9876}),
      teamVotesSocketServer = new ws.Server({port: 9877}),
      songRequestSocketServer = new ws.Server({port: 9878}),
      socketServer = new ws.Server({port: 9872}),
      tacticVotesServer = http.createServer(),
      teamVotesServer = http.createServer(),
      songRequestServer = http.createServer();

let updateTacticVotes = () => {},
    updateTeamVotes = () => {},
    sendSongRequest = r => {};

function startSolo() {

}

const socketMessageHandlers = {
  'register for games': (socket) => {

  }
};

const socketMessageHandler = (socket, message) => {
  console.log({socket, message});
};

const socketEventHandlers = {
  'message': socketMessageHandler
};

const intercept = (fn, ...nargs) => (...args) => fn(...nargs, ...args);

const on = (obj, handlers) => {
  for (let event in handlers) obj.on(event, intercept(handlers[event], obj));
}

const handleSocket = socket => on(socket, socketEventHandlers);

socketServer.on('connection', handleSocket);


tacticVoteSocketServer.on('connection', ws => {
  updateTacticVotes = () => ws.readyState === 4 && ws.send(JSON.stringify({tactic_votes}));

  updateTacticVotes();

  ws.on('message', message => {
    console.log('tacticVoteSocketServer message', {message});
  });
});

teamVotesSocketServer.on('connection', ws => {
  updateTeamVotes = () => ws.send(JSON.stringify({teams}));

  updateTeamVotes();

  ws.on('message', message => {
    console.log('teamVotesSocketServer message', {message});
  });
});

songRequestSocketServer.on('connection', ws => {
  sendSongRequest = request => ws.send(JSON.stringify(request));

  ws.on('messge', message => {
    console.log('songRequestSocketServer message', {message});
  });
});

const serveHtml = (server, html) => server.on('request', (request, response) => {
  response.setHeader('content-type', 'text/html');
  response.end(html);
});

serveHtml(tacticVotesServer, tacticVoteHtml);
serveHtml(teamVotesServer, teamVoteHtml);
serveHtml(songRequestServer, songRequestHtml);

// tacticVotesServer.on('request', (request, response) => {
//   response.setHeader('content-type', 'text/html');
//   response.end(tacticVoteHtml);
// });

// teamVotesServer.on('request', (request, ))

tacticVotesServer.listen(9875);
teamVotesServer.listen(9874);
songRequestServer.listen(9873);



const {username, password} = process.env;

const client = new tmi.client({
  debug: true,
  connection: {
    reconnect: true
  },
  identity: { username, password },
  channels: ['#survivio_tactics']
});

const sayToChannel = (...args) => client.say('#survivio_tactics', `[bot] ${args.join(' ')}`);
const sayToUserInChannel = (message, user) => client.say('#survivio_tactics', `[bot->${user}] ${message}`);

const channelUsers = {'#survivio_tactics': {}};


client.addListener('connecting', (address, port) => console.log('connecting', {address, port}));
client.addListener('connected', (address, port) => {
  console.log('connected', {address, port});
  setTimeout(() => sayToChannel('chatbot connected'), 0);

  setInterval(() => sayToChannel('bot commands: !join, !vote <tactic>, !votes, !team <invite_code>, !sr <song_url>'), 45 * 60 * 1000);
});
client.addListener('disconnected', reason => console.log('disconnected', {reason}));
client.addListener('error', error => console.log('error', {error}));

client.addListener('logon', () => {
  console.log('logon', username);
  console.log('channels', client.getChannels());
});

client.addListener('join', (channel, username, self) => {
  console.log('join', channel, username);

  channelUsers[channel][username] = true;

  addUser(username);
  // db.users[username] = (db.users[username] || {first: new Date().getTime()});
});

client.addListener('part', (channel, username, self) => {
  console.log('part', channel, username);

  delete channelUsers[channel][username];
});

const tactic_votes = {},
      teams = {},
      chatters = {},
      songRequests = {};


function tacticVote(tactic = '', user) {
  console.log('tacticVote', tactic, user);
  if (tactic.length > 12) return sayToChannel('tactic name too long');

  const info = (chatters[user] = chatters[user] || {});

  if (info.vote && info.vote !== tactic) {
    console.log({tactic_votes, info, user});
    delete tactic_votes[info.vote][user];
  }

  info.vote = tactic;

  (tactic_votes[tactic] = tactic_votes[tactic] || {})[user] = true;

  console.log({tactic_votes});

  updateTacticVotes();
  client.say('#survivio_tactics', `new tactic vote: ${tactic} by ${user}`);
}

function sayVotes() {
  const votes = _.reduce(tactic_votes, (agg, votes, tactic) => {
    agg.push([tactic, Object.keys(votes)]);
    return agg;
  }, []);

  const sorted = votes.sort((a, b) => a[1].length <= b[1].length ? -1 : 1);

  sorted.forEach(([tactic, users]) => {
    if (users.length > 0) sayToChannel(`${users.length} ${tactic} - ${users.join(', ')}`);
  });

  if (sorted.length === 0) sayToChannel('No votes :( .... use !vote <vote>');
}

function sayTeams() {
  const teamLinks = Object.keys(teams);

  if (teamLinks.length > 0) {
    sayToChannel(`teams: ${teamLinks.map(l => `http://surviv.io/#${l}`).join(', ')}`);
  }
}

function addTeam(team, user) {
  console.log('team', team);
  (teams[team] = teams[team] || {})[user] = true;

  sayToChannel(`Added team ${team}`)

  updateTeamVotes();
}

function songRequest(uri, user) {
  console.log('song request', uri, user);

  try {
    const parsed = url.parse(uri);

    console.log(parsed);
    // songRequestSocketServer.send(JSON.stringify({request: parsed}));
    sendSongRequest({request: parsed.href});
  }
  catch (e) {
    console.log('bad uri', uri);
  }
}

client.addListener('chat', (channel, userstate, message, self) => {
  console.log('chat', {channel, userstate, message, self});

  if (channel === '#survivio_tactics') {

    if (!self) {
      let match;

      if ((match = message.match(/^\!vote\s+(.*)/)) && match.length > 1) tacticVote(match[1], userstate['display-name']);
      else if ((match = message.match(/^\!votes$/))) sayVotes();
      else if ((match = message.match(/^\!team\s+(\w{4})$/))) addTeam(match[1], userstate['display-name']);
      else if ((match = message.match(/^\!sr\s+(https?:\/\/.*)/)) && match.length > 1) songRequest(match[1], userstate['display-name']);
      else if ((match = message.match(/link/))) sayTeams();
      else if ((match = message.match(/^can/))) sayTeams();
      else if ((match = message.match(/^\!join/))) sayTeams();
      else if ((match = message.match(/^\!start solo$/))) startSolo();
      else if (userstate['display-name'] === 'pokipo2018su' && message == 'bye') sayToChannel('seeya');
      else if (message.toLowerCase() === 'can i play?' || message.toLowerCase() === 'can i play') (sayToChannel('add your team with !team XXXX (replace XXXX with your team code'), sayTeams());
      else if (message.toLowerCase() === 'can i join?' || message.toLowerCase() === 'can i join') (sayToChannel('add your team with !team XXXX (replace XXXX with your team code'), sayTeams());
      else if (userstate['display-name'] !== 'survivio_tactics' && message.toLowerCase() === 'hey') sayToChannel('hi');
      else if (userstate['display-name'] !== 'survivio_tactics' && message.toLowerCase() === 'hey') sayToUserInChannel('hi', userstate['display-name']);
      else if (userstate['display-name'] !== 'survivio_tactics' && message.toLowerCase() === 'hi') sayToUserInChannel('hey', userstate['display-name']);
      else if (userstate['display-name'] !== 'survivio_tactics' && message.toLowerCase() === 'hello') sayToUserInChannel('sup', userstate['display-name']);
    }
  }
});

client.addListener('message', (target, context, msg, self) => console.log('message', {target, context, msg, self}));

client.addListener('notice', (channel, msgid, message) => console.log('notice', {channel, msgid, message}));

client.addListener('roomstate', (channel, state) => console.log('roomstate', {channel, state}));

client.connect();