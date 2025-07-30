import { Fragment, useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { CustomNavbar } from "./CustomNavbar";
// import ReactMarkdown from "react-markdown";
// import { FaGithub } from "react-icons/fa";

export default function Help() {
    // const [markdown, setMarkdown] = useState("");

    // useEffect(() => {
    //     fetch(`${process.env.PUBLIC_URL}/files/help.md`)
    //         .then((res) => res.text())
    //         .then((text) => setMarkdown(text))
    //         .catch((err) => console.error("Failed to load about.md", err));
    // }, []);

    return (
        <Fragment>
            <CustomNavbar helperFunctions={["collectionLink"]} />

            <Container className="px-4 pt-4 page-container">
                <article className="mb-5">
                   <h1>How-To</h1>
                   <p>This is a visual guide to the main document viewer interface of <i>The Digital 'Anon'</i>.</p> 
                   <img 
                        src={`${process.env.PUBLIC_URL}/files/how_to_1.png`} 
                        alt="#" 
                        className="img-fluid mb-4"
                        style={{ maxWidth: '100%' }}
                   />
                   <ol>
                        <li><b>Quick document switcher.</b> This brings up a list of documents: you can use this to quickly switch between one fragment and another.</li>
                        <li><b>Document search function.</b> Click to bring up the edition's search function. The search interface enables you to perform keyword searches across the corpus of drafts and jump to any search result.</li>
                        <li><b>Quick image tools.</b> Use these to zoom in and out, reset the document's zoom, and to move the image window.</li>
                        <li><b>Transcription key.</b> Click here to bring up a key for transcription markup and conventions.</li>
                        <li><b>View options:</b>
                            <ul>
                                <li><b>XML: Raw/Render.</b> Toggles XML rendering on and off. Switch to Raw if you want to see lots of angle brackets.</li>
                                <li><b>Polygons: On/Off.</b> Toggles the grey lines that denote image segmentation.</li>
                            </ul>
                        </li>
                        <li><b>Text segments.</b> Facsimile images are segmented by grey lines. Click on any image segment to highlight its corresponding line of transcription, or vice versa. Segmentation lines can be turned off in the View Options menu (see below).</li>
                        <li><b>Explanatory Notes link.</b> Blue hyperlinks in transcription text refer to a corresponding explanatory note. Click the links to bring up the note for that term in a popup interface. Explanatory notes are interlinked and searchable.</li>
                        <li><b>Regularised text.</b> Regularised spelling and expanded contractions are marked in red: mouseover the regularised text to see Woolf's original typos and contractions.</li>
                        <li><b>Page navigation.</b> Navigate to the previous or next page in the document.</li>
                        <li><b>Window resizer.</b> Click and drag this handle to resize the facsimile or transcription window.</li>
                   </ol>
                </article>
            </Container>
        </Fragment>
    );
}