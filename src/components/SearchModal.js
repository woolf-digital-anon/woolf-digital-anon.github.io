import React, {useEffect, useRef, useState} from 'react';
import {Button, Col, Form, ListGroup, Modal, Row} from 'react-bootstrap';
import Fuse from "fuse.js";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {solid} from '@fortawesome/fontawesome-svg-core/import.macro'

function SearchModal({ show, switchShow, collectionId, setSearchedItemLocation }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState();
    const inputRef = useRef(null);
    const indexRef = useRef(null);

    useEffect(() => {
        if (!collectionId) return;

        fetch(`${process.env.PUBLIC_URL}/files/consolidated_index.json`)
            .then(res => res.json())
            .then(data => {
                const {rawDocs, index} = data;
                const fuseIndex = Fuse.parseIndex(index);

                indexRef.current = new Fuse(rawDocs, {
                    keys: ['text', 'collection', 'page_name'],
                    includeScore: true,
                    includeMatches: true,
                    ignoreDiacritics: true,
                    minMatchCharLength: 2,
                    threshold: 0.2
                }, fuseIndex);
            })
            .catch(err => console.error("Failed to load search index", err));
    }, [collectionId]);

    const handleSearch = async () => {
        if (!indexRef.current || !searchTerm) return;

        let results = indexRef.current.search(searchTerm);

        // if (collectionId) {
        //     results = results.filter(result => 
        //         result.item.collection === collectionId
        //     );
        // }

        setResults(results);

    };

    const handleItemClick = (item) => {
        const { collection, page_name, page, facs } = item.item;
        
        // If the result is from a different collection, we need to navigate there
        if (collection !== collectionId) {
            // For cross-collection navigation, you'll need to handle this in the parent
            // Pass the full navigation info including collection change
            setSearchedItemLocation({
                'facs': facs,
                'page': page,
                'page_name': page_name,
                'collection': collection,
                'crossCollection': true // Flag to indicate collection change needed
            });
        } else {
            // Same collection, just navigate to the page
            setSearchedItemLocation({
                'facs': facs,
                'page': page,
                'page_name': page_name,
                'collection': collection
            });
    }
    
    switchShow(); // Close the modal
    }

    const highlightFromFuse = (item) => {
        const match = item.matches?.find(m => m.key === 'text');
        if (!match) return item.item.text;

        const text = item.item.text;
        let result = '';
        let lastIndex = 0;

        // matches are arrays of [start, end] indices
        match.indices.forEach(([start, end]) => {
            result += text.slice(lastIndex, start);
            result += `<mark>${text.slice(start, end + 1)}</mark>`;
            lastIndex = end + 1;
        });

        result += text.slice(lastIndex);
        return result;
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
                <Modal.Title>
                    Search the Drafts
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group as={Row} className="align-items-center">
                        <Col sm={9}>
                            <Form.Control
                                ref={inputRef}
                                className="search-result-item"
                                type="text"
                                placeholder="Search drafts..."
                                value={searchTerm}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSearch();
                                    }
                                }}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </Col>
                        <Col sm={3}>
                            <Button variant="primary" onClick={handleSearch} style={{ width: '100%' }}>
                                <FontAwesomeIcon icon={solid("magnifying-glass")} /> Search
                            </Button>
                        </Col>
                    </Form.Group>
                </Form>
                <ListGroup className="mt-3" style={{maxHeight: '60vh', overflowY: 'auto'}}>
                    {results ? (results.length > 0 ? results.map((item, index) => (
                        <ListGroup.Item key={index} className="clickable-item" onClick={() => handleItemClick(item)}>
                            <div style={{fontWeight: 'bold', marginBottom: '5px'}}>
                                {item.item.collection !== collectionId && (
                                    <span className="text-muted">{item.item.collection} / </span>
                                )}
                                {item.item['page_name']}
                            </div>
                            <div
                                className="search-result-item"
                                dangerouslySetInnerHTML={{__html: highlightFromFuse(item)}}
                            />
                        </ListGroup.Item>
                    )) : <div className="text-center mt-3 mb-3">No results found</div>) : ''}
                </ListGroup>
            </Modal.Body>
        </Modal>
    );
}

export default SearchModal;
