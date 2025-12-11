package com.appdevg5.girlcode.controller;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.appdevg5.girlcode.entity.ScheduleEntity;
import com.appdevg5.girlcode.service.ScheduleService;

@RestController
@RequestMapping("/api/schedule")
@CrossOrigin(origins = "*")
public class ScheduleController {

    @Autowired
    ScheduleService sserv;

    @GetMapping("/print")
    public String print() {
        return "Hello, Firstname Lastname";
    }

    // Create (C)
    @PostMapping("/postScheduleRecord")
    public ScheduleEntity postScheduleRecord(@RequestBody ScheduleEntity schedule) {
        return sserv.postScheduleRecord(schedule);
    }

    // Read (R)
    @GetMapping("/getAllSchedules")
    public List<ScheduleEntity> getAllSchedules(@RequestParam(required = false) Long userId) {
        if (userId != null) {
            return sserv.getSchedulesByUserId(userId);
        }
        return sserv.getAllSchedules();
    }

    //Update
    @PutMapping("/updateSchedule")
    public ScheduleEntity updateSchedule(@RequestParam int scheduleId, @RequestBody ScheduleEntity newScheduleDetails) {
        return sserv.updateSchedule(scheduleId, newScheduleDetails);
    }

    //Delete
    @DeleteMapping("/deleteSchedule/{scheduleId}")
    public String deleteSchedule(@PathVariable int scheduleId) {
        return sserv.deleteSchedule(scheduleId);
    }
}
