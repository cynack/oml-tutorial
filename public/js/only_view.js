'use strict';
var socket = io.connect();
var vrview;

socket.on('send_data', function(data) {
  vrview.viewObject(data);
});
socket.on('custom_error', function(data) {
  alert(data);
});
socket.on('disconnect', function() {
  alert('disconnected.');
});

document.getElementById('vrview').onload = function() {
  const VRView = document.getElementById('vrview').contentWindow.VRView;
  vrview = new VRView();
  vrview.Load();
  socket.emit('regist_view', location.hash.slice(1));
  socket.emit('request_data', location.hash.slice(1));
};