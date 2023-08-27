require('dotenv').config();
const { google } = require('googleapis');
const { cleanPickerData, cleanLibraryData, findRowIndexByTitle } = require('./helper.js');

const SHEET_ID = process.env.GOOGLE_API_SHEET_ID;
const PICKER_SHEET_ID = process.env.GOOGLE_API_PICKER_SHEET_ID;

const writeLibrary = async (_req, res) => {
  try {
    const {
      title,
      author,
      language,
      publishedDate,
      pageCount,
      genre,
      series,
      world,
      readBy,
      boughtGivenOn,
      givenBy,
      lastReadByJowie,
      lastReadByKasia,
    } = _req.body;

    const { sheets } = await authentication();
    const writeReq = await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'LibraryCatalogue',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [
          [ title, author, language, publishedDate, pageCount, genre, series, world, readBy, boughtGivenOn, givenBy, lastReadByJowie, lastReadByKasia ]
        ]
      }
    })

    if (writeReq.status === 200) {
      return res.json({msg: 'Spreadsheet updated successfully!'})
    }
    return res.json({msg: 'Something went wrong while updating the spreadsheet'})
  } catch (err) {
    console.log('ERROR UPDATING THE SHEET: ', err);
    res.status(500).send(err);
  }
}

const updateLibrary = async(_req, res) => {
  try {
    const {
      title,
      author,
      language,
      publishedDate,
      pageCount,
      genre,
      series,
      world,
      readBy,
      boughtGivenOn,
      givenBy,
      lastReadByJowie,
      lastReadByKasia,
    } = _req.body;

    const { sheets } = await authentication();
    const rowIndex = await findRowIndexByTitle(sheets, SHEET_ID,  title);
    console.log('row index: ', rowIndex)

    if (rowIndex !== -1) {
      const updatedRowData = [ title, author, language, publishedDate, pageCount, genre, series, world, readBy, boughtGivenOn, givenBy, lastReadByJowie, lastReadByKasia ];

      const writeReq = await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `LibraryCatalogue!A${rowIndex + 1}:M${rowIndex + 1}`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [updatedRowData],
        },
      });

      if (writeReq.status === 200) {
        console.log('Row updated successfully!');
        return res.json({ msg: 'Spreadsheet row updated successfully!' });
      }
    }
    return res.json({ msg: 'Row not found or something went wrong while updating the spreadsheet' });

  } catch (err) {
    console.log('ERROR UPDATING THE SHEET: ', err);
    res.status(500).send(err);
  }
}

const readLibrary = async (_req, res) => {
  try {
    const { sheets } = await authentication();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'LibraryCatalogue',
    })
    const cleanedData = cleanLibraryData(response.data)
    return res.send(cleanedData);
  } catch (err) {
    return res.status(500).send(err);
  }
}

const readPicker = async (_req, res) => {
  try {
    const { sheets } = await authentication();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: PICKER_SHEET_ID,
      range: 'Output',
      majorDimension: 'COLUMNS'

    });
    const cleanedData = cleanPickerData(response.data);
    return res.send(cleanedData);
  } catch (err) {
    return res.status(500).send(err);
  }
}

const authentication = async () => {
  const auth = new google.auth.GoogleAuth({
    keyFile: './google-credentials.json',
    scopes: process.env.GOOGLE_API_SCOPES,
  })

  const client = await auth.getClient();
  const sheets = google.sheets({
    version: 'v4',
    auth: client,
  })
  return { sheets };
}

module.exports = {
  writeLibrary,
  readLibrary,
  updateLibrary,
  readPicker
}
