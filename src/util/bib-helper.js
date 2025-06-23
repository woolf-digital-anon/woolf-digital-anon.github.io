// Works cited helper function to format citations in MLA style
export const getWorksCited = (element) => {
  const listBibl = element.querySelector('listBibl');
  if (!listBibl) return '';

  const biblStructs = listBibl.querySelectorAll('biblStruct');
  if (biblStructs.length === 0) return '';

  const citations = [];
  let previousAuthor = '';
  
  biblStructs.forEach(bibl => {
    const type = bibl.getAttribute('type') || 'book'; // Default to book if no type specified
    
    // Extract common information
    const author = extractAuthor(bibl);
    const title = extractTitle(bibl);
    const date = extractDate(bibl);
    
    let citation = '';
    
    switch (type) {
      case 'book':
        citation = formatBook(author, title, bibl, date);
        break;
      case 'bookSection':
        citation = formatBookSection(author, title, bibl, date);
        break;
      case 'dictionaryEntry':
        citation = formatDictionaryEntry(author, title, bibl, date);
        break;
      case 'webpage':
        citation = formatWebpage(author, title, bibl, date);
        break;
      default:
        citation = formatBook(author, title, bibl, date); // Fallback to book format
    }
    
    // Handle repeated author substitution
    if (author === previousAuthor && author !== 'Anonymous') {
      citation = citation.replace(author + '.', '–––.');
    }
    previousAuthor = author;
    
    citations.push(citation);
  });

  if (citations.length > 0) {
    return '<h5>Works Cited</h5><span class="worksCited">' + 
            citations.map(citation => `<p >${citation}</p>`).join('') + 
            '</span>';
  }
  
  return '';
};

// Helper function to extract author information
function extractAuthor(bibl) {
  const authorElements = bibl.querySelectorAll('author');
  if (authorElements.length === 0) return 'Anonymous';
  
  const authors = [];
  
  authorElements.forEach((authorElement, index) => {
    const persName = authorElement.querySelector('persName');
    let authorName = '';
    
    if (persName) {
      const forename = persName.querySelector('forename');
      const surname = persName.querySelector('surname');
      if (forename && surname) {
        // First author: Last, First format
        // Subsequent authors: First Last format
        if (index === 0) {
          authorName = `${surname.textContent.trim()}, ${forename.textContent.trim()}`;
        } else {
          authorName = `${forename.textContent.trim()} ${surname.textContent.trim()}`;
        }
      } else {
        authorName = persName.textContent.trim();
      }
    } else {
      authorName = authorElement.textContent.trim();
    }
    
    authors.push(authorName);
  });
  
  // Format multiple authors according to MLA style
  if (authors.length === 1) {
    return authors[0];
  } else if (authors.length === 2) {
    return `${authors[0]} and ${authors[1]}`;
  } else if (authors.length === 3) {
    return `${authors[0]}, ${authors[1]}, and ${authors[2]}`;
  } else {
    // For 4+ authors, use "et al." after the first author
    return `${authors[0]} et al.`;
  }
}

// Helper function to extract title
function extractTitle(bibl) {
  const titleElement = bibl.querySelector('title');
  return titleElement ? titleElement.textContent.trim() : 'Untitled';
}

// Helper function to extract date
function extractDate(bibl) {
  const dateElement = bibl.querySelector('date');
  if (!dateElement) return 'n.d.';
  
  const when = dateElement.getAttribute('when');
  if (when) {
    const year = when.split('-')[0];
    return year;
  }
  return dateElement.textContent.trim() || 'n.d.';
}

// Helper function to extract publisher information
function extractPublisher(bibl) {
  const publisher = bibl.querySelector('publisher');
  return publisher ? publisher.textContent.trim() : '';
}

// Helper function to extract series information
function extractSeries(bibl) {
  const series = bibl.querySelector('series');
  if (series) {
    const seriesTitle = series.querySelector('title');
    const seriesNumber = series.querySelector('biblScope[unit="volume"], biblScope[unit="number"]');
    
    if (seriesTitle) {
      let seriesInfo = seriesTitle.textContent.trim();
      if (seriesNumber) {
        seriesInfo += ` ${seriesNumber.textContent.trim()}`;
      }
      return seriesInfo;
    }
  }
  return '';
}

// Helper function to extract volume information
function extractVolume(bibl) {
  const volumeElement = bibl.querySelector('biblScope[unit="volume"]');
  if (volumeElement) {
    const volumeNumber = volumeElement.textContent.trim();
    return volumeNumber ? `vol. ${volumeNumber}` : '';
  }
  return '';
}

// Helper function to extract editor information
function extractEditor(bibl) {
  const editorElement = bibl.querySelector('editor');
  if (!editorElement) return '';
  
  const persName = editorElement.querySelector('persName');
  if (persName) {
    const forename = persName.querySelector('forename');
    const surname = persName.querySelector('surname');
    if (forename && surname) {
      return `${forename.textContent.trim()} ${surname.textContent.trim()}`;
    } else {
      return persName.textContent.trim();
    }
  }
  return editorElement.textContent.trim();
}

// Helper function to extract URL
function extractURL(bibl) {
  const urlNote = bibl.querySelector('note[type="url"]');
  return urlNote ? urlNote.textContent.trim() : '';
}

// Helper function to extract container title (for book sections, articles, etc.)
function extractContainerTitle(bibl) {
  const monogr = bibl.querySelector('monogr');
  if (monogr) {
    const containerTitle = monogr.querySelector('title');
    return containerTitle ? containerTitle.textContent.trim() : '';
  }
  return '';
}

// Helper function to extract page numbers
function extractPages(bibl) {
  const biblScope = bibl.querySelector('biblScope[unit="page"]');
  if (biblScope) {
    const from = biblScope.getAttribute('from');
    const to = biblScope.getAttribute('to');
    if (from && to) {
      return `${from}-${to}`;
    }
    return biblScope.textContent.trim();
  }
  return '';
}

// Format book citation
function formatBook(author, title, bibl, date) {
  const publisher = extractPublisher(bibl);
  const series = extractSeries(bibl);
  const url = extractURL(bibl);
  
  let citation = `${author}. <em>${title}</em>. `;
  
  if (series) {
    citation += `${series}. `;
  }
  
  if (publisher) {
    citation += `${publisher}, `;
  }
  
  citation += `${date}`;
  
  if (url) {
    citation += `, <a href="${url} target="_blank">${url}</a>`;
  }
  
  citation += '.';
  return citation;
}

// Format book section citation
function formatBookSection(author, title, bibl, date) {
  const containerTitle = extractContainerTitle(bibl);
  const editor = extractEditor(bibl);
  const publisher = extractPublisher(bibl);
  const volume = extractVolume(bibl);
  const pages = extractPages(bibl);
  const url = extractURL(bibl);
  const formatted_url = url ? `, <a href="${url}" target="_blank">${url}</a>` : '';
  
  let citation = `${author}. "${title}." `;
  
  if (containerTitle) {
    citation += `<em>${containerTitle}</em>`;
  
      if (volume) {
    citation += `, ${volume}`;
  }
  
  if (editor) {
    citation += `, edited by ${editor}`;
  }
  
  citation += ', ';
  }
  
  if (publisher) {
    citation += `${publisher}, `;
  }
  
  citation += `${date}`;
  
  if (pages) {
    citation += `, pp. ${pages}`;
  }
  
  if (url) {
    citation += formatted_url
  }
  
  citation += '.';
  return citation;
}

// Format dictionary entry citation
function formatDictionaryEntry(author, title, bibl, date) {
  const containerTitle = extractContainerTitle(bibl);
  const publisher = extractPublisher(bibl);
  const url = extractURL(bibl);
  const formatted_url = url ? `, <a href="${url}" target="_blank">${url}</a>` : '';
  
  let citation = '';
  
  if (author !== 'Anonymous') {
    citation += `${author}. `;
  }
  
  citation += `"${title}." `;
  
  if (containerTitle) {
    citation += `<em>${containerTitle}</em>, `;
  }
  
  if (publisher) {
    citation += `${publisher}, `;
  }
  
  citation += `${date}`;
  
  if (url) {
    citation += formatted_url
  }
  
  citation += '.';
  return citation;
}

// Format webpage citation
function formatWebpage(author, title, bibl, date) {
  const containerTitle = extractContainerTitle(bibl);
  const publisher = extractPublisher(bibl);
  const url = extractURL(bibl);
  const formatted_url = url ? `, <a href="${url}" target="_blank">${url}</a>` : '';
  const accessDate = extractAccessDate(bibl);
  
  let citation = `${author}. "${title}." `;
  
  if (containerTitle) {
    citation += `<em>${containerTitle}</em>, `;
  }
  
  if (publisher) {
    citation += `${publisher}, `;
  }
  
  citation += `${date}`;
  
  if (url) {
    citation += formatted_url
  }
  
  if (accessDate) {
    citation += `. Accessed ${accessDate}`;
  }
  
  citation += '.';
  return citation;
}

// Helper function to extract access date (for web sources)
function extractAccessDate(bibl) {
  const accessDate = bibl.querySelector('date[type="accessed"]');
  if (accessDate) {
    const when = accessDate.getAttribute('when');
    if (when) {
      // Convert ISO date to MLA format (Day Month Year)
      const date = new Date(when);
      const options = { day: 'numeric', month: 'long', year: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    }
    return accessDate.textContent.trim();
  }
  return '';
}