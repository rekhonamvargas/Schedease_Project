# SchedEase Project

A full-stack course scheduling application for managing academic schedules.

## Project Structure

- **Backend**: Spring Boot application (Java 19) with MySQL database
- **Frontend**: React application with Material-UI (located in `schedease_frontend/`)

## Prerequisites

- Java 19 or higher
- Node.js and npm
- MySQL 8.0
- Git

## Cloning the Project

Since the frontend is included as a submodule, use one of these methods:

### Option 1: Clone with submodules (Recommended)
```bash
git clone --recurse-submodules https://github.com/rekhonamvargas/Schedease_Project.git
```

### Option 2: Clone and initialize submodules separately
```bash
git clone https://github.com/rekhonamvargas/Schedease_Project.git
cd Schedease_Project
git submodule init
git submodule update
```

## Database Setup

1. Create MySQL database:
```sql
CREATE DATABASE dbgirlcode;
```

2. Update database credentials in `src/main/resources/application.properties` if needed:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/dbgirlcode
spring.datasource.username=root
spring.datasource.password=123456
```

## Running the Application

### Backend (Port 8081)

Using Maven wrapper (Windows):
```bash
.\mvnw.cmd spring-boot:run
```

Using Maven wrapper (Linux/Mac):
```bash
./mvnw spring-boot:run
```

### Frontend (Port 3000)

```bash
cd schedease_frontend
npm install
npm start
```

## Features

- **User Authentication**: Signup and login functionality
- **Course Management**: Import and manage course data
- **Schedule Builder**: Create and save custom schedules
- **CRUD Operations**: Full create, read, update, delete for all entities
  - Data (Courses/Subjects)
  - Users
  - Schedules
  - Subject Lists

## API Endpoints

### Data (Courses)
- `POST /api/data` - Create new course
- `GET /api/data` - Get all courses
- `PUT /api/data/{id}` - Update course
- `DELETE /api/data/{id}` - Delete course

### Users
- `POST /api/users` - Create user
- `GET /api/users` - Get all users
- `GET /api/users/{id}` - Get user by ID
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

### Schedules
- `POST /api/schedule/postScheduleRecord` - Create schedule
- `GET /api/schedule/getAllSchedules` - Get all schedules
- `PUT /api/schedule/updateSchedule?scheduleId={id}` - Update schedule
- `DELETE /api/schedule/deleteSchedule/{id}` - Delete schedule

### Subject Lists
- `POST /api/subjectlists` - Create subject list
- `GET /api/subjectlists` - Get all subject lists
- `GET /api/subjectlists/{id}` - Get subject list by ID
- `PUT /api/subjectlists/{id}` - Update subject list
- `DELETE /api/subjectlists/{id}` - Delete subject list

## Technologies Used

### Backend
- Spring Boot 3.3.5
- Java 19
- MySQL 8
- Hibernate/JPA
- Maven

### Frontend
- React 19.2.0
- Material-UI (MUI)
- React Router
- Axios for API calls

## Development Notes

- Backend runs on port 8081
- Frontend runs on port 3000
- CORS is configured to allow cross-origin requests
- Database schema is auto-updated by Hibernate

## Troubleshooting

### Frontend folder is empty after cloning
Make sure to initialize submodules:
```bash
git submodule update --init --recursive
```

### Port already in use
Kill the process using the port:
```bash
# Windows
netstat -ano | findstr :8081
taskkill /F /PID <PID>

# Linux/Mac
lsof -ti:8081 | xargs kill -9
```

### Failed to fetch / CORS errors
Ensure backend is running on port 8081 before starting frontend.

## License

This project is for educational purposes.
