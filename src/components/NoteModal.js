import {fragment, useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import * as AppUtil from '../util/app-util';
import Container from 'react-bootstrap/Container';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

export function NoteModal({ noteModalOpen, setNoteModalOpen, NoteTitle }) {
  const handleClose = () => setNoteModalOpen(false);

  return (
    <div>
      <Modal show={noteModalOpen} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>{NoteTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Title>This is a modal.</Modal.Title>
      </Modal>
    </div>
  )
}