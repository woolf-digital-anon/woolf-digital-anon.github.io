import { Fragment, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as AppUtil from '../util/app-util';
import { getEventDate, getEventDateStructured, formatDate } from "../util/date-helper"
import Container from 'react-bootstrap/Container';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

export function NoteModal({ noteModalOpen, setNoteModalOpen, noteId }) {
  const notesData = "https://raw.githubusercontent.com/JoshuaAPhillips/digital-anon/refs/heads/main/resources/annotations.xml";
  const handleClose = () => setNoteModalOpen(false);
  const [xmlContent, setXmlContent] = useState('');
  const [modalTitle, setModalTitle] = useState('');

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

  // helper function using CSS selectors and XPath-like targeting
  const findElementById = (xmlDoc, id) => {
    // Try CSS selector approach first (more efficient)
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

  // Simplified content formatting using direct element queries
  const formatNoteContent = (element) => {
    if (!element) return { title: "Unknown", content: "Element not found" };

    const tagName = element.tagName.toLowerCase();
    const getChildText = (selector) => {
      const child = element.querySelector(selector);
      return child ? child.textContent.trim() : null;
    };

    const getDirectText = () => {
      // Get direct text content, excluding nested elements
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
        const note = getChildText('note');
        const author = getChildText('author');
        const date = getEventDate(element, 'composition');

        let content = '';
        if (author) content += `<p><strong>Author:</strong> ${author}</p>`;
        if (date) content += `<p><strong>Composition date:</strong> ${formatDate(date)}</p>`;
        if (note) content += `<p>${note}</p>`;

        return { title, content: content || getDirectText() };

      case 'person':
        const personName = getChildText('persName') || getChildText('name') || 'Person';
        const birth = getEventDate(element, 'birth');
        const death = getEventDate(element, 'death');

        const note_person = getChildText('note');

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
        const note_place = getChildText('note');

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
        <Modal.Body dangerouslySetInnerHTML={{ __html: xmlContent }} />
      </Modal>
    </div>
  );
}