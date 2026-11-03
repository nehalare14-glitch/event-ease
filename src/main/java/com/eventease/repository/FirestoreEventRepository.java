package com.eventease.repository;

import com.eventease.model.Event;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ExecutionException;

@Repository
public class FirestoreEventRepository {

    private final Firestore firestore;

    public FirestoreEventRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    public Optional<Event> findById(Long id)
            throws InterruptedException, ExecutionException {

        DocumentSnapshot doc = firestore.collection("events")
                .document(id.toString())
                .get()
                .get();

        if (!doc.exists()) {
            return Optional.empty();
        }

        return Optional.of(toEvent(doc));
    }

    public List<Event> findAll()
            throws InterruptedException, ExecutionException {

        List<Event> events = new ArrayList<>();

        for (DocumentSnapshot doc : firestore.collection("events")
                .get()
                .get()
                .getDocuments()) {

            events.add(toEvent(doc));
        }

        return events;
    }

    public void save(Event event)
            throws InterruptedException, ExecutionException {

        if (event.getId() == null) {
            throw new IllegalArgumentException(
                    "Event ID is required until ID generation is implemented.");
        }

        Map<String, Object> data = new HashMap<>();
        data.put("title", event.getTitle());
        data.put("category", event.getCategory());
        data.put("eventDate", event.getEventDate() == null
                ? null : event.getEventDate().toString());
        data.put("location", event.getLocation());
        data.put("description", event.getDescription());
        data.put("ticketPrice", event.getTicketPrice());
        data.put("availableSeats", event.getAvailableSeats());

        firestore.collection("events")
                .document(event.getId().toString())
                .set(data)
                .get();
    }

    public void deleteById(Long id)
            throws InterruptedException, ExecutionException {

        firestore.collection("events")
                .document(id.toString())
                .delete()
                .get();
    }

    public long count()
            throws InterruptedException, ExecutionException {

        return firestore.collection("events")
                .get()
                .get()
                .size();
    }

    private Event toEvent(DocumentSnapshot doc) {
        Event event = new Event();

        event.setId(Long.valueOf(doc.getId()));
        event.setTitle(doc.getString("title"));
        event.setCategory(doc.getString("category"));

        String date = doc.getString("eventDate");
        if (date != null && !date.isBlank()) {
            event.setEventDate(LocalDate.parse(date));
        }

        event.setLocation(doc.getString("location"));
        event.setDescription(doc.getString("description"));

        Double price = doc.getDouble("ticketPrice");
        event.setTicketPrice(price == null ? 0.0 : price);

        Long seats = doc.getLong("availableSeats");
        event.setAvailableSeats(seats == null ? 0 : seats.intValue());

        return event;
    }
}