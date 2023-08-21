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

const cleanLibraryData = (data) => {
  const apiData = data.values;
  const headers = apiData[0].map(header => header.trim());
  const transformedData = apiData.slice(1).map(bookData => {
    const bookObject = {};
    headers.forEach((header, index) => {
      bookObject[header] = bookData[index] !== undefined ? bookData[index] : ' ';
    });
    return bookObject;
  });

  return transformedData
}

module.exports = {
  cleanData,
  cleanPickerData,
  cleanLibraryData
}