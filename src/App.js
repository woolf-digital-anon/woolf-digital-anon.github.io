import './assets/App.css';
import './assets/styles.css';
import '/node_modules/react-grid-layout/css/styles.css';
import '/node_modules/react-resizable/css/styles.css';
import {XMLViewerContainer} from "./components/XMLViewerContainer";
import {Col, Container, Nav, Row} from "react-bootstrap";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {brands} from '@fortawesome/fontawesome-svg-core/import.macro'
import React from "react";
import {Fragment} from "react";
import { Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Collection from './components/Collection';
import About from "./components/About";
import AboutCitations from "./components/AboutCitations";
import AboutCredits from "./components/AboutCredits";
import AboutDocuments from "./components/AboutDocuments";
import AboutProject from "./components/AboutProject";
import Contact from "./components/Contact";
import Help from "./components/Help";
import {useMeta} from "./components/MetaContext";

function App() {
    const meta = useMeta();

    return (
        <Fragment>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/about/credits" element={<AboutCredits />} />
                <Route path="/about/documents" element={<AboutDocuments />} />
                <Route path="/about/project" element={<AboutProject />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/collection/:collectionId" element={<Collection />} />
                <Route path="/help" element={<Help />} />
                <Route path="/help/citations" element={<AboutCitations />} />

                <Route path="/collection/:collectionId/page/:pageId" element={<XMLViewerContainer />} />
            </Routes>
            <Nav className="bg-light fixed-bottom">
                <Container>
                    <Row>
                        <Col className="align-self-center m-3">
                            {meta.github ?
                                <a href={meta.github} target="_blank" className="text-muted text-decoration-none">
                                    <FontAwesomeIcon icon={brands("github")} />
                                    <span className="m-2">View source</span>
                                </a>
                            : '' }
                        </Col>
                        <Col className="text-end m-3" style={{fontSize: '10px'}}>
                            <div className="text-end">© copyright statement goes here</div>
                            {meta.creator ? <div className="text-end">Edited by {meta.creator}</div> : '' }
                            <div className="text-end">Powered by <a className="text-muted text-decoration-none" href="https://github.com/eXtant-CMG/Necturus-Viewer-Compact" target="_blank">Necturus Compact</a></div>
                        </Col>
                    </Row>
                </Container>
            </Nav>
        </Fragment>
    );
}

export default App;