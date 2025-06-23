import React, {Fragment, useEffect, useRef, useState} from 'react'
import XMLViewer from 'react-xml-viewer'
import {Button, Dropdown} from "react-bootstrap";
import DropdownButton from "react-bootstrap/DropdownButton";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {solid} from '@fortawesome/fontawesome-svg-core/import.macro'
import { scrollIntoView } from "seamless-scroll-polyfill";
import {saveAs} from 'file-saver';
import {XMLRenderer} from "./XMLRenderer";
import {NoteModal} from "./NoteModal";
import { useSearchParams } from 'react-router-dom';



export function DynamicXMLViewer({onSelection, setSelection, currentPage, setAnnoZones, searchedItemLocation, setSearchedItemLocation, showPolygons, setShowPolygons}) {
    const [xmlText, setXmlText] = useState("");
    const [showRender, setShowRender] = useState(true);
    const [abbr, setAbbr] = useState(true);
    // const [showPolygons, setShowPolygons] = useState(true);

    // notes modal state
    const [searchParams, setSearchParams] = useSearchParams();
    const [noteModalOpen, setNoteModalOpen] = useState(false);
    const [noteId, setNoteId] = useState(null);
    const [noteText, setNoteText] = useState(null);
    const [currentNoteId, setCurrentNoteId] = useState(null);

    useEffect(() => {
        const noteIdFromUrl = searchParams.get('note');
        if (noteIdFromUrl) {
            setCurrentNoteId(noteIdFromUrl);
            setNoteId(noteIdFromUrl);
            setNoteModalOpen(true);
        } else {
            setNoteModalOpen(false);
            setCurrentNoteId(null);
            setNoteId(null);
        }
    }, [searchParams])

    const containerRef = useRef(null);

    // useEffect(() => {
    //     if (searchedItemLocation && xmlText) {
    //         const { facs, collection, page_name } = searchedItemLocation;
            
    //         // If this component is displaying the correct page for the search result
    //         // Check if the current page matches the search result's page
    //         const currentPageName = currentPage ? currentPage.split('/').pop().replace('.xml', '') : '';
            
    //         if (page_name === currentPageName) {
    //             // Navigate to the specific element using facs
    //             if (facs) {
    //                 setSelection(facs.startsWith('#') ? facs.slice(1) : facs);
    //             }
    //             // Clear the search location after handling
    //             setSearchedItemLocation(null);
    //         }
    //     }
    // }, [searchedItemLocation, xmlText, currentPage, setSelection, setSearchedItemLocation]);

    const customRenderers = {
        "abbr": (node, children, attributes) => <span {...attributes}>{children}</span>,
        "expan": (node, children, attributes) => <span style={{ display: 'none' }} {...attributes}>{children}</span>,
        "rs": (node, children, attributes) => {
            const xmlId=attributes['xml:id'] || "#";
            const basePath = "./src/assets/annotations.xml#";
            const href= xmlId ? `${basePath}${xmlId}` : "#"

            // click handler to open NoteModal
            const handleClick = (e) => {
                e.preventDefault();
                // Update URL parameters instead of directly setting state
                setSearchParams(prev => {
                    const newParams = new URLSearchParams(prev);
                    newParams.set('note', xmlId || "No Title");
                    return newParams;
                });
            }

            return <Fragment><a 
                href={href}
                onClick={handleClick}
                style={{ cursor: 'pointer' }}>
                    {children}
                </a></Fragment>
        }
    }

    const onToolSelect = () => {
        setShowRender(!showRender);
        setSelection(null);
        setAbbr(true);
    }

    const exportXML = (xmlString) => {
        const blob = new Blob([xmlString], {type: "application/xml"})
        const parts = currentPage.split("/");
        const filename = parts.pop() || "download.xml";

        saveAs(blob, filename.endsWith('.xml') ? filename : `${filename}.xml`);
    }

    const abbrToggle = () => {
        setAbbr(!abbr);
    }
    const polygonToggle = () => {
        console.log('Polygon toggle clicked, current state:', showPolygons);
        setShowPolygons(!showPolygons);
        console.log('New state will be:', !showPolygons);
    }

    const handleModalClose = () => {
        // Clear the note parameter from URL when modal closes
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.delete('note');
            return newParams;
        });
    }

    useEffect(() => {
        const loadXmltext = async () => {
            try {
                const response = await fetch(currentPage);
                const data = await response.text();
                setXmlText(data);
            }
            catch (e) {
             console.error(e)
            }
        };
        if (!currentPage) setXmlText('');
        else loadXmltext();
    }, [currentPage]);

    useEffect(() => {
        if (!xmlText) return;

        const container = document.querySelector('.xml-container');
        if (!container) return;

        const choiceSpans = container.querySelectorAll('[data-orig-tag="choice"]');

        choiceSpans.forEach(choiceEl => {
            const abbrVersion = choiceEl.querySelectorAll('[data-orig-tag="abbr"]');
            const extVersion = choiceEl.querySelectorAll('[data-orig-tag="expan"]');

            const toShow = abbr ? abbrVersion : extVersion;
            const toHide = abbr ? extVersion : abbrVersion;

            toShow.forEach(el => {
                el.style.display = '';
                el.classList.add('flash');
            });

            toHide.forEach(el => {
                el.style.display = 'none';
                el.classList.remove('flash');
            });
        });

        const timeout = setTimeout(() => {
            const flashing = container.querySelectorAll('.flash');
            flashing.forEach(el => el.classList.remove('flash'));
        }, 600);

        return () => clearTimeout(timeout);
    }, [xmlText, abbr]);

    return (
        <Fragment>
            <div className="h-100 d-flex flex-column">
                <div className="d-flex tools">
                    <Button variant="light" title={'Export XML'} onClick={() => exportXML(xmlText)}>
                        <FontAwesomeIcon icon={solid("file-export")} />
                    </Button>

                    <Button variant="light" title={'Drag and move'} className="drag-handle">
                        <FontAwesomeIcon icon={solid("up-down-left-right")} />
                    </Button>

                    <DropdownButton variant="light" className="p2" title={
                        <FontAwesomeIcon icon={solid("key")} />
                    }>
                        <div size="sm">
                            <Dropdown.Item><add>Addition</add></Dropdown.Item>
                            <Dropdown.Item><del>Deletion</del></Dropdown.Item>
                            <Dropdown.Item><a href="#">Reference</a></Dropdown.Item>
                            <Dropdown.Item>
                                <choice>
                                    <sic>Typo</sic>
                                    <corr>Correction</corr>
                                </choice>
                            </Dropdown.Item>
                            <Dropdown.Item><quote>Quotation</quote></Dropdown.Item>
                        </div>
                    </DropdownButton>

                    <DropdownButton variant="light" className="ms-auto" title="View Options" align="end" >
                        <div className="px-3 py-2 d-flex align-items-center justify-content-between">
                            <span className="me-3">XML <FontAwesomeIcon icon={solid("code")} /></span>
                            <div className="switcher" onChange={onToolSelect}>
                                <input type="radio" name="view-toggle" value="raw" id="raw" className="switcherxml__input switcherxml__input--raw" />
                                <label htmlFor="raw" className="switcher__label">Raw</label>

                                <input type="radio" name="view-toggle" value="render" id="render" className="switcherxml__input switcherxml__input--render" defaultChecked />
                                <label htmlFor="render" className="switcher__label">Render</label>

                                <span className="switcher__toggle"></span>
                            </div>
                        </div>

                        {showRender && (
                            <div className="px-3 py-2 d-flex align-items-center justify-content-between">
                                <span className="me-3">Polygons <FontAwesomeIcon icon={solid("expand")} /></span>
                                <div className="switcher" onChange={polygonToggle}>
                                    <input 
                                        type="radio" 
                                        name="polygon-toggle" 
                                        value="on" 
                                        id="polygons-on" 
                                        className="switcherxml__input switcherxml__input--raw" 
                                        checked={showPolygons}
                                        onChange={() => setShowPolygons(true)}
                                        readOnly
                                    />
                                    <label htmlFor="polygons-on" className="switcher__label">On</label>

                                    <input 
                                        type="radio" 
                                        name="polygon-toggle" 
                                        value="off" 
                                        id="polygons-off" 
                                        className="switcherxml__input switcherxml__input--render" 
                                        checked={!showPolygons}
                                        onChange={() => setShowPolygons(false)}
                                        readOnly
                                    />
                                    <label htmlFor="polygons-off" className="switcher__label">Off</label>

                                    <span className="switcher__toggle"></span>
                                </div>
                            </div>
                        )}
                    </DropdownButton>
                </div>
                <div className={"xml-container"} >
                    {showRender ? (
                        <SelectableXmlViewer 
                            ref={containerRef}
                            xmlString={xmlText} 
                            onSelection={onSelection} 
                            setSelection={setSelection} 
                            onZonesExtracted={setAnnoZones} 
                            customRenderers={customRenderers}
                            showPolygons={showPolygons} 
                        />
                    ) : (
                        <XMLViewer collapsible="true" initialCollapsedDepth="3" xml={xmlText} />
                    )}
                </div>

            </div>

            <NoteModal
                noteModalOpen={noteModalOpen}
                setNoteModalOpen={handleModalClose}
                noteId={noteId}
            />
        </Fragment>

    )
}

export function SelectableXmlViewer({
                                        xmlString,
                                        onSelection,
                                        setSelection,
                                        onZonesExtracted,
                                        ...xmlRendererProps
                                    }) {
    const containerRef = useRef(null);
    const [selectedElement, setSelectedElement] = useState(null);
    const [prevSelectedElement, setPrevSelectedElement] = useState(null);

    useEffect(() => {
        if (!xmlString) return;
        setSelectedElement(containerRef.current?.querySelector(`[facs="#${onSelection}"]`));
    }, [onSelection, xmlString]);

    useEffect(() => {
        if (prevSelectedElement) prevSelectedElement.classList.remove('highlighted');
        if (selectedElement) {
            selectedElement.classList.add('highlighted');
            scrollIntoView(selectedElement, { block: 'nearest', inline: 'nearest' });
            setPrevSelectedElement(selectedElement);
        }
    }, [selectedElement]);

    const handleClick = (e) => {
        const facs = e.target.getAttribute('facs');
        if (facs) setSelection(facs.slice(1));
    };

    return (
        <div ref={containerRef} onClick={handleClick} className="xml-container">
            <XMLRenderer
                xmlString={xmlString}
                onZonesExtracted={onZonesExtracted}
                onElementClick={handleClick}
                {...xmlRendererProps}
            />
        </div>
    );
}