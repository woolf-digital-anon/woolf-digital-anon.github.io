    // helper functions for dates etc.
export const getEventDate = (element, eventType) => {
  if (!element) return null;
  const event = element.querySelector(`event[type="${eventType}"][when]`);
  return event ? event.getAttribute('when') : null;
}

const getAllEventDates = (element) => {
  if (!element) return null;

  const events = element.querySelectorAll('event[when]')
  const eventDates = {};

  events.forEach(event => {
    const type = event.getAttribute('type');
    const when = event.getAttribute('when');
    if (type && when) {
      eventDates[type] = when;
    }
  })
  return eventDates;
}

// Helper function to format dates nicely
export const formatDate = (dateString) => {
  if (!dateString) return '';

  // Handle ISO date format (YYYY-MM-DD)
  const date = new Date(dateString);
  if (!isNaN(date)) {
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Return original string if not a valid date
  return dateString;
  };
