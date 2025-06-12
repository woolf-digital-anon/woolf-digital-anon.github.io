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


  useEffect(() => {
    if (noteModalOpen) {
    //fetch note content from annotations.xml based on noteId (change to use async/await))
      }
      fetch(notesData)
        .then(response => response.text())
        .then(data => {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(data, 'application/xml');
          const noteElement = xmlDoc.querySelector(`note[xml\\:id="${noteId}"]`);
          setXmlContent(xmlDoc.getElementsByTagName("note")[0].textContent || "No content available for this note.");

        })
        .catch(error => {
          console.error("Error fetching annotations.xml:", error);
          setXmlContent("Error loading note content.");
        });
      
  }, [noteModalOpen, noteId]);

  return (
    <div>
      <Modal show={noteModalOpen} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>{noteId}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{xmlContent}</Modal.Body>
      </Modal>
    </div>
  )
}