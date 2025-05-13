import {Fragment, useEffect, useState} from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as AppUtil from "../util/app-util";
import Container from "react-bootstrap/Container";
import AnnotationContainer from "./AnnotationContainer";
import {Responsive, WidthProvider} from "react-grid-layout";
import {CustomNavbar} from "./CustomNavbar";
import {DynamicXMLViewer} from "./DynamicXMLViewer";
import {CustomPagination} from "./CustomPagination";
import {Breadcrumb, Button, Col} from "react-bootstrap";
import SearchModal from "./SearchModal";
import {CollectionSelectModal} from "./CollectionSelectModal";

const ResponsiveGridLayout = WidthProvider(Responsive);

export function XMLViewerContainer() {
    const { collectionId, pageId } = useParams();
    const navigate = useNavigate();

    const [selectedZone, setSelectedZone] = useState("");
    const [layout, setLayout] = useState(AppUtil.sideBySideLayout);

    const [searchShow, setSearchShow] = useState(false);
    const [collectionSelectShow, setCollectionSelectShow] = useState(false);

    const [filesInfo, setFilesInfo] = useState("");
    const [currentCollection, setCurrentCollection] = useState(Number(collectionId));
    const [currentPage, setCurrentPage] = useState(Number(pageId));
    const [picturesAvailable, setPicturesAvailable] = useState(true);
    const [annoZones, setAnnoZones] = useState();

    const [searchedItemLocation, setSearchedItemLocation] = useState();

    function resetLayout(newLayout) {
        if (newLayout === 'sbs') {
            setLayout(AppUtil.sideBySideLayout)
        }
        else if (newLayout === 'fw') {
            setLayout(AppUtil.fullWidthLayout)
        }
    }

    function onLayoutChange(layout, layouts) {
        setLayout(layouts)
    }

    function extractCurrentPage(fileType, fileFormat) {
        if (!filesInfo) return '';

        const collection = filesInfo[currentCollection - 1];
        if (!collection) return '';

        const page = collection.pages[currentPage - 1];
        if (!page) return '';

        const baseURL = process.env.PUBLIC_URL || ''; // Fallback if PUBLIC_URL is not defined
        return `${baseURL}/files/${collection.path}/${fileType}/${page}.${fileFormat}`;
    }

    function extractCollectionName() {
        if (!filesInfo) return '';

        const collection = filesInfo[currentCollection - 1];
        if (!collection) return '';

        return collection.name
    }

    function extractCollectionPath() {
        if (!filesInfo) return '';

        const collection = filesInfo[currentCollection - 1];
        if (!collection) return '';

        return collection.path
    }

    function extractPageName() {
        if (!filesInfo) return '';

        const collection = filesInfo[currentCollection - 1];
        if (!collection) return '';

        const page = collection.pages[currentPage - 1];
        if (!page) return '';

        return page;
    }

    function searchModal() {
        setSearchShow(!searchShow);
    }

    function collectionSelectModal() {
        setCollectionSelectShow(!collectionSelectShow)
    }

    useEffect(() => {
        const loadFilesInfo = async () => {
            try {
                const response = await fetch(`${process.env.PUBLIC_URL}/files_info.json`);
                const data = await response.json();
                setFilesInfo(data);
            }
            catch (e) {
                console.error(e)
            }
        };
        loadFilesInfo();
    }, []);

    useEffect(() => {
        if (searchedItemLocation) {
            setCurrentPage(searchedItemLocation["page"]);

            //TODO: This is not ideal, I should find a better way to do this
            setTimeout(() => {
                setSelectedZone(searchedItemLocation['facs'].slice(1));
            }, 200);
        }
    }, [searchedItemLocation, currentPage]);

    useEffect(() => {
        if (collectionId) {
            setCurrentCollection(Number(collectionId));
        }
        if (pageId) {
            setCurrentPage(Number(pageId));
        }
    }, [collectionId, pageId]);

    useEffect(() => {
        setSearchedItemLocation(null);
        setSelectedZone(null);
        if (filesInfo.length) {
            navigate(`/collection/${currentCollection}/page/${currentPage}`);
        }
    }, [currentCollection, currentPage]);

    useEffect(() => {
        if (!filesInfo) return;
        if (!currentCollection) return;
        setPicturesAvailable(filesInfo[currentCollection - 1]?.picturesAvailable);

    }, [filesInfo, currentCollection]);

    useEffect(() => {
        if (!picturesAvailable) {
            setLayout(AppUtil.singleItemLayout);
        }
        else {
            setLayout(AppUtil.sideBySideLayout);
        }
    }, [picturesAvailable])

    return (
        <Fragment>
            <CustomNavbar helperFunctions={{resetLayout}} />
            <Container className="page-container">
                <CollectionSelectModal show={collectionSelectShow} switchShow={collectionSelectModal} setCollection={setCurrentCollection} setPage={setCurrentPage} filesInfo={filesInfo} />
                <SearchModal show={searchShow} switchShow={searchModal} collectionId={extractCollectionPath()} setSearchedItemLocation={setSearchedItemLocation}/>


                <div className="d-flex align-items-center my-breadcrumb-container border bg-light h-100 p-2">
                    <Col className={"col-10"}>
                        <Breadcrumb className="pt-3 px-2">
                            <Breadcrumb.Item active onClick={collectionSelectModal}
                                             style={{cursor: 'pointer'}}>{extractCollectionName()}</Breadcrumb.Item>
                            <Breadcrumb.Item active>{extractPageName()}</Breadcrumb.Item>
                        </Breadcrumb>
                    </Col>
                    <Col className={"col-2 search-column"}>
                        <Button variant="link" onClick={searchModal}
                                style={{textDecoration: 'none', color: '#212529BF'}}>
                            Search Collection
                        </Button>
                    </Col>
                </div>

                <ResponsiveGridLayout
                    className="layout"
                    layouts={layout}
                    breakpoints={{lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0}}
                    cols={{lg: 12, md: 10, sm: 6, xs: 4, xxs: 2}}
                    rowHeight={130}
                    draggableHandle=".drag-handle"
                    resizeHandles={['se', 'ne']}
                    onLayoutChange={(layout, layouts) =>
                        onLayoutChange(layout, layouts)
                    }
                >
                    <div key="1">
                        <div className="border bg-light h-100 p-3">
                            <DynamicXMLViewer onSelection={selectedZone} setSelection={setSelectedZone}
                                              currentPage={extractCurrentPage('xml', 'xml')}
                                              setAnnoZones={setAnnoZones}/>
                        </div>
                    </div>

                    {picturesAvailable && (
                        <div key="2">
                            <div className="border bg-light h-100 p-3">
                                <AnnotationContainer
                                    onSelection={selectedZone}
                                    setSelection={setSelectedZone}
                                    currentPage={extractCurrentPage('img', 'jpg')}
                                    annoZones={annoZones}
                                />
                            </div>
                        </div>
                    )}

                </ResponsiveGridLayout>
                <CustomPagination currentPage={currentPage} setCurrentPage={setCurrentPage}
                                  totalPages={filesInfo ? filesInfo[currentCollection - 1]?.pages.length : 0}/>
            </Container>

        </Fragment>
    )
}