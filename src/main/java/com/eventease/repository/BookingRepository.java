package com.eventease.repository;

import com.eventease.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByCustomerEmail(String customerEmail);

    List<Booking> findByCustomerEmailIgnoreCase(String customerEmail);

    List<Booking> findByEventId(Long eventId);

    @Query("SELECT COALESCE(SUM(b.totalAmount), 0) FROM Booking b")
    Double getTotalRevenue();

    @Query("SELECT COALESCE(SUM(b.numberOfTickets), 0) FROM Booking b")
    Long getTotalTicketsSold();

    @Query("SELECT b.event.title, SUM(b.numberOfTickets), SUM(b.totalAmount) " +
           "FROM Booking b GROUP BY b.event.id, b.event.title")
    List<Object[]> getEventWiseSales();
}
