import { useState, useCallback, useEffect } from "react";
import { nextId } from "../utils/ids";
import { userKey } from "../utils/storage";
import { apiFetch } from "../utils/api";

const SUBJECTS_STORAGE_BASE = "schedease_subjects";

// Load subjects from API
async function loadSubjectsFromAPI() {
  try {
    const data = await apiFetch("/data");
    // Map backend fields to frontend fields
    return (data || []).map(item => ({
      ...item,
      data_id: item.dataId,
      subject_code: item.subject,
      subject_title: item.subjectTitle,
      credited_units: item.creditedUnits,
      total_slots: item.totalSlots,
      is_closed: item.isClosed === "true" || item.isClosed === true,
    }));
  } catch (error) {
    console.error("Failed to load subjects from API:", error);
    return [];
  }
}

// Save subject to API (create or update)
async function saveSubjectToAPI(subject) {
  try {
    // Map frontend fields to backend fields
    const backendSubject = {
      dataId: subject.data_id || subject.dataId,
      number: subject.number,
      offeringDept: subject.offering_dept || subject.offeringDept,
      subject: subject.subject_code || subject.subject,
      subjectTitle: subject.subject_title || subject.subjectTitle,
      creditedUnits: subject.credited_units || subject.creditedUnits,
      section: subject.section,
      schedule: subject.schedule,
      room: subject.room,
      totalSlots: subject.total_slots || subject.totalSlots,
      enrolled: subject.enrolled,
      assessed: subject.assessed,
      isClosed: subject.is_closed ? "true" : "false",
    };

    let created;
    if (backendSubject.dataId) {
      // Update
      created = await apiFetch(`/data/${backendSubject.dataId}`, { method: "PUT", body: backendSubject });
    } else {
      // Create
      created = await apiFetch("/data", { method: "POST", body: backendSubject });
    }
    // Map back to frontend format
    return {
      ...created,
      data_id: created.dataId,
      subject_code: created.subject,
      subject_title: created.subjectTitle,
      credited_units: created.creditedUnits,
      total_slots: created.totalSlots,
      is_closed: created.isClosed === "true" || created.isClosed === true,
    };
  } catch (error) {
    console.error("Failed to save subject to API:", error);
    throw error;
  }
}

// Delete subject from API
async function deleteSubjectFromAPI(id) {
  try {
    await apiFetch(`/data/${id}`, { method: "DELETE" });
  } catch (error) {
    console.error("Failed to delete subject from API:", error);
    throw error;
  }
}

export default function useSubjects(initial = []) {
  const [subjects, setSubjects] = useState(initial);
  const [loading, setLoading] = useState(true);

  // Load subjects from API on mount
  useEffect(() => {
    const loadSubjects = async () => {
      setLoading(true);
      const data = await loadSubjectsFromAPI();
      setSubjects(data);
      setLoading(false);
    };
    loadSubjects();
  }, []);

  const addMany = useCallback(async (parsedArray = []) => {
    try {
      const newSubjects = [];
      for (const p of parsedArray) {
        // Map to backend format
        const backendSubject = {
          number: p.number,
          offeringDept: p.offering_dept || p.offeringDept,
          subject: p.subject_code || p.subject,
          subjectTitle: p.subject_title || p.subjectTitle,
          creditedUnits: p.credited_units || p.creditedUnits,
          section: p.section,
          schedule: p.schedule,
          room: p.room,
          totalSlots: p.total_slots || p.totalSlots,
          enrolled: p.enrolled,
          assessed: p.assessed,
          isClosed: p.is_closed ? "true" : "false",
        };
        const created = await apiFetch("/data", { method: "POST", body: backendSubject });
        // Map back
        const frontendSubject = {
          ...created,
          data_id: created.dataId,
          subject_code: created.subject,
          subject_title: created.subjectTitle,
          credited_units: created.creditedUnits,
          total_slots: created.totalSlots,
          is_closed: created.isClosed === "true" || created.isClosed === true,
        };
        newSubjects.push(frontendSubject);
      }
      setSubjects((prev) => prev.concat(newSubjects));
    } catch (error) {
      console.error("Failed to add subjects:", error);
      // Fallback to local if API fails
      setSubjects((prev) => {
        const existing = new Set(prev.map((d) => String(d.data_id)));
        const mapped = parsedArray.map((p) => {
          let id = String(p.data_id || "");
          if (!id || existing.has(id)) {
            do {
              id = nextId("data");
            } while (existing.has(id));
          }
          existing.add(id);
          return { ...p, data_id: id };
        });
        return prev.concat(mapped);
      });
    }
  }, []);

  const save = useCallback(async (item, skipValidation = false) => {
    if (!item) return { success: false, error: "No item provided" };

    try {
      // For API, use data_id
      if (!item.data_id) item.data_id = nextId("data");

      // Check for duplicate title locally for now (API might handle it)
      if (!skipValidation) {
        const trimmedTitle = (item.subject_title || "").trim().toLowerCase();
        if (trimmedTitle) {
          const isDuplicate = subjects.some((p) => {
            const existingTitle = (p.subject_title || "").trim().toLowerCase();
            const isSameId = String(p.data_id) === String(item.data_id);
            return existingTitle === trimmedTitle && !isSameId;
          });

          if (isDuplicate) {
            return { success: false, error: "A subject with this title already exists" };
          }
        }
      }

      const saved = await saveSubjectToAPI(item);

      setSubjects((prev) => {
        let found = false;
        const next = prev.map((p) => {
          if (String(p.data_id) === String(saved.data_id)) {
            found = true;
            return saved;
          }
          return p;
        });
        if (!found) next.unshift(saved);
        return next;
      });

      return { success: true };
    } catch (error) {
      console.error("Failed to save subject:", error);
      return { success: false, error: error.message || "Failed to save subject" };
    }
  }, [subjects]);

  const remove = useCallback(async (id) => {
    try {
      await deleteSubjectFromAPI(id);
      setSubjects((prev) => prev.filter((p) => String(p.data_id) !== String(id)));
    } catch (error) {
      console.error("Failed to delete subject:", error);
      // Still remove locally if API fails
      setSubjects((prev) => prev.filter((p) => String(p.data_id) !== String(id)));
    }
  }, []);

  return { subjects, addMany, save, remove, setSubjects, loading };
}
