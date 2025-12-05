@echo off
cd /d c:\Users\Aaliyah\Schedease_Project
echo Starting Spring Boot backend on port 8080...
setlocal enabledelayedexpansion
echo n | mvnw.cmd spring-boot:run
