require('dotenv').config();
const { google } = require('googleapis');
const { cleanPickerData, cleanLibraryData, findRowIndexByTitle, filterLibraryData, organizeTagsData } = require('./helper.js');
const {savedToPandaLibraryMessages, updatedPandaLibraryMessages, errorUpdatingSpreadsheetMessages, errorSavingToLibraryMessages} = require('./constants.js');

function getRandomMessage(messagesArray) {
  const randomIndex = Math.floor(Math.random() * messagesArray.length);
  return messagesArray[randomIndex];
}

const SHEET_ID = process.env.GOOGLE_API_SHEET_ID;
const PICKER_SHEET_ID = process.env.GOOGLE_API_PICKER_SHEET_ID;

const writeLibrary = async (_req, res) => {
  const randomSavedToPandaLibraryMessage = getRandomMessage(savedToPandaLibraryMessages);
  const randomErrorSavingToLibraryMessage = getRandomMessage(errorSavingToLibraryMessages);
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
          [title, author, language, publishedDate, pageCount, genre, series, world, readBy, boughtGivenOn, givenBy, lastReadByJowie, lastReadByKasia]
        ]
      }
    })

    if (writeReq.status === 200) {
      return res.json({msg: randomSavedToPandaLibraryMessage})
    }

    return res.json({msg: randomErrorSavingToLibraryMessage})
  } catch (err) {
    console.log('ERROR saving to SHEET: ', err);
    res.status(500).json({ error: 'Something went wrong while saving to spreadsheet' });;
  }
}

const updateLibrary = async(_req, res) => {
  const randomUpdatedPandaLibraryMessage = getRandomMessage(updatedPandaLibraryMessages);
  const randomErrorUpdatingSpreadsheetMessage = getRandomMessage(errorUpdatingSpreadsheetMessages);
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
      bookTitleForRowUpdate
    } = _req.body;

    const { sheets } = await authentication();
    const rowIndex = await findRowIndexByTitle(sheets, SHEET_ID,  bookTitleForRowUpdate);

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
        return res.json({msg: randomUpdatedPandaLibraryMessage});
      }
    }
    return res.json({msg: randomErrorUpdatingSpreadsheetMessage});

  } catch (err) {
    console.log('ERROR UPDATING THE SHEET: ', err);
    res.status(500).send(err);
  }
}

const filterLibrary = async (_req, res) => {
  try {
    const { type, item } = _req.body.filter; 

    const { sheets } = await authentication();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'LibraryCatalogue',
    });

    const filteredData = filterLibraryData(response.data, type, item);
    return res.send(filteredData);
  } catch (err) {
    console.log('ERROR FILTERING THE LIBRARY: ', err);
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
    const cleanedData = cleanLibraryData(response.data);
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
    console.log('tags: ', response.data)
    const cleanedData = cleanPickerData(response.data);
    return res.send(cleanedData);
  } catch (err) {
    return res.status(500).send(err);
  }
}

const readTags = async (_req, res) => {
  try {
    const { sheets } = await authentication();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: PICKER_SHEET_ID,
      range: 'Output',
      majorDimension: 'COLUMNS'

    });
    const cleanedData = organizeTagsData(response.data.values);
    return res.send({ tags: cleanedData });
  } catch (err) {
    return res.status(500).send(err);
  }
}

const updatePicker = async (_req, res) => {
  try {
    const { columnName, data } = _req.body;

    const { sheets } = await authentication();
    const sheetValues = await sheets.spreadsheets.values.get({
      spreadsheetId: PICKER_SHEET_ID,
      range: 'Output',
      majorDimension: 'ROWS',
    });

    const headers = sheetValues.data.values[0] || [];
    let targetColumnIndex = headers.indexOf(columnName);

    if (targetColumnIndex === -1) {
      // Column doesn't exist, create a new column
      targetColumnIndex = headers.length;

      await sheets.spreadsheets.values.update({
        spreadsheetId: PICKER_SHEET_ID,
        range: `Output!${String.fromCharCode(targetColumnIndex + 65)}1`,
        valueInputOption: 'RAW',
        resource: {
          values: [[columnName]],
        },
      });
    }

    // Clear the entire column starting from row 2
    await sheets.spreadsheets.values.clear({
      spreadsheetId: PICKER_SHEET_ID,
      range: `Output!${String.fromCharCode(targetColumnIndex + 65)}2:${String.fromCharCode(targetColumnIndex + 65)}`,
    });

    // Update the target column with new data starting from row 2
    await sheets.spreadsheets.values.update({
      spreadsheetId: PICKER_SHEET_ID,
      range: `Output!${String.fromCharCode(targetColumnIndex + 65)}2`,
      valueInputOption: 'RAW',
      resource: {
        values: data.map(value => [value]),
      },
    });

    return res.json({ msg: 'Column updated/appended successfully' });
  } catch (err) {
    console.log('ERROR UPDATING PICKER SHEET: ', err);
    res.status(500).send(err);
  }
};


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
  readPicker,
  filterLibrary,
  updatePicker,
  readTags
}
