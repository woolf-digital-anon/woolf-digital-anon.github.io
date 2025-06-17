import React, { Fragment, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomNavbar } from "./CustomNavbar";
import { Container, Row, Col, Card } from "react-bootstrap";

function Home() {
    const [filesInfo, setFilesInfo] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const loadFilesInfo = async () => {
            try {
                const response = await fetch(`${process.env.PUBLIC_URL}/files_info.json`);
                const data = await response.json();
                setFilesInfo(data);
            } catch (e) {
                console.error(e);
            }
        };
        loadFilesInfo();
    }, []);

    const handleCardClick = (collectionIndex) => {
        navigate(`/collection/${collectionIndex}`);
    };

    return (
        <Fragment>
            <CustomNavbar helperFunctions={{}} />

            <Container fluid className="px-4 pt-4 page-container">
                <Container style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h2>Welcome to The Digital 'Anon'</h2>
                        <div style={{ padding: '1rem 0 1.5rem 0'}}>
                            <p><em>The Digital 'Anon'</em> is a digital, genetic edition of Virginia Woolf's final, unfinished history of English literature.</p>
                            <p>In the final years of her life, Woolf's thoughts turned to the past and she began work on three historical projects. One was the novel, <em>Between the Acts</em> (1941), another the unfinished memoir 'A Sketch of the Past' (1976, second ed. 1989), while the most fragmentary was the literary history she called, variously, 'Reading at Random' or 'Turning the Page', but which has become better known today by the dual title of 'Anon' and 'The Reader'.</p>
                            <p>Woolf wrote some 273 pages of material towards this project, scattered across 43 manuscript and typescript drafts which write and rewrite, work and rework the primal scenes of English literary language.</p>
                            <p>While some material from Woolf's literary history has been published, no edition has made this whole corpus available: <em>The Digital 'Anon'</em> is the first resource to do so.</p>
                        </div>
                    <h3 className="mb-4">Browse the Drafts</h3>
                </Container>
                <Row xs={1} sm={2} md={3} lg={4} className="g-4">
                    {filesInfo.map((collection, index) => {
                        const firstImagePath = collection.picturesAvailable ? `${process.env.PUBLIC_URL}/files/${collection.path}/img/${collection.pages[0]}.jpg`
                                                        : `${process.env.PUBLIC_URL}/placeholder_view_vector.png`;

                        return (
                            <Col key={index}>
                                <Card onClick={() => handleCardClick(index + 1)} className="h-100 clickable"
                                      style={{ cursor: 'pointer' }}>
                                    <Card.Img
                                        variant="top"
                                        src={firstImagePath}
                                        onError={(e) => e.target.style.display = 'none'}
                                        style={{ objectFit: 'cover', height: '200px' }}
                                    />
                                    <Card.Body>
                                        <Card.Title style={{ fontSize: '1rem' }}>{collection.name}</Card.Title>
                                        <Card.Text style={{ fontSize: '0.9rem' }}>{collection.pages.length} pages</Card.Text>
                                    </Card.Body>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            </Container>
        </Fragment>
    );
}

export default Home;