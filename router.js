const Router = require('express-promise-router');
const { googleRequest } = require('./src/google');
const {
  writeLibrary,
  readLibrary,
  readPicker
} = require('./src/sheets');

const router = new Router();

router.post('/api/book', googleRequest);
router.post('/api/add-book', writeLibrary);
router.get('/api/library', readLibrary);
router.get('/api/picker', readPicker);

module.exports = router;
