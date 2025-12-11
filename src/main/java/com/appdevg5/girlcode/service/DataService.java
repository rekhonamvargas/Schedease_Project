package com.appdevg5.girlcode.service;

import java.util.HashSet;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.appdevg5.girlcode.entity.DataEntity;
import com.appdevg5.girlcode.entity.ScheduleEntity;
import com.appdevg5.girlcode.repository.DataRepository;
import com.appdevg5.girlcode.repository.ScheduleRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class DataService {

    @Autowired
    DataRepository dataRepo;

    @Autowired
    ScheduleRepository scheduleRepo;

    public DataService(DataRepository dataRepo) {
        this.dataRepo = dataRepo;
    }

    // C - CREATE
    public DataEntity postData(DataEntity data) {
        return dataRepo.save(data);
    }

    // R - READ ALL
    public List<DataEntity> getAllData() {
        return dataRepo.findAll();
    }

    // R - READ BY USER ID
    public List<DataEntity> getDataByUserId(Long userId) {
        return dataRepo.findByUser_UserId(userId);
    }

    // U - UPDATE
    public DataEntity updateData(Long id, DataEntity newDataDetails) {
        DataEntity data = dataRepo.findById(id)
            .orElseThrow(() -> new NoSuchElementException("Data with ID " + id + " does not exist!"));

        // update
        data.setNumber(newDataDetails.getNumber());
        data.setOfferingDept(newDataDetails.getOfferingDept());
        data.setSubject(newDataDetails.getSubject());
        data.setSubjectTitle(newDataDetails.getSubjectTitle());
        data.setCreditedUnits(newDataDetails.getCreditedUnits());
        data.setSection(newDataDetails.getSection());
        data.setSchedule(newDataDetails.getSchedule());
        data.setRoom(newDataDetails.getRoom());
        data.setTotalSlots(newDataDetails.getTotalSlots());
        data.setEnrolled(newDataDetails.getEnrolled());
        data.setAssessed(newDataDetails.getAssessed());
        if (newDataDetails.getIsClosed() != null) {
            data.setIsClosed(newDataDetails.getIsClosed());
        }

        return dataRepo.save(data);
    }

    // D - DELETE
    public String deleteData(Long id) {
        if (dataRepo.existsById(id)) {
            dataRepo.deleteById(id);
            return "Data with ID " + id + " is successfully deleted!";
        } else {
            return "Data with ID " + id + " does not exist!";
        }
    }

    // D - DELETE ALL FOR USER (Clear List)
    public String clearUserData(Long userId) {
        List<DataEntity> userDataList = dataRepo.findByUser_UserId(userId);
        if (userDataList.isEmpty()) {
            return "No data found for user ID " + userId;
        }
        
        // Get all saved schedules for this user
        List<ScheduleEntity> savedSchedules = scheduleRepo.findByUser_UserId(userId);
        
        // Extract all subject IDs that are in saved schedules
        Set<Long> protectedSubjectIds = new HashSet<>();
        ObjectMapper mapper = new ObjectMapper();
        
        for (ScheduleEntity schedule : savedSchedules) {
            if (schedule.getSubjects() != null && !schedule.getSubjects().isEmpty()) {
                try {
                    // Parse the JSON array of subject IDs
                    Long[] subjectIds = mapper.readValue(schedule.getSubjects(), Long[].class);
                    for (Long id : subjectIds) {
                        protectedSubjectIds.add(id);
                    }
                } catch (Exception e) {
                    // If parsing fails, skip this schedule
                    System.err.println("Failed to parse subjects for schedule: " + schedule.getScheduleId());
                }
            }
        }
        
        // Filter out subjects that are in saved schedules
        List<DataEntity> subjectsToDelete = userDataList.stream()
            .filter(data -> !protectedSubjectIds.contains(data.getDataId()))
            .collect(Collectors.toList());
        
        if (subjectsToDelete.isEmpty()) {
            return "No subjects to delete (all subjects are in saved schedules)";
        }
        
        int count = subjectsToDelete.size();
        int protectedCount = userDataList.size() - count;
        dataRepo.deleteAll(subjectsToDelete);
        
        if (protectedCount > 0) {
            return "Successfully deleted " + count + " items. " + protectedCount + " subjects preserved (in saved schedules)";
        }
        return "Successfully deleted " + count + " items for user ID " + userId;
    }
}
