export const getNoteTextWithMarkup = (element, preserveMarkup = true, onLinkClick = null) => {
  const noteElement = element.querySelector('note');
  if (!noteElement) return null;
  
  if (preserveMarkup) {
    // Clone the note element to avoid modifying the original
    const clonedNote = noteElement.cloneNode(true);
    
    // Find all <rs> elements and convert them to <a> elements
    const rsElements = clonedNote.querySelectorAll('rs');
    rsElements.forEach(rs => {
      // Create a new <a> element
      const anchor = document.createElement('a');
      
      // Get the xml:id attribute (try different ways it might be stored)
      const xmlId = rs.getAttribute('xml:id') || 
                   rs.getAttribute('xmlId') || 
                   rs.getAttributeNS('http://www.w3.org/XML/1998/namespace', 'id');
      
      // Set href attribute
      if (xmlId) {
        anchor.href = '#' + xmlId;
        anchor.setAttribute('data-ref-id', xmlId);
      } else {
        anchor.href = '#';
      }
      
      // Add styling
      anchor.style.cursor = 'pointer';
      anchor.style.color = '#6a5acd'; // Bootstrap link color
      anchor.style.textDecoration = 'underline';
      
      // Copy the text content
      anchor.innerHTML = rs.innerHTML;
      
      // Add click event handler if callback provided
      if (onLinkClick && xmlId) {
        anchor.addEventListener('click', (e) => {
          e.preventDefault();
          onLinkClick(xmlId);
        });
      }
      
      // Replace the <rs> element with the <a> element
      rs.parentNode.replaceChild(anchor, rs);
    });
    
    // Convert other common XML tags to HTML equivalents
    const hiElements = clonedNote.querySelectorAll('hi');
    hiElements.forEach(hi => {
      const em = document.createElement('em');
      em.innerHTML = hi.innerHTML;
      hi.parentNode.replaceChild(em, hi);
    });
    
    return clonedNote.innerHTML.trim();
  } else {
    return noteElement.textContent.trim().replace(/\s+/g, ' ');
  }
};

// Helper function to find and extract content by xml:id from annotations.xml
export const findAnnotationById = (annotationsData, targetId) => {
  // This assumes annotationsData is your parsed XML document
  // Look for elements with matching xml:id
  const elements = annotationsData.querySelectorAll(`[xml\\:id="${targetId}"], [xmlId="${targetId}"]`);
  
  if (elements.length > 0) {
    return elements[0];
  }
  
  // Fallback: search through all elements
  const allElements = annotationsData.querySelectorAll('*');
  for (let element of allElements) {
    const xmlId = element.getAttribute('xml:id') || 
                 element.getAttribute('xmlId') || 
                 element.getAttributeNS('http://www.w3.org/XML/1998/namespace', 'id');
    if (xmlId === targetId) {
      return element;
    }
  }
  
  return null;
};

// Example usage in your React component:
export const handleAnnotationLinkClick = (xmlId, annotationsData, setModalContent) => {
  const referencedElement = findAnnotationById(annotationsData, xmlId);
  
  if (referencedElement) {
    // Extract and format the content for display
    const newContent = getNoteTextWithMarkup(
      referencedElement, 
      true, 
      (clickedId) => handleAnnotationLinkClick(clickedId, annotationsData, setModalContent)
    );
    
    // Update the modal content
    setModalContent({
      title: `Annotation: ${xmlId}`,
      content: newContent
    });
  } else {
    console.warn(`Referenced annotation with id "${xmlId}" not found`);
    setModalContent({
      title: 'Reference Not Found',
      content: `Could not find annotation with id: ${xmlId}`
    });
  }
};