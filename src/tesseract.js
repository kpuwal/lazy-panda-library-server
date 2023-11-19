const tesseract = require("node-tesseract-ocr");
const multer = require("multer");

const config = {
  lang: "eng",
  oem: 2,
  psm: 11,
};

// Configure multer to handle file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const processPicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const imageBuffer = req.file.buffer;

    // Perform OCR using tesseract
    const text = await tesseract.recognize(imageBuffer, config);

    // Optionally, you can delete the uploaded image file
    // Be careful with error handling and ensure proper security measures
    // fs.unlinkSync(req.file.path);
console.log('text: ', text)
    res.json({ result: text });
  } catch (error) {
    console.error("Error processing picture:", error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  processPicture,
};
