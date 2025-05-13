import { createContext, useContext, useEffect, useState } from "react";

const MetaContext = createContext();

export function MetaProvider({ children }) {
    const [meta, setMeta] = useState({ title: "Loading..." });

    useEffect(() => {
        fetch(`${process.env.PUBLIC_URL}/files/meta.json`)
            .then((res) => res.json())
            .then((data) => setMeta(data))
            .catch(() => setMeta({ title: "Necturus XML Viewer" }));
    }, []);

    return (
        <MetaContext.Provider value={meta}>
            {children}
        </MetaContext.Provider>
    );
}

export function useMeta() {
    return useContext(MetaContext);
}