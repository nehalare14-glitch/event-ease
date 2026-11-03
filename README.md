# EventEase – Event Management System

EventEase is a Java-based web application developed as a Diploma in Computer Science and Engineering industrial training project. It helps users discover events, book tickets, and manage bookings.

## Features

- User registration and secure login
- Role-based access (Admin and Customer)
- Admin dashboard
- Create, update, and delete events
- Browse available events
- Book event tickets
- View booking history
- Cancel bookings and restore available seats
- Reports and analytics
- User settings and password change
- Secure password hashing using BCrypt

## Technology Stack

- Java 17
- Spring Boot 3.4.5
- Spring Security
- Spring Data JPA
- Thymeleaf
- HTML, CSS and JavaScript
- H2 Database (local development)
- PostgreSQL (production)

## Project Structure

```text
EventEase/
├── src/
│   └── main/
│       ├── java/com/eventease/
│       │   ├── config/
│       │   ├── controller/
│       │   ├── model/
│       │   ├── repository/
│       │   └── service/
│       └── resources/
│           ├── templates/
│           ├── static/
│           ├── application.properties
│           └── application-prod.properties
├── Dockerfile
├── pom.xml
└── README.md
