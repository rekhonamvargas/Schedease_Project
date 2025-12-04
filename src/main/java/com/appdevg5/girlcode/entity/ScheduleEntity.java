package com.appdevg5.girlcode.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "schedule")
public class ScheduleEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int scheduleId;

    // Relationship: Many schedules belong to one user
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    private String scheduleName;

    // These are generated or derived later based on filters, not manually set by users
    private String viewDays;
    private String timeRange;

    private boolean isSaved;

    @Column(columnDefinition = "TEXT")
    private String subjects; // JSON string of subject IDs

    public ScheduleEntity() {
        super();
    }

    public ScheduleEntity(int scheduleId, UserEntity user, String scheduleName, String viewDays, String timeRange, boolean isSaved, String subjects) {
        super();
        this.scheduleId = scheduleId;
        this.user = user;
        this.scheduleName = scheduleName;
        this.viewDays = viewDays;
        this.timeRange = timeRange;
        this.isSaved = isSaved;
        this.subjects = subjects;
    }

    public int getScheduleId() {
        return scheduleId;
    }

    public void setScheduleId(int scheduleId) {
        this.scheduleId = scheduleId;
    }

    public UserEntity getUser() {
        return user;
    }

    public void setUser(UserEntity user) {
        this.user = user;
    }

    public String getScheduleName() {
        return scheduleName;
    }

    public void setScheduleName(String scheduleName) {
        this.scheduleName = scheduleName;
    }

    public String getViewDays() {
        return viewDays;
    }

    public void setViewDays(String viewDays) {
        this.viewDays = viewDays;
    }

    public String getTimeRange() {
        return timeRange;
    }

    public void setTimeRange(String timeRange) {
        this.timeRange = timeRange;
    }

    public boolean getIsSaved() {
        return isSaved;
    }

    public void setIsSaved(boolean isSaved) {
        this.isSaved = isSaved;
    }

    public String getSubjects() {
        return subjects;
    }

    public void setSubjects(String subjects) {
        this.subjects = subjects;
    }
}