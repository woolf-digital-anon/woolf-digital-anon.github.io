 // Helper function to extract event dates (backwards compatible)
export const getEventDate = (element, eventType) => {
    if (!element) return null;
    
    // Find the event element
    const event = element.querySelector(`event[type="${eventType}"]`);
    if (!event) return null;
    
    // Check for exact date first
    const when = event.getAttribute('when');
    if (when) return when; // Return string for backwards compatibility
    
    // Check for uncertain date range
    const notBefore = event.getAttribute('notBefore');
    const notAfter = event.getAttribute('notAfter');
    
    if (notBefore || notAfter) {
      return { 
        type: 'uncertain', 
        notBefore: notBefore || null, 
        notAfter: notAfter || null 
      };
    }
    
    return null;
  };

  // Alternative function that always returns structured data
export const getEventDateStructured = (element, eventType) => {
    if (!element) return null;
    
    const event = element.querySelector(`event[type="${eventType}"]`);
    if (!event) return null;
    
    const when = event.getAttribute('when');
    if (when) return { type: 'exact', date: when };
    
    const notBefore = event.getAttribute('notBefore');
    const notAfter = event.getAttribute('notAfter');
    
    if (notBefore || notAfter) {
      return { 
        type: 'uncertain', 
        notBefore: notBefore || null, 
        notAfter: notAfter || null 
      };
    }
    
    return null;
  };

  // Helper function to get all event dates as an object (handles uncertain dates)
export const getAllEventDates = (element) => {
    if (!element) return {};
    
    const events = element.querySelectorAll('event');
    const eventDates = {};
    
    events.forEach(event => {
      const type = event.getAttribute('type');
      if (!type) return;
      
      const when = event.getAttribute('when');
      const notBefore = event.getAttribute('notBefore');
      const notAfter = event.getAttribute('notAfter');
      
      if (when) {
        eventDates[type] = { type: 'exact', date: when };
      } else if (notBefore || notAfter) {
        eventDates[type] = { 
          type: 'uncertain', 
          notBefore: notBefore || null, 
          notAfter: notAfter || null 
        };
      }
    });
    
    return eventDates;
  };

  // Smart format function that handles both strings and objects
export const formatDate = (dateInfo) => {
    if (!dateInfo) return '';
    
    // Handle string input (exact dates or legacy format)
    if (typeof dateInfo === 'string') {
      const date = new Date(dateInfo);
      if (!isNaN(date)) {
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
      return dateInfo; // Return as-is if not a valid date
    }
    
    // Handle structured date object (uncertain dates)
    if (typeof dateInfo === 'object' && dateInfo.type === 'uncertain') {
      const { notBefore, notAfter } = dateInfo;
      
      if (notBefore && notAfter) {
        return `between ${formatDate(notBefore)} and ${formatDate(notAfter)}`;
      } else if (notBefore) {
        return `after ${formatDate(notBefore)}`;
      } else if (notAfter) {
        return `before ${formatDate(notAfter)}`;
      }
    }
    
    // Handle exact date object (shouldn't happen with current setup, but just in case)
    if (typeof dateInfo === 'object' && dateInfo.type === 'exact') {
      return formatDate(dateInfo.date); // Recurse with string
    }
    
    return '';
  };
