
package com.eventease.controller;

import com.eventease.model.Event;
import com.eventease.model.User;
import com.eventease.repository.UserRepository;
import com.eventease.service.EventService;
import com.eventease.service.BookingService;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;

@Controller
public class HomeController {

    private final EventService eventService;
    private final BookingService bookingService;
    private final UserRepository userRepository;

    public HomeController(
            EventService eventService,
            BookingService bookingService,
            UserRepository userRepository) {
        this.eventService = eventService;
        this.bookingService = bookingService;
        this.userRepository = userRepository;
    }

    @GetMapping("/")
    public String home(Model model) {
        model.addAttribute("events", eventService.getAllEvents());
        model.addAttribute("totalEvents", eventService.getTotalEvents());
        model.addAttribute("totalBookings", bookingService.getTotalBookings());
        model.addAttribute("totalRevenue", bookingService.getTotalRevenue());
        model.addAttribute("totalTicketsSold", bookingService.getTotalTicketsSold());

        List<Object[]> sales = bookingService.getEventWiseSales();
        model.addAttribute("eventWiseSales", sales);

        String mostPopularEvent = "No bookings yet";
        long highestTickets = 0;

        for (Object[] row : sales) {
            long tickets = ((Number) row[1]).longValue();
            if (tickets > highestTickets) {
                highestTickets = tickets;
                mostPopularEvent = (String) row[0];
            }
        }

        model.addAttribute("mostPopularEvent", mostPopularEvent);
        model.addAttribute("newEvent", new Event());

        return "home";
    }

    @GetMapping("/bookings")
    public String bookings(Model model, Authentication authentication) {

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (isAdmin) {
            model.addAttribute("bookings", bookingService.getAllBookings());
            model.addAttribute("totalBookings",
                    bookingService.getTotalBookings());
        } else {
            User user = userRepository.findByUsername(authentication.getName())
                    .orElseThrow(() ->
                            new IllegalStateException("Logged-in user not found."));

            model.addAttribute("bookings",
                    bookingService.getBookingsByEmail(user.getEmail()));
        }

        return "bookings";
    }

    @PostMapping("/events/save")
    public String saveEvent(
            @ModelAttribute("newEvent") Event event,
            RedirectAttributes redirectAttributes) {

        eventService.saveEvent(event);
        redirectAttributes.addFlashAttribute(
                "successMessage", "Event saved successfully!");

        return "redirect:/";
    }

    @GetMapping("/events/delete/{id}")
    public String deleteEvent(
            @PathVariable Long id,
            RedirectAttributes redirectAttributes) {

        eventService.deleteEvent(id);
        redirectAttributes.addFlashAttribute(
                "successMessage", "Event deleted successfully!");

        return "redirect:/";
    }
}


