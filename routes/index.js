const express = require('express');
const router = express.Router();

router.get('/', function(req, res, next) {
  res.render('index', { title: 'OML Tutorial' });
});

router.get('/view', function(req, res, next) {
  res.render('view', { title: 'OML Tutorial VRView' });
});

router.get('/view-only', function(req, res, next) {
  res.render('view-only', { title: 'OML Tutorial VRView' });
});

module.exports = router;