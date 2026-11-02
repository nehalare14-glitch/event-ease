
package com.eventease.service;

import com.eventease.model.Booking;
import com.eventease.model.Event;
import com.eventease.repository.BookingRepository;
import com.eventease.repository.EventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final EventRepository eventRepository;

    public BookingService(
            BookingRepository bookingRepository,
            EventRepository eventRepository) {
        this.bookingRepository = bookingRepository;
        this.eventRepository = eventRepository;
    }

    @Transactional
    public Booking createBooking(
            Long eventId,
            String customerName,
            String customerEmail,
            int numberOfTickets) {

        if (numberOfTickets <= 0) {
            throw new IllegalArgumentException(
                    "Ticket quantity must be at least 1.");
        }

        if (customerName == null || customerName.isBlank()
                || customerEmail == null || customerEmail.isBlank()) {
            throw new IllegalArgumentException(
                    "Customer name and email are required.");
        }

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Event not found."));

        if (event.getAvailableSeats() < numberOfTickets) {
            throw new IllegalArgumentException(
                    "Not enough seats available.");
        }

        event.setAvailableSeats(
                event.getAvailableSeats() - numberOfTickets);

        Booking booking = new Booking();
        booking.setCustomerName(customerName.trim());
        booking.setCustomerEmail(customerEmail.trim());
        booking.setNumberOfTickets(numberOfTickets);
        booking.setTotalAmount(
                event.getTicketPrice() * numberOfTickets);
        booking.setBookingDate(LocalDateTime.now());
        booking.setEvent(event);

        eventRepository.save(event);

        return bookingRepository.save(booking);
    }

	@Transactional
public void cancelBooking(
        Long bookingId,
        String customerEmail,
        boolean isAdmin) {

    Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() ->
                    new IllegalArgumentException("Booking not found."));

    if (!isAdmin &&
            !booking.getCustomerEmail().equalsIgnoreCase(customerEmail)) {
        throw new IllegalArgumentException(
                "You are not allowed to cancel this booking.");
    }

    if (booking.isCancelled()) {
        throw new IllegalArgumentException(
                "This booking is already cancelled.");
    }

    Event event = booking.getEvent();

    event.setAvailableSeats(
            event.getAvailableSeats() + booking.getNumberOfTickets());

    booking.setCancelled(true);

    eventRepository.save(event);
    bookingRepository.save(booking);
}
    public long getTotalBookings() {
        return bookingRepository.count();
    }

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public List<Booking> getBookingsByEmail(String email) {
        return bookingRepository.findByCustomerEmailIgnoreCase(email);
    }

    public Double getTotalRevenue() {
        return bookingRepository.getTotalRevenue();
    }

    public Long getTotalTicketsSold() {
        return bookingRepository.getTotalTicketsSold();
    }

    public List<Object[]> getEventWiseSales() {
        return bookingRepository.getEventWiseSales();
    }
}

