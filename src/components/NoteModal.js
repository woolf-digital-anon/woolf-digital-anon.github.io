import { Fragment, useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import * as AppUtil from '../util/app-util';
import { getEventDate, getEventDateStructured, formatDate } from "../util/date-helper"
import { getNoteTextWithMarkup, findAnnotationById, handleAnnotationLinkClick } from '../util/note-link-helper';
import { getWorksCited } from '../util/bib-helper'
import Container from 'react-bootstrap/Container';
import Modal from 'react-bootstrap/Modal';
import { NoteModalHeader } from './NoteModalHeader';

export function NoteModal({ noteModalOpen, setNoteModalOpen, noteId }) {
  const notesData = "https://raw.githubusercontent.com/JoshuaAPhillips/digital-anon/refs/heads/main/resources/annotations.xml";
  const handleClose = () => setNoteModalOpen(false);
  const navigate = useNavigate();
  const [xmlContent, setXmlContent] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const modalBodyRef = useRef(null);
  const [xmlDoc, setXmlDoc] = useState(null);
  
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

  // Reset history when modal closes
  useEffect(() => {
    if (!noteModalOpen) {
      setNoteHistory([]);
      setCurrentHistoryIndex(-1);
    }
  }, [noteModalOpen]);

  // Handle internal link clicks
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

  const handleInternalLinkClick = (targetId) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('note', targetId);
      return newParams;
    });
  }

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
        <NoteModalHeader
          modalTitle={modalTitle}
          xmlDoc={xmlDoc}
          formatNoteContent={formatNoteContent}
          noteHistory={noteHistory}
          setNoteHistory={setNoteHistory}
          currentHistoryIndex={currentHistoryIndex}
          setCurrentHistoryIndex={setCurrentHistoryIndex}
          noteHistoryTitles={noteHistoryTitles}
          setNoteHistoryTitles={setNoteHistoryTitles}
          isNavigating={isNavigating}
          setIsNavigating={setIsNavigating}
          noteModalOpen={noteModalOpen}
        />
        <Modal.Body 
          ref={modalBodyRef}
          dangerouslySetInnerHTML={{ __html: xmlContent }} 
        />
      </Modal>
    </div>
  );
}