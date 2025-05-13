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
                <h2 className="mb-4">Available Collections</h2>
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