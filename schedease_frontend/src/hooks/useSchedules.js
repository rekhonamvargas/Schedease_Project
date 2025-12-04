import { useState, useCallback, useEffect } from "react";
import { nextId } from "../utils/ids";
import { userKey } from "../utils/storage";
import { apiFetch } from "../utils/api";

const SCHEDULES_STORAGE_BASE = "schedease_schedules";

// Load schedules from API
async function loadSchedulesFromAPI() {
  try {
    const data = await apiFetch("/schedule/getAllSchedules");
    // Map backend fields to frontend fields
    return (data || []).map(item => ({
      ...item,
      schedule_id: item.scheduleId,
      schedule_name: item.scheduleName,
      subjects: item.subjects ? JSON.parse(item.subjects) : [],
      is_saved: item.isSaved,
    }));
  } catch (error) {
    console.error("Failed to load schedules from API:", error);
    return [];
  }
}

// Save schedule to API (create or update)
async function saveScheduleToAPI(schedule) {
  try {
    // Map frontend fields to backend fields
    const backendSchedule = {
      scheduleName: schedule.schedule_name || schedule.scheduleName,
      subjects: JSON.stringify(schedule.subjects || []),
      isSaved: schedule.is_saved !== undefined ? schedule.is_saved : true,
    };

    let created;
    // Check if schedule_id is a number (existing) or string (new)
    const isExisting = typeof schedule.schedule_id === 'number' || (typeof schedule.schedule_id === 'string' && !isNaN(parseInt(schedule.schedule_id)));

    if (isExisting && parseInt(schedule.schedule_id) > 0) {
      // Update existing
      backendSchedule.scheduleId = parseInt(schedule.schedule_id);
      created = await apiFetch(`/schedule/updateSchedule?scheduleId=${backendSchedule.scheduleId}`, { method: "PUT", body: backendSchedule });
    } else {
      // Create new
      created = await apiFetch("/schedule/postScheduleRecord", { method: "POST", body: backendSchedule });
    }
    // Map back to frontend format
    return {
      ...created,
      schedule_id: created.scheduleId,
      schedule_name: created.scheduleName,
      subjects: created.subjects ? JSON.parse(created.subjects) : [],
      is_saved: created.isSaved,
    };
  } catch (error) {
    console.error("Failed to save schedule to API:", error);
    throw error;
  }
}

// Delete schedule from API
async function deleteScheduleFromAPI(id) {
  try {
    // Ensure id is numeric
    const numericId = parseInt(id);
    await apiFetch(`/schedule/deleteSchedule/${numericId}`, { method: "DELETE" });
  } catch (error) {
    console.error("Failed to delete schedule from API:", error);
    throw error;
  }
}

export default function useSchedules(initial = []) {
  const [schedules, setSchedules] = useState(initial);
  const [loading, setLoading] = useState(true);

  // Load schedules from API on mount
  useEffect(() => {
    const loadSchedules = async () => {
      setLoading(true);
      const data = await loadSchedulesFromAPI();
      setSchedules(data);
      setLoading(false);
    };
    loadSchedules();
  }, []);

  const saveSchedule = useCallback(async (newSchedule) => {
    if (!newSchedule) return;
    try {
      if (!newSchedule.schedule_id) newSchedule.schedule_id = nextId("schedule");
      const saved = await saveScheduleToAPI(newSchedule);
      setSchedules((prev) => {
        const exists = prev.find((s) => s.schedule_id === saved.schedule_id);
        if (exists) return prev.map((s) => (s.schedule_id === saved.schedule_id ? saved : s));
        return [saved, ...prev];
      });
    } catch (error) {
      console.error("Failed to save schedule:", error);
      // Fallback to local
      setSchedules((prev) => {
        const exists = prev.find((s) => s.schedule_id === newSchedule.schedule_id);
        if (exists) return prev.map((s) => (s.schedule_id === newSchedule.schedule_id ? newSchedule : s));
        return [newSchedule, ...prev];
      });
    }
  }, []);

  const deleteSchedule = useCallback(async (id) => {
    try {
      await deleteScheduleFromAPI(id);
      setSchedules((prev) => prev.filter((s) => s.schedule_id !== id));
    } catch (error) {
      console.error("Failed to delete schedule:", error);
      // Still remove locally if API fails
      setSchedules((prev) => prev.filter((s) => s.schedule_id !== id));
    }
  }, []);

  const removeSubjectFromSchedules = useCallback((subjectId) => {
    setSchedules((prev) =>
      prev.map((s) => ({ ...s, subjects: (s.subjects || []).filter((x) => x !== subjectId) }))
    );
  }, []);

  return { schedules, saveSchedule, deleteSchedule, removeSubjectFromSchedules, setSchedules, loading };
}
