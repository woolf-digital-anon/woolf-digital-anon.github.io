import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import ListGroup from 'react-bootstrap/ListGroup';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { solid } from '@fortawesome/fontawesome-svg-core/import.macro';

export function NoteModalHeader({ 
  modalTitle, 
  xmlDoc, 
  formatNoteContent,
  noteHistory,
  setNoteHistory,
  currentHistoryIndex,
  setCurrentHistoryIndex,
  noteHistoryTitles,
  setNoteHistoryTitles,
  isNavigating,
  setIsNavigating,
  noteModalOpen
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

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

  // Navigation functions
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

  // Reset search when modal closes
  useEffect(() => {
    if (!noteModalOpen) {
      clearSearch();
    }
  }, [noteModalOpen]);

  return (
    <Modal.Header closeButton>
      <div className="d-flex flex-column w-100">
        {/* Main header row */}
        <div className="d-flex align-items-center w-100 mb-2">
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
            <Modal.Title className="mb-0">{modalTitle}</Modal.Title>
          </div>
          
          {/* Search Bar on the right */}
          <div className="position-relative" style={{ width: '250px' }}>
            <InputGroup size="sm">
              <Form.Control
                id="note-search-input"
                type="text"
                placeholder="Search explanatory notes... (Ctrl+F)"
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

        {/* Navigation context row - only show if there's history */}
        {noteHistory.length > 1 && (
          <div className="d-flex justify-content-between align-items-center text-muted" style={{ fontSize: '0.875rem' }}>
            {(() => {
              const { prevTitle, nextTitle } = getNavigationContext();
              return (
                <>
                  <div style={{ maxWidth: '45%' }}>
                    {prevTitle && (
                      <span title={`Previous: ${prevTitle}`} className="text-decoration-none">
                        ← {prevTitle.length > 30 ? prevTitle.substring(0, 30) + '...' : prevTitle}
                      </span>
                    )}
                  </div>
                  <div style={{ maxWidth: '45%' }} className="text-end">
                    {nextTitle && (
                      <span title={`Next: ${nextTitle}`} className="text-decoration-none">
                        {nextTitle.length > 30 ? nextTitle.substring(0, 30) + '...' : nextTitle} →
                      </span>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </Modal.Header>
  );
}