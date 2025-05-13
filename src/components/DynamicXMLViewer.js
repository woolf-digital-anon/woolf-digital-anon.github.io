import React, {Fragment, useEffect, useRef, useState} from 'react'
import XMLViewer from 'react-xml-viewer'
import {Button} from "react-bootstrap";
import DropdownButton from "react-bootstrap/DropdownButton";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {solid} from "@fortawesome/fontawesome-svg-core/import.macro";
import { scrollIntoView } from "seamless-scroll-polyfill";
import {saveAs} from 'file-saver';
import {XMLRenderer} from "./XMLRenderer";


export function DynamicXMLViewer({onSelection, setSelection, currentPage, setAnnoZones}) {
    const [xmlText, setXmlText] = useState("");
    const [showRender, setShowRender] = useState(true);
    const [abbr, setAbbr] = useState(true);

    const containerRef = useRef(null);

    const customRenderers = {
        "abbr": (node, children, attributes) => <span {...attributes}>{children}</span>,
        "expan": (node, children, attributes) => <span style={{ display: 'none' }} {...attributes}>{children}</span>,
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

                    <DropdownButton variant="light" className="ms-auto" title="View Options" align="end" >
                        <div className="px-3 py-2 d-flex align-items-center justify-content-between">
                            <span className="me-3">XML</span>
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
                                <span className="me-3">Abbreviations</span>
                                <div className="switcher" onChange={abbrToggle}>
                                    <input type="radio" name="view-toggle-2" value="expand" id="expand" className="switcherxml__input switcherxml__input--raw" />
                                    <label htmlFor="expand" className="switcher__label">Expand</label>

                                    <input type="radio" name="view-toggle-2" value="abbr" id="abbr" className="switcherxml__input switcherxml__input--render" defaultChecked />
                                    <label htmlFor="abbr" className="switcher__label">Abbr.</label>

                                    <span className="switcher__toggle"></span>
                                </div>
                            </div>
                        )}
                    </DropdownButton>
                </div>
                <div className={"xml-container"} >
                    {showRender ? (
                        <SelectableXmlViewer ref={containerRef} xmlString={xmlText} onSelection={onSelection} setSelection={setSelection} onZonesExtracted={setAnnoZones} customRenderers={customRenderers} />
                    ) : (
                        <XMLViewer collapsible="true" initialCollapsedDepth="3" xml={xmlText} />
                    )}
                </div>

            </div>
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
