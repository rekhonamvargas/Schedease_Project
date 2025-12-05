package com.appdevg5.girlcode.service;

import java.util.List;
import java.util.NoSuchElementException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.appdevg5.girlcode.entity.DataEntity;
import com.appdevg5.girlcode.repository.DataRepository;

@Service
public class DataService {

    @Autowired
    DataRepository dataRepo;

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
}
