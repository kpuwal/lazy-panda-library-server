require('dotenv').config();
const { cleanData } = require('./helper.js');
const axios = require('axios').default;
const GOOGLE_BOOKS = process.env.GOOGLE_BOOKS_URL;

const googleRequest = async (request, response) => {
  const isbn = request.body.isbn;
  axios.get(GOOGLE_BOOKS + isbn)
    .then(function (resp) {
      const cleanedData = cleanData(resp.data);
      return response.status(200).send(cleanedData);
    })
    .catch(function (err) {
      return response.status(500).send(err);
    })
}

module.exports = {
  googleRequest
}
