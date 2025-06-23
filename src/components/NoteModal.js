import { Fragment, useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import * as AppUtil from '../util/app-util';
import { getEventDate, getEventDateStructured, formatDate } from "../util/date-helper"
import { getNoteTextWithMarkup, findAnnotationById, handleAnnotationLinkClick } from '../util/note-link-helper';
import { getWorksCited } from '../util/bib-helper'
import Container from 'react-bootstrap/Container';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import ListGroup from 'react-bootstrap/ListGroup';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { solid } from '@fortawesome/fontawesome-svg-core/import.macro';

export function NoteModal({ noteModalOpen, setNoteModalOpen, noteId }) {
  const notesData = "https://raw.githubusercontent.com/JoshuaAPhillips/digital-anon/refs/heads/main/resources/annotations.xml";
  const handleClose = () => setNoteModalOpen(false);
  const navigate = useNavigate();
  const [xmlContent, setXmlContent] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const modalBodyRef = useRef(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [xmlDoc, setXmlDoc] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  
  // Navigation history state
  const [noteHistory, setNoteHistory] = useState([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  const [isNavigating, setIsNavigating] = useState(false);
  const [noteHistoryTitles, setNoteHistoryTitles] = useState([]);

  // Load and cache XML document
  useEffect(() => {
    if (noteModalOpen) {
      fetch(notesData)
        .then(response => response.text())
        .then(data => {
          const parser = new DOMParser();
          const xmlDocument = parser.parseFromString(data, 'text/xml');
          setXmlDoc(xmlDocument);

          const element = findElementById(xmlDocument, noteId);
          if (element) {
            const { title, content } = formatNoteContent(element);
            setModalTitle(title);
            setXmlContent(content);
          } else {
            setXmlContent(`No element found with ID: ${noteId}`);
          }
        })
        .catch(e => {
          console.error("Error fetching annotations.xml", e);
          setXmlContent("Error loading note content.");
        });
    }
  }, [noteModalOpen, noteId]);

  // Search functionality
  const performSearch = (query) => {
    if (!xmlDoc || !query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    const results = [];
    const searchTerms = query.toLowerCase().split(/\s+/);

    // Search in all elements (bibl, person, place, object)
    const searchableElements = xmlDoc.querySelectorAll('bibl, person, place, object');
    
    searchableElements.forEach(element => {
      const elementId = element.getAttribute('xml:id') || 
                       element.getAttributeNS('http://www.w3.org/XML/1998/namespace', 'id');
      
      if (!elementId) return;

      // Get searchable text content
      const textContent = element.textContent.toLowerCase();
      const { title } = formatNoteContent(element);
      const titleLower = title.toLowerCase();

      // Check if search terms match
      const matchesSearch = searchTerms.every(term => 
        textContent.includes(term) || titleLower.includes(term)
      );

      if (matchesSearch) {
        // Get a snippet of matching content
        const snippet = getSearchSnippet(element, searchTerms);
        
        results.push({
          id: elementId,
          title: title,
          type: element.tagName.toLowerCase(),
          snippet: snippet,
          element: element
        });
      }
    });

    // Sort results by relevance (title matches first, then content matches)
    results.sort((a, b) => {
      const aHasTitleMatch = searchTerms.some(term => a.title.toLowerCase().includes(term));
      const bHasTitleMatch = searchTerms.some(term => b.title.toLowerCase().includes(term));
      
      if (aHasTitleMatch && !bHasTitleMatch) return -1;
      if (!aHasTitleMatch && bHasTitleMatch) return 1;
      return a.title.localeCompare(b.title);
    });

    setSearchResults(results);
    setShowSearchResults(true);
    setIsSearching(false);
  };

  // Get a snippet of text around search terms
  const getSearchSnippet = (element, searchTerms) => {
    const noteElement = element.querySelector('note');
    const textContent = noteElement ? noteElement.textContent : element.textContent;
    
    // Find the position of the first search term
    let snippetStart = 0;
    for (const term of searchTerms) {
      const index = textContent.toLowerCase().indexOf(term);
      if (index !== -1) {
        snippetStart = Math.max(0, index - 50);
        break;
      }
    }
    
    const snippet = textContent.substring(snippetStart, snippetStart + 150).trim();
    return snippetStart > 0 ? '...' + snippet + '...' : snippet + '...';
  };

  // Handle search input changes
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  // Handle search result selection
  const handleSearchResultClick = (resultId) => {
    setSearchQuery('');
    setShowSearchResults(false);
    
    // Navigate to the selected note
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('note', resultId);
      return newParams;
    });
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  // Track navigation history when noteId changes
  useEffect(() => {
    if (noteId && noteModalOpen && !isNavigating) {
      setNoteHistory(prev => {
        const newHistory = currentHistoryIndex >= 0 ? prev.slice(0, currentHistoryIndex + 1) : [];
        
        if (newHistory.length === 0 || newHistory[newHistory.length - 1] !== noteId) {
          const updatedHistory = [...newHistory, noteId];
          setCurrentHistoryIndex(updatedHistory.length - 1);

          setNoteHistoryTitles(prevTitles => {
            const newTitles = currentHistoryIndex >= 0 ? prevTitles.slice(0, currentHistoryIndex + 1) : [];
            return [...newTitles, modalTitle];
          });

          return updatedHistory;
        }
        return newHistory;
      });
    }
    setIsNavigating(false);
  }, [noteId, noteModalOpen]);

  // Reset history and search when modal closes
  useEffect(() => {
    if (!noteModalOpen) {
      setNoteHistory([]);
      setCurrentHistoryIndex(-1);
      clearSearch();
    }
  }, [noteModalOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!noteModalOpen) return;
      
      // Ctrl/Cmd + F = Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        document.getElementById('note-search-input')?.focus();
      }
      // Escape = Clear search if search is active
      else if (e.key === 'Escape' && (searchQuery || showSearchResults)) {
        e.preventDefault();
        clearSearch();
      }
      // Alt + Left Arrow = Back
      else if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        goBack();
      }
      // Alt + Right Arrow = Forward
      else if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        goForward();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [noteModalOpen, currentHistoryIndex, noteHistory, searchQuery, showSearchResults]);

  // ... rest of your existing functions (goBack, goForward, etc.) remain the same ...

  useEffect(() => {
    if (modalBodyRef.current && xmlContent) {
      const links = modalBodyRef.current.querySelectorAll('a[data-internal-link]');
      
      const handleLinkClick = (e) => {
        e.preventDefault();
        const targetId = e.target.getAttribute('data-target-id');
        if (targetId) {
          handleInternalLinkClick(targetId);
        }
      };

      links.forEach(link => {
        link.addEventListener('click', handleLinkClick);
      });

      return () => {
        links.forEach(link => {
          link.removeEventListener('click', handleLinkClick);
        });
      };
    }
  }, [xmlContent]);

  // Navigation functions (keep your existing ones)
  const goBack = () => {
    if (canGoBack()) {
      setIsNavigating(true);
      const newIndex = currentHistoryIndex - 1;
      setCurrentHistoryIndex(newIndex);
      const targetNoteId = noteHistory[newIndex];
      
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.set('note', targetNoteId);
        return newParams;
      });
    }
  };

  const goForward = () => {
    if (canGoForward()) {
      setIsNavigating(true);
      const newIndex = currentHistoryIndex + 1;
      setCurrentHistoryIndex(newIndex);
      const targetNoteId = noteHistory[newIndex];
      
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.set('note', targetNoteId);
        return newParams;
      });
    }
  };

  const canGoBack = () => {
    return currentHistoryIndex > 0;
  };

  const canGoForward = () => {
    return currentHistoryIndex < noteHistory.length - 1;
  };

  const getNavigationContext = () => {
    const prevTitle = canGoBack() ? noteHistoryTitles[currentHistoryIndex - 1] : null;
    const nextTitle = canGoForward() ? noteHistoryTitles[currentHistoryIndex + 1] : null;
    
    return { prevTitle, nextTitle };
  };

  const handleInternalLinkClick = (targetId) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('note', targetId);
      return newParams;
    });
  }

  // ... keep all your existing helper functions (findElementById, getNoteTextWithMarkup, formatNoteContent) ...

  const findElementById = (xmlDoc, id) => {
    const selectorTargets = [
      `bibl[xml\\:id="${id}"]`,
      `person[xml\\:id="${id}"]`,
      `place[xml\\:id="${id}"]`,
      `object[xml\\:id="${id}"]`
    ];

    for (const selector of selectorTargets) {
      const element = xmlDoc.querySelector(selector);
      if (element) return element;
    }

    const allElements = xmlDoc.querySelectorAll('bibl, person, place, object');
    for (const element of allElements) {
      if (element.getAttribute('xml:id') === id ||
        element.getAttributeNS('http://www.w3.org/XML/1998/namespace', 'id') === id) {
        return element;
      }
    }

    return null;
  };

  const getNoteTextWithMarkup = (element, preserveMarkup = true) => {
    const noteElement = element.querySelector('note');
    if (!noteElement) return null;
    
    if (preserveMarkup) {
      const clonedNote = noteElement.cloneNode(true);
      
      const rsElements = clonedNote.querySelectorAll('rs');
      rsElements.forEach(rs => {
        const anchor = document.createElement('a');
        
        const xmlId = rs.getAttribute('xml:id') || 
                    rs.getAttribute('xmlId') || 
                    rs.getAttributeNS('http://www.w3.org/XML/1998/namespace', 'id');
        
        if (xmlId) {
          anchor.href = '#';
          anchor.setAttribute('data-internal-link', 'true');
          anchor.setAttribute('data-target-id', xmlId);
        } else {
          anchor.href = '#';
        }
        
        anchor.style.cursor = 'pointer';
        anchor.style.color = '#007bff';
        anchor.style.textDecoration = 'underline';
        
        anchor.innerHTML = rs.innerHTML;
        
        rs.parentNode.replaceChild(anchor, rs);
      });
      
      const hiElements = clonedNote.querySelectorAll('hi');
      hiElements.forEach(hi => {
        const em = document.createElement('em');
        em.innerHTML = hi.innerHTML;
        hi.parentNode.replaceChild(em, hi);
      });
      
      let htmlContent = clonedNote.innerHTML.trim();
      
      htmlContent = htmlContent
        .replace(/<lb\s*\/?>/gi, '<br>')
        .replace(/<br\s*\/?>/gi, '<br>')
        .replace(/\n\s*\n/g, '</p><p>')
        .replace(/(?<=>)\s*\n\s*(?=<)/g, ' ')
        .replace(/\n/g, '<br>');
      
      if (htmlContent.includes('</p><p>') && !htmlContent.startsWith('<p>')) {
        htmlContent = '<p>' + htmlContent + '</p>';
      }
      
      return htmlContent;
    } else {
      return noteElement.textContent.trim().replace(/\s+/g, ' ');
    }
  };

  const formatNoteContent = (element) => {
    if (!element) return { title: "Unknown", content: "Element not found" };

    const tagName = element.tagName.toLowerCase();
    const getChildText = (selector) => {
      const child = element.querySelector(selector);
      return child ? child.textContent.trim() : null;
    };

    const getDirectText = () => {
      return Array.from(element.childNodes)
        .filter(node => node.nodeType === Node.TEXT_NODE)
        .map(node => node.textContent.trim())
        .filter(text => text.length > 0)
        .join(' ');
    };

    switch (tagName) {
      case 'bibl':
        const title = getChildText('title') || 'Bibliography Entry';
        const author = getChildText('author')
        const date = getEventDate(element, 'composition');

        const note_bibl = getNoteTextWithMarkup(element);
        const worksCited_bibl = getWorksCited(element);

        let biblContent = '';
        if (author) biblContent += `<p><strong>Author:</strong> ${author}</p>`;
        if (date) biblContent += `<p><strong>Composition date:</strong> ${formatDate(date)}</p>`;
        if (note_bibl) biblContent += `<p>${note_bibl}</p>`;
        if (worksCited_bibl) biblContent += worksCited_bibl;

        return { title, content: biblContent || getDirectText() };

      case 'person':
        const personName = getChildText('persName') || getChildText('name') || 'Person';
        const birth = getEventDate(element, 'birth');
        const death = getEventDate(element, 'death');

        const note_person = getNoteTextWithMarkup(element);
        const worksCited_person = getWorksCited(element);

        let personContent = '';
        if (birth) personContent += `<p><strong>Birth:</strong> ${formatDate(birth)}</p>`;
        if (death) personContent += `<p><strong>Death:</strong> ${formatDate(death)}</p>`;
        if (note_person) personContent += `<p>${note_person}</p>`;
        if (worksCited_person) personContent += worksCited_person;

        return {
          title: personName,
          content: personContent || getDirectText() || element.textContent.trim()
        };

      case 'place':
        const placeName = getChildText('placeName') || getChildText('name') || 'Place';
        const country = getChildText('country');
        const region = getChildText('region');
        const settlement = getChildText('settlement');
        const note_place = getNoteTextWithMarkup(element);
        const worksCited_place = getWorksCited(element);

        let placeContent = '';
        if (settlement) placeContent += `<p><strong>Settlement:</strong> ${settlement}</p>`;
        if (region) placeContent += `<p><strong>Region:</strong> ${region}</p>`;
        if (country) placeContent += `<p><strong>Country:</strong> ${country}</p>`;
        if (note_place) placeContent += `<p>${note_place}</p>`;
        if (worksCited_place) placeContent += worksCited_place;

        return {
          title: placeName,
          content: placeContent || getDirectText() || element.textContent.trim()
        };

      case 'object':
        const objectName = getChildText('objectName') || getChildText('name') || 'Object';
        const note_object = getNoteTextWithMarkup(element);
        const worksCited_object = getWorksCited(element);
        
        let objectContent = '';

        if (note_object) objectContent += `<p>${note_object}</p>`;
        if (worksCited_object) objectContent += worksCited_object;

        return {
          title: objectName,
          content: objectContent || getDirectText() || element.textContent.trim()
        };
        
      default:
        return {
          title: tagName.charAt(0).toUpperCase() + tagName.slice(1),
          content: element.textContent.trim()
        };
    }
  };

return (
  <div>
    <Modal
      show={noteModalOpen}
      onHide={handleClose}
      size="xl"
    >
      <Modal.Header closeButton>
        <div className="d-flex align-items-center w-100">
          {/* Navigation buttons on the left */}
          <div className="me-3">
            <Button 
              variant="outline-secondary" 
              size="sm" 
              onClick={goBack}
              disabled={!canGoBack()}
              title="Go back (Alt + ←)"
              className="me-2"
            >
              ←
            </Button>
            <Button 
              variant="outline-secondary" 
              size="sm" 
              onClick={goForward}
              disabled={!canGoForward()}
              title="Go forward (Alt + →)"
            >
              →
            </Button>
          </div>
          
          {/* Title section - takes up remaining space */}
          <div className="flex-grow-1 me-3">
            <Modal.Title>{modalTitle}</Modal.Title>
            {noteHistory.length > 1 && (
              <div className="d-flex flex-column">
                {(() => {
                  const { prevTitle, nextTitle } = getNavigationContext();
                  return (
                    <div className="d-flex justify-content-between">
                      <small className="text-muted" style={{ maxWidth: '45%' }}>
                        {prevTitle && (
                          <span title={`Previous: ${prevTitle}`}>
                            ← {prevTitle.length > 20 ? prevTitle.substring(0, 20) + '...' : prevTitle}: Previous
                          </span>
                        )}
                      </small>
                      <small className="text-muted" style={{ maxWidth: '45%' }}>
                        {nextTitle && (
                          <span title={`Next: ${nextTitle}`}>
                            Next: {nextTitle.length > 20 ? nextTitle.substring(0, 20) + '...' : nextTitle} →
                          </span>
                        )}
                      </small>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
          
          {/* Search Bar on the right */}
          <div className="position-relative" style={{ width: '250px' }}>
            <InputGroup size="sm">
              <Form.Control
                id="note-search-input"
                type="text"
                placeholder="Search annotations... (Ctrl+F)"
                value={searchQuery}
                onChange={handleSearchChange}
              />
              {searchQuery && (
                <Button 
                  variant="outline-secondary" 
                  onClick={clearSearch}
                  size="sm"
                >
                  <FontAwesomeIcon icon={solid("times")} />
                </Button>
              )}
              <Button variant="outline-secondary" disabled size="sm">
                <FontAwesomeIcon icon={solid("search")} />
              </Button>
            </InputGroup>
            
            {/* Search Results Dropdown */}
            {showSearchResults && (
              <div 
                style={{ 
                  position: 'absolute', 
                  top: '100%', 
                  left: 0, 
                  right: 0, 
                  zIndex: 1000,
                  maxHeight: '300px',
                  overflowY: 'auto',
                  backgroundColor: 'white',
                  border: '1px solid #dee2e6',
                  borderRadius: '0.375rem',
                  boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.15)'
                }}
              >
                {isSearching ? (
                  <div className="p-3 text-center">
                    <FontAwesomeIcon icon={solid("spinner")} spin /> Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  <ListGroup variant="flush">
                    {searchResults.map(result => (
                      <ListGroup.Item 
                        key={result.id}
                        action
                        onClick={() => handleSearchResultClick(result.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <h6 className="mb-1">{result.title}</h6>
                            <p className="mb-1 text-muted small">{result.snippet}</p>
                            <small className="text-muted">{result.type}</small>
                          </div>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                ) : (
                  <div className="p-3 text-center text-muted">
                    No results found for "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Modal.Header>
      <Modal.Body 
        ref={modalBodyRef}
        dangerouslySetInnerHTML={{ __html: xmlContent }} 
      />
    </Modal>
  </div>
);
}