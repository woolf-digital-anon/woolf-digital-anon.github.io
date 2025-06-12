import {fragment, useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import * as AppUtil from '../util/app-util';
import Container from 'react-bootstrap/Container';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

export function NoteModal({ noteModalOpen, setNoteModalOpen, noteId }) {
  const notesData = "https://raw.githubusercontent.com/JoshuaAPhillips/digital-anon/refs/heads/main/resources/annotations.xml";
  const handleClose = () => setNoteModalOpen(false);
  const [xmlContent, setXmlContent] = useState('');

  //helper function to find elements by xml:id

  const findElementById = (xmlDoc, id) => {
      const tagTypes = ['bibl', 'person', 'place']

      for (const tagType of tagTypes) {
        const elements = xmlDoc.getElementsByTagName(tagType);
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          if (element.getAttribute('xml:id') === id || 
              element.getAttributeNS('http://www.w3.org/XML/1998/namespace', 'id') === id) {
            return { element, type: tagType };
          }
        }
      }
      return null;
  }


  useEffect(() => {
    if (noteModalOpen) {
      fetch(notesData)
      .then(response => response.text())
      .then(data => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data, 'application/xhtml+xml')

        const result = findElementById(xmlDoc, noteId)

        if (result) {
          const { element, type } = result;
          setXmlContent(element.textContent || `No content available for this ${type}`)
        } else { 
          setXmlContent(`No person, bibl, or place found with ID: ${noteId}`)
        }
      })
      .catch(e => {
        console.error("Error fetching annotations.xml", e)
        setXmlContent("Error loadingnote content.")
      })
    }
      
  }, [noteModalOpen, noteId]);

  return (
    <div>
      <Modal show={noteModalOpen} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>{noteId}</Modal.Title>
        </Modal.Header>
        <Modal.Body dangerouslySetInnerHTML={{ __html: xmlContent }} />
      </Modal>
    </div>
  )
}