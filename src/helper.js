const templateKeys = [
  'title',
  'author',
  'language',
  'publishedDate',
  'pageCount',
  'genre',
  'series',
  'world',
  'readBy',
  'boughtGivenOn',
  'givenBy',
  'lastReadByJowie',
  'lastReadByKasia'
];

function lowerCaseAllWordsExceptFirstLetters(string) {
  return string.replace(/\S*/g, function (word) {
      return word.charAt(0) + word.slice(1).toLowerCase();
  });
}

const createPickerCategory = (items) => {
  return items.map((el)  => 
    {
      return {
        label: el,
        value: el
      }
    }
  )
}

const cleanData = (data) => {
  let cleanObj = {}
  if (data.totalItems !== 0) {
    const bookInfo = data.items[0].volumeInfo;
    const bookSubtitle = bookInfo.subtitle === undefined ? "" : bookInfo.subtitle;

    cleanObj = {
      isFound: true,
      title: lowerCaseAllWordsExceptFirstLetters(bookInfo.title + '. ' + bookSubtitle),
      author: lowerCaseAllWordsExceptFirstLetters(bookInfo.authors.join(', ')),
      language: bookInfo.language,
      publishedDate: bookInfo.publishedDate,
      pageCount: bookInfo.pageCount,
    };
  } else {
    cleanObj = { isFound: false };
  }
  return cleanObj
}

const cleanPickerData = (data) => {
  const shiftedValues = data.values.map((item) => {
    item.shift();
    return item;
  })

  return {
    genre: createPickerCategory(shiftedValues[0]),
    series: createPickerCategory(shiftedValues[1]),
    world: createPickerCategory(shiftedValues[2]),
    readBy: createPickerCategory(shiftedValues[3]),
  };
}

const cleanLibraryData = (data, shouldSlice) => {
  const apiData = data.values;
  const dataArray = apiData.slice(1);
  const mappedObjects = dataArray.map(dataArrayItem => {
    const mappedObject = {};
    templateKeys.forEach((key, index) => {
      mappedObject[key] = dataArrayItem[index] || '';
    });
    return mappedObject;
  });
  return mappedObjects;
}

const filterLibraryData = (data, type, item) => {
  const cleanedData = cleanLibraryData(data);
  return cleanedData.filter(itemObj => itemObj[type] === item);
};

async function findRowIndexByTitle(sheets, sheetId, title) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'LibraryCatalogue!A:A',
  });

  const titles = response.data.values;
  const rowIndex = titles.findIndex(row => row[0] === title);

  return rowIndex;
}

const organizeTagsData = (data) => {
  const result = [];

  for (const array of data) {
    const title = array.title;
    const [image, ...labels] = array.labels;
    result.push({ title, image, labels });
  }

  return result;
};


module.exports = {
  cleanData,
  cleanPickerData,
  cleanLibraryData,
  findRowIndexByTitle,
  filterLibraryData,
  organizeTagsData
}