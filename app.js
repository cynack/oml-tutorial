const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const bodyParser = require('body-parser');
const debug = require('debug')('server');
const http = require('http');


const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
const port = normalizePort(process.env.PORT) || '3000';
app.set('port', port);
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

const index = require('./routes/index');
app.use('/', index);

app.use((req, res, next)=>{
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use((err, req, res, next)=>{
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});


const server = http.createServer(app);
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);
const io = require('socket.io').listen(server);
const clients = Object.create(null);
io.on('connection', (socket)=>{
  socket.on('create_view', ()=>{
    clients[socket.id]=[];
  });
  socket.on('send_data', (data)=>{
    if(clients[socket.id]) {
      clients[socket.id].forEach((view_socket_id)=>{
        if(io.to(view_socket_id))
          io.to(view_socket_id).emit('send_data', data);
      });
    }
  });
  socket.on('regist_view', (view_id)=>{
    if(clients[view_id]) {
      clients[view_id].push(socket.id);
    }
    else socket.emit('custom_error', 'View Not Found.');
  });
  socket.on('request_data', (view_id)=>{
    io.to(view_id).emit('request_data', '');
  });
  socket.on('disconnect', ()=>{
    if(clients[socket.id]) {
      delete clients[socket.id];
    }
  });
});

function normalizePort(val) {
  const port = parseInt(val, 10);
  if (isNaN(port)) {
    return val;
  }
  if (port >= 0) {
    return port;
  }
  return false;
}
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }
 const bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}
function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
