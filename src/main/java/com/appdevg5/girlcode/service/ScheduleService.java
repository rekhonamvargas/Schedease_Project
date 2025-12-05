package com.appdevg5.girlcode.service;

import java.util.List;
import java.util.NoSuchElementException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.appdevg5.girlcode.entity.ScheduleEntity;
import com.appdevg5.girlcode.entity.UserEntity;
import com.appdevg5.girlcode.repository.ScheduleRepository;
import com.appdevg5.girlcode.repository.UserRepository;

@Service // contains the business logic of ur system
public class ScheduleService {

    @Autowired
    ScheduleRepository srepo;

    @Autowired
    UserRepository userRepository;

    public ScheduleService() {
        super();
    }

    // Create (C)
    public ScheduleEntity postScheduleRecord(ScheduleEntity schedule) {
        // If user is not set, use default user (id=1)
        if (schedule.getUser() == null) {
            // Fetch the default user from DB
            UserEntity defaultUser = userRepository.findById(1L).orElse(null);
            if (defaultUser == null) {
                // Create default user if not exists
                defaultUser = new UserEntity();
                defaultUser.setUserId(1L);
                defaultUser.setUsername("default");
                defaultUser.setEmail("default@example.com");
                defaultUser.setFullName("Default User");
                defaultUser.setPassword("default");
                defaultUser = userRepository.save(defaultUser);
            }
            schedule.setUser(defaultUser);
        }
        return srepo.save(schedule);
    }

    // Read (R)
    public List<ScheduleEntity> getAllSchedules() {
        return srepo.findAll();
    }

    public ScheduleEntity updateSchedule(int scheduleId, ScheduleEntity newScheduleDetails) {
        ScheduleEntity schedule = srepo.findById(scheduleId)
            .orElseThrow(() -> new NoSuchElementException("Schedule " + scheduleId + " does not exist!"));
        
        //update the record
        schedule.setScheduleName(newScheduleDetails.getScheduleName());
        schedule.setIsSaved(newScheduleDetails.getIsSaved());
        schedule.setViewDays(newScheduleDetails.getViewDays());
        schedule.setTimeRange(newScheduleDetails.getTimeRange());
        schedule.setSubjects(newScheduleDetails.getSubjects());
        
        return srepo.save(schedule);
    }

    // Delete
    //return type for delete is string bcs were jst going to print a success delete message
    public String deleteSchedule(int scheduleId) {
        if (srepo.findById(scheduleId).isPresent()) {
            srepo.deleteById(scheduleId);
            return "Schedule " + scheduleId + " is successfully deleted";
        } else {
            return "Schedule " + scheduleId + " does not exist";
        }
    }
}
