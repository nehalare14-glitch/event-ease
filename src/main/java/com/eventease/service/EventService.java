package com.eventease.service;

import com.eventease.model.Event;
import com.eventease.repository.EventRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class EventService {

    private final EventRepository eventRepository;

    public EventService(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    public List<Event> getAllEvents() {
        return eventRepository.findByArchivedFalse();
    }

    public Optional<Event> getEventById(Long id) {
        return eventRepository.findById(id);
    }

    public Event saveEvent(Event event) {
        return eventRepository.save(event);
    }

    public void deleteEvent(Long id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Event not found."));

        event.setArchived(true);
        eventRepository.save(event);
    }

    public long getTotalEvents() {
        return eventRepository.countByArchivedFalse();
    }
}
