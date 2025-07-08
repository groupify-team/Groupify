// components/EventList/EventGrid.jsx
import React from "react";
import EventCard from "../EventCard";

const EventGrid = ({ events, onViewEvent }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {events.map((event) => (
        <EventCard key={event.id} event={event} onViewEvent={onViewEvent} />
      ))}
    </div>
  );
};

export default EventGrid;
