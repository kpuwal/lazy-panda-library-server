const Router = require('express-promise-router');
const { googleRequest } = require('./src/google');
const auth = require('./src/auth');
const multer = require('multer');

const {
  writeLibrary,
  readLibrary,
  updateLibrary,
  readPicker,
  filterLibrary,
  readTags,
  updateTags,
  readCategories
} = require('./src/sheets');
const { processPicture } = require('./src/tesseract'); 

// Configure multer to handle file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = new Router();

router.post('/api/book', auth, googleRequest);
router.post('/api/add-book', auth, writeLibrary);
router.get('/api/library', auth, readLibrary);
router.get('/api/picker', auth, readPicker);
router.get('/api/tags', auth, readTags);
router.post('/api/update-tags', auth, updateTags);
router.get('/api/categories', auth, readCategories);
router.post('/api/update-library', auth, updateLibrary);
router.post('/api/filter-library', auth, filterLibrary);
router.post('/api/process-picture', auth, upload.single("image"), processPicture);

module.exports = router;
