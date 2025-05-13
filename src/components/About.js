import { Fragment, useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { CustomNavbar } from "./CustomNavbar";
import ReactMarkdown from "react-markdown";
import { FaGithub } from "react-icons/fa";

export default function About() {
    const [markdown, setMarkdown] = useState("");

    useEffect(() => {
        fetch(`${process.env.PUBLIC_URL}/files/about.md`)
            .then((res) => res.text())
            .then((text) => setMarkdown(text))
            .catch((err) => console.error("Failed to load about.md", err));
    }, []);

    return (
        <Fragment>
            <CustomNavbar helperFunctions={["collectionLink"]} />

            <Container className="px-4 pt-4 page-container">
                <article className="mb-5">
                    <ReactMarkdown>{markdown}</ReactMarkdown>
                </article>

                <footer>
                    <hr />
                    <h3 className="h3 mt-4">Powered by Necturus Compact</h3>
                    <p>
                        <strong>Necturus Compact</strong> is an open-source React application for browsing and searching XML documents entirely in the browser.
                        It's designed to be hosted as a static site, with no backend required.
                    </p>
                    <p>
                        The project is developed and maintained by Nooshin Shahidzadeh Asadi at the University of Antwerp.
                    </p>
                    <a
                        href="https://github.com/eXtant-CMG/Necturus-Viewer-Compact"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline-dark d-inline-flex align-items-center"
                    >
                        <FaGithub className="me-2" />
                        View on GitHub
                    </a>
                </footer>
            </Container>
        </Fragment>
    );
}