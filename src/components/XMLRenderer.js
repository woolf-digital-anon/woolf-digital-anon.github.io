import React, { Fragment, useEffect, useRef, useState } from 'react';
import { convertZonesToJson } from '../util/annotation-util';

export function XMLRenderer({
                                xmlString,
                                customRenderers = {},
                                plugins = [],
                                attributePlugins = [],
                                onElementClick,
                                onZonesExtracted
                            }) {
    const [xmlHtml, setXmlHtml] = useState(null);
    const containerRef = useRef(null);

    const handleClick = onElementClick ?? undefined;

    const defaultAttributePlugins = [
        (name, value) => name === 'ref' ? ['reference', value] : null,
        (name, value) => name === 'style'
            ? ['style', value.split(';').reduce((obj, part) => {
                const [prop, val] = part.split(':');
                if (prop && val) obj[prop.trim().replace(/-([a-z])/g, (_, char) => char.toUpperCase())] = val.trim();
                return obj;
            }, {})]
            : null,
    ];

    const processAttributes = (attrList, plugins) => {
        const result = {};
        for (const { name, value } of attrList) {
            let transformed = null;
            for (const plugin of plugins) {
                transformed = plugin(name, value);
                if (transformed) break;
            }
            const [key, val] = transformed || [name, value];
            result[key] = val;
        }
        return result;
    };

    useEffect(() => {
        if (!xmlString) return;

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
        const parseError = xmlDoc.getElementsByTagName('parsererror')[0];

        if (parseError) {
            setXmlHtml(
                <Fragment>
                    <p>The XML document has the following error and cannot be rendered:</p>
                    <p>{parseError.querySelector('div').textContent.trim()}</p>
                </Fragment>
            );
            return;
        }

        const extractZones = (doc) => {
            const zones = doc.getElementsByTagName('zone');
            onZonesExtracted(convertZonesToJson(zones));
        };

        const defaultRenderers = {
            'teiheader': () => null,
            'facsimile': () => null,
            'pb': () => null,
            'tei': (node, children, attributes) => <Fragment>{children}</Fragment>,
            'body': (node, children, attributes) => <Fragment>{children}</Fragment>,
            'text': (node, children, attributes) => <Fragment>{children}</Fragment>,
            'mvn': (node, children, attributes) => <Fragment>{children}</Fragment>,
            'lg': (node, children, attributes) => <Fragment>{children}</Fragment>,
            'l': (node, children, attributes) => <Fragment><span {...attributes}>{children}</span><br /></Fragment>,
            'lb': (node, children, attributes) => <Fragment><span {...attributes} /><br /></Fragment>,
        };

        const runPlugins = (node, children, attributes) => {
            for (const plugin of plugins) {
                const result = plugin(node, children, attributes);
                if (result) return result;
            }
            return null;
        };

        const renderXmlAsReact = (node) => {
            if (node.nodeType === Node.TEXT_NODE) return node.nodeValue;
            if (node.nodeType !== Node.ELEMENT_NODE) return null;

            const tagName = node.tagName.toLowerCase();
            const children = Array.from(node.childNodes).map(renderXmlAsReact);
            const attributes = processAttributes(Array.from(node.attributes), [...attributePlugins, ...defaultAttributePlugins]);

            if (!attributes['data-orig-tag']) {
                attributes['data-orig-tag'] = tagName;
            }

            const pluginResult = runPlugins(node, children, attributes);
            if (pluginResult) return pluginResult;

            const renderer = customRenderers[tagName] || defaultRenderers[tagName];
            if (renderer) return renderer(node, children, attributes);

            // console.log('Unmapped tag:', tagName, attributes);
            return (
                <span data-orig-tag={tagName} {...attributes}>
                    {children}
                </span>
            );
        };

        extractZones(xmlDoc);
        const xmlHtml = renderXmlAsReact(xmlDoc.documentElement);
        setXmlHtml(xmlHtml);
    }, [xmlString]);


    return <div ref={containerRef} onClick={handleClick} className="xml-container">{xmlHtml}</div>;
}
