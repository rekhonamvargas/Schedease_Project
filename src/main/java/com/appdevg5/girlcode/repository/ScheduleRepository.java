package com.appdevg5.girlcode.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.appdevg5.girlcode.entity.ScheduleEntity;
import com.appdevg5.girlcode.entity.UserEntity;

@Repository
public interface ScheduleRepository extends JpaRepository<ScheduleEntity, Integer> {

    // public ScheduleEntity findByScheduleName(String schedule_name);
    List<ScheduleEntity> findByUser(UserEntity user);
    List<ScheduleEntity> findByUser_UserId(Long userId);
}
