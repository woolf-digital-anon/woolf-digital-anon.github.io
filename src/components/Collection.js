import React from 'react';
import { Outlet, useParams } from 'react-router-dom';

function Collection() {
    const { collectionId } = useParams();

    return (
        <div>
            <h2>Collection: {collectionId}</h2>
            {/* Additional collection-specific content */}
        </div>
    );
}

export default Collection;