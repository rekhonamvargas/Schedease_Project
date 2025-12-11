package com.appdevg5.girlcode.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.appdevg5.girlcode.entity.DataEntity;
import com.appdevg5.girlcode.entity.UserEntity;

@Repository
public interface DataRepository extends JpaRepository<DataEntity, Long> {
    List<DataEntity> findByUser(UserEntity user);
    List<DataEntity> findByUser_UserId(Long userId);
}
