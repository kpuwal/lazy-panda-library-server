const Router = require('express-promise-router');
const { googleRequest } = require('./src/google');
const auth = require('./src/auth');
const {
  writeLibrary,
  readLibrary,
  updateLibrary,
  readPicker
} = require('./src/sheets');

const router = new Router();

router.post('/api/book', auth, googleRequest);
router.post('/api/add-book', auth, writeLibrary);
router.get('/api/library', auth, readLibrary);
router.get('/api/picker', auth, readPicker);
router.post('/api/update-library', auth, updateLibrary)

module.exports = router;
