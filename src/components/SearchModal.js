import React, {useEffect, useRef, useState} from 'react';
import {Modal, Button, Form, ListGroup, Col, Row} from 'react-bootstrap';
import axios from "axios";
import { Document } from "flexsearch";

function SearchModal({ show, switchShow, collectionId, setSearchedItemLocation }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState();
    const [submittedTerm, setSubmittedTerm] = useState('');

    const inputRef = useRef(null);
    const indexRef = useRef(null);

    useEffect(() => {
        if (!collectionId) return;

        fetch(`${process.env.PUBLIC_URL}/files/${collectionId}/index.json`)
            .then(res => res.json())
            .then(data => {
                const index = new Document({
                    tokenize: "strict",
                    document: {
                        id: "id",
                        index: ["text"],
                        store: ["text", "facs", "page", "page_name"]
                    }
                });

                data.forEach((item, i) => {
                    index.add({
                        id: i, // required so each entry has a unique ID
                        text: item.text,
                        facs: item.facs,
                        page: item.page,
                        page_name: item.page_name
                    });
                });

                indexRef.current = index;
            })
            .catch(err => console.error("Failed to load search index", err));
    }, [collectionId]);

    const normalizeResults = (result) => {
        if (result && result['hit-count'] > 0) {
            // If results['hits'] is not an array, make it an array
            return Array.isArray(result['hits']) ? result['hits'] : [result['hits']];
        }
        return [];
    };

    const handleSearch = async () => {
        if (!indexRef.current || !searchTerm) return;

        setSubmittedTerm(searchTerm);
        const results = await indexRef.current.searchAsync(searchTerm, { enrich: true });

        // console.log(results)

        // Flatten result groups
        const flatResults = results.flatMap(group => group.result);
        flatResults.sort((a, b) => {
            return a.id - b.id;
        });
        setResults(flatResults);

    };

    const handleItemClick = (item) => {
        setSearchedItemLocation({
            'facs': item.doc.facs,
            'page': item.doc.page
        })
        switchShow();
    }

    const highlight = (text) => {
        const regex = new RegExp(`(${submittedTerm})`, 'gi');
        return text.replace(regex, "<mark>$1</mark>");
    };

    useEffect(() => {
        if (collectionId) {
            setResults(undefined);
            setSearchTerm('');
        }
    }, [collectionId])

    useEffect(() => {
        if (show && inputRef.current) {
            inputRef.current.focus();  // Focus the input field when the modal is shown
        }
    }, [show]);

    return (
        <Modal show={show} onHide={switchShow}>
            <Modal.Header closeButton>
                <Modal.Title>Search Collection</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group as={Row} className="align-items-center">
                        <Col sm={9}>
                            <Form.Control
                                ref={inputRef}
                                className="search-result-item"
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </Col>
                        <Col sm={3}>
                            <Button variant="primary" onClick={handleSearch} style={{ width: '100%' }}>
                                Search
                            </Button>
                        </Col>
                    </Form.Group>
                </Form>
                <ListGroup className="mt-3" style={{maxHeight: '60vh', overflowY: 'auto'}}>
                    {results ? (results.length > 0 ? results.map((item, index) => (
                        <ListGroup.Item key={index} className="clickable-item" onClick={() => handleItemClick(item)}>
                            <div style={{fontWeight: 'bold', marginBottom: '5px'}}>{item.doc['page_name']}</div>
                            <div
                                className="search-result-item"
                                dangerouslySetInnerHTML={{__html: highlight(item.doc.text)}}
                            />
                        </ListGroup.Item>
                    )) : <div className="text-center mt-3 mb-3">No results found</div>) : ''}
                </ListGroup>
            </Modal.Body>
        </Modal>
    );
}

export default SearchModal;
