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

const updateTags = async (_req, res) => {
  try {
    const { tags } = _req.body;
    const { sheets } = await authentication();

    await sheets.spreadsheets.values.clear({
      spreadsheetId: PICKER_SHEET_ID,
      range: 'Output',
    });

    const values = tags.reduce((acc, column) => {
      const { title, labels } = column;
      acc.push([title, '', ...labels]);
      return acc;
    }, []);

    // Transpose the array to get titles in separate columns
    const transposedValues = values[0].map((_, colIndex) => values.map(row => row[colIndex]));

    await sheets.spreadsheets.values.update({
      spreadsheetId: PICKER_SHEET_ID,
      range: 'Output!A1',
      valueInputOption: 'RAW',
      resource: {
        values: transposedValues,
      },
    });

    return res.json({ msg: 'Tags updated successfully' });
  } catch (err) {
    console.log('ERROR UPDATING TAGS: ', err);
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
  readTags,
  updateTags
}
