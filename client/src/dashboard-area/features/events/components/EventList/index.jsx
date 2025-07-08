// components/EventList/index.jsx
import React from "react";
import EventGrid from "./EventGrid";
import EmptyEventsState from "./EmptyEventsState";

const EventList = ({ events, onViewEvent, loading }) => {
  if (loading) {
    return <div>Loading events...</div>;
  }

  if (events.length === 0) {
    return <EmptyEventsState />;
  }

  return <EventGrid events={events} onViewEvent={onViewEvent} />;
};

export default EventList;
