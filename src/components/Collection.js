import React, {Fragment, useEffect, useState} from 'react';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import {Card, Col, Container, Row} from "react-bootstrap";
import {CustomNavbar} from "./CustomNavbar";

function Collection() {
    const { collectionId } = useParams();
    const [collection, setCollection] = useState(null);
    const [picturesAvailable, setPicturesAvailable] = useState(false)
    const navigate = useNavigate();

    useEffect(() => {
        const loadFilesInfo = async () => {
            try {
                const response = await fetch(`${process.env.PUBLIC_URL}/files_info.json`);
                const data = await response.json();
                const selected = data[collectionId-1];
                setCollection(selected);
                setPicturesAvailable(data[collectionId-1].picturesAvailable)
            } catch (e) {
                console.error(e);
            }
        };
        loadFilesInfo();
    }, [collectionId]);

    if (!collection) return null;

    function handleCardClick(pageIndex) {
        navigate(`/collection/${collectionId}/page/${pageIndex}`);
    }

    return (
        <Fragment>
            <CustomNavbar helperFunctions={{}} />
            <Container fluid className="px-4 pt-4 page-container">
                <h2 className="mb-4">{collection.name}</h2>
                <Row xs={1} sm={2} md={3} lg={4} className="g-4">
                    {collection.pages.map((page, i) => (
                        <Col key={i}>
                            <Card onClick={() => handleCardClick(i + 1)} className="h-100 clickable" style={{ cursor: 'pointer' }}>
                                <Card.Img
                                    variant="top"
                                    src={picturesAvailable ?
                                        `${process.env.PUBLIC_URL}/files/${collection.path}/img/${page}.jpg`
                                        : `${process.env.PUBLIC_URL}/placeholder_view_vector.png`}
                                    onError={(e) => e.target.style.display = 'none'}
                                    style={{ objectFit: 'cover', height: '200px' }}
                                />
                                <Card.Body>
                                    <Card.Text style={{ fontSize: '0.8rem' }}>
                                        {page}
                                    </Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Container>
        </Fragment>
    );
}

export default Collection;