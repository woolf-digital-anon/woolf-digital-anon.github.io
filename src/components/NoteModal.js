import { Fragment, useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import * as AppUtil from '../util/app-util';
import { getEventDate, getEventDateStructured, formatDate } from "../util/date-helper"
import { getNoteTextWithMarkup, findAnnotationById, handleAnnotationLinkClick } from '../util/note-link-helper';
//import { WorksCited } from '../util/bib-helper'
import Container from 'react-bootstrap/Container';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

export function NoteModal({ noteModalOpen, setNoteModalOpen, noteId }) {
  const notesData = "https://raw.githubusercontent.com/JoshuaAPhillips/digital-anon/refs/heads/main/resources/annotations.xml";
  const handleClose = () => setNoteModalOpen(false);
  const navigate = useNavigate();
  const [xmlContent, setXmlContent] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const modalBodyRef = useRef(null);

  // summons modal and data
  useEffect(() => {
    if (noteModalOpen) {
      fetch(notesData)
        .then(response => response.text())
        .then(data => {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(data, 'text/xml');

          const element = findElementById(xmlDoc, noteId);
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

  // Handle click events on internal links after content is rendered
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

      // Cleanup event listeners
      return () => {
        links.forEach(link => {
          link.removeEventListener('click', handleLinkClick);
        });
      };
    }
  }, [xmlContent]);

  // Handle internal link clicks using URL parameters
  const handleInternalLinkClick = (targetId) => {
    // Update the URL parameter while keeping the modal open
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('note', targetId);
      return newParams;
    });
  }

  // helper function using CSS selectors and XPath-like targeting
  const findElementById = (xmlDoc, id) => {
    const selectorTargets = [
      `bibl[xml\\:id="${id}"]`,
      `person[xml\\:id="${id}"]`,
      `place[xml\\:id="${id}"]`
    ];

    for (const selector of selectorTargets) {
      const element = xmlDoc.querySelector(selector);
      if (element) return element;
    }

    // Fallback to attribute-based search
    const allElements = xmlDoc.querySelectorAll('bibl, person, place');
    for (const element of allElements) {
      if (element.getAttribute('xml:id') === id ||
        element.getAttributeNS('http://www.w3.org/XML/1998/namespace', 'id') === id) {
        return element;
      }
    }

    return null;
  };

  // Enhanced function to convert XML to HTML with proper internal links
  const getNoteTextWithMarkup = (element, preserveMarkup = true) => {
    const noteElement = element.querySelector('note');
    if (!noteElement) return null;
    
    if (preserveMarkup) {
      // Clone the note element to avoid modifying the original
      const clonedNote = noteElement.cloneNode(true);
      
      // Find all <rs> elements and convert them to <a> elements
      const rsElements = clonedNote.querySelectorAll('rs');
      rsElements.forEach(rs => {
        // Create a new <a> element
        const anchor = document.createElement('a');
        
        // Get the xml:id attribute (try different ways it might be stored)
        const xmlId = rs.getAttribute('xml:id') || 
                    rs.getAttribute('xmlId') || 
                    rs.getAttributeNS('http://www.w3.org/XML/1998/namespace', 'id');
        
        // Set attributes for internal link handling
        if (xmlId) {
          anchor.href = '#';
          anchor.setAttribute('data-internal-link', 'true');
          anchor.setAttribute('data-target-id', xmlId);
        } else {
          anchor.href = '#';
        }
        
        // Add styling
        anchor.style.cursor = 'pointer';
        anchor.style.color = '#007bff';
        anchor.style.textDecoration = 'underline';
        
        // Copy the text content
        anchor.innerHTML = rs.innerHTML;
        
        // Replace the <rs> element with the <a> element
        rs.parentNode.replaceChild(anchor, rs);
      });
      
      // Convert other common XML tags to HTML equivalents
      const hiElements = clonedNote.querySelectorAll('hi');
      hiElements.forEach(hi => {
        const em = document.createElement('em');
        em.innerHTML = hi.innerHTML;
        hi.parentNode.replaceChild(em, hi);
      });
      
      return clonedNote.innerHTML.trim();
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

    // logic to summon and format data
    switch (tagName) {
      case 'bibl':
        const title = getChildText('title') || 'Bibliography Entry';
        const author = getChildText('author')
        const date = getEventDate(element, 'composition');

        const note_bibl = getNoteTextWithMarkup(element);

        let biblContent = '';
        if (author) biblContent += `<p><strong>Author:</strong> ${author}</p>`;
        if (date) biblContent += `<p><strong>Composition date:</strong> ${formatDate(date)}</p>`;
        if (note_bibl) biblContent += `<p>${note_bibl}</p>`;

        return { title, content: biblContent || getDirectText() };

      case 'person':
        const personName = getChildText('persName') || getChildText('name') || 'Person';
        const birth = getEventDate(element, 'birth');
        const death = getEventDate(element, 'death');

        const note_person = getNoteTextWithMarkup(element);

        let personContent = '';
        if (birth) personContent += `<p><strong>Birth:</strong> ${formatDate(birth)}</p>`;
        if (death) personContent += `<p><strong>Death:</strong> ${formatDate(death)}</p>`;
        if (note_person) personContent += `<p>${note_person}</p>`;

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

        let placeContent = '';
        if (settlement) placeContent += `<p><strong>Settlement:</strong> ${settlement}</p>`;
        if (region) placeContent += `<p><strong>Region:</strong> ${region}</p>`;
        if (country) placeContent += `<p><strong>Country:</strong> ${country}</p>`;
        if (note_place) placeContent += `<p>${note_place}</p>`;

        return {
          title: placeName,
          content: placeContent || getDirectText() || element.textContent.trim()
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
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>{modalTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body 
          ref={modalBodyRef}
          dangerouslySetInnerHTML={{ __html: xmlContent }} 
        />
      </Modal>
    </div>
  );
}