import React, { useMemo, useState, useCallback, useEffect } from "react";
import { Container, Box, Typography, Snackbar, Alert } from "@mui/material";
import Header from "./Header";
import Sidebar from "./Sidebar";
import ImportData from "./ImportData";
import Schedule from "./Schedule";
import SubjectList from "./SubjectList";
import DataForm from "./DataForm";
import useSubjects from "../hooks/useSubjects";
import useSchedules from "../hooks/useSchedules";
import useFilters from "../hooks/useFilters";
import { userKey } from "../utils/storage";
import { apiFetch } from "../utils/api";
import { parseScheduleString } from "../utils/parse";
import SetFilter from "./SetFilter";
import "../App.css";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {
    subjects: dataList,
    addMany: handleAddMany,
    save: handleSaveEdited,
    remove: handleDeleteData,
    setSubjects,
  } = useSubjects([]);

  const {
    schedules: scheduleList,
    saveSchedule: handleSaveSchedule,
    deleteSchedule: handleDeleteSchedule,
    removeSubjectFromSchedules,
  } = useSchedules([]);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const {
    breakBetweenMinutes,
    setBreakBetweenMinutes,
    excludeDays,
    toggleExcludeDay,
    classTypes,
    toggleClassType,
    filterSubjects,
  } = useFilters({});

  const handleEditOpen = useCallback((item) => {
    setEditing(item);
    setEditOpen(true);
  }, []);

  const handleSaveEditedWrapper = useCallback(
    (item) => {
      const result = handleSaveEdited(item);
      if (result && !result.success) {
        // Show error message
        setSnackMsg(result.error || "Failed to save subject");
        setSnackSeverity("error");
        setSnackOpen(true);
        return;
      }
      setEditOpen(false);
      setEditing(null);
    },
    [handleSaveEdited]
  );

  const handleDeleteDataWrapper = useCallback(
    (id) => {
      handleDeleteData(id);
      removeSubjectFromSchedules(id);
      // Remove from added subjects if it was added
      setAddedSubjectIds((prev) => {
        const next = new Set(prev);
        next.delete(String(id));
        return next;
      });
    },
    [handleDeleteData, removeSubjectFromSchedules]
  );

  const openSubjects = useMemo(() => (dataList || []).filter((d) => !d.is_closed), [dataList]);

  // Track added subjects for the schedule with localStorage persistence (per-user)
  const ADDED_KEY = userKey("schedease_added_subjects");
  const [addedSubjectIds, setAddedSubjectIds] = useState(() => {
    try {
      const stored = localStorage.getItem(ADDED_KEY);
      if (stored) return new Set(JSON.parse(stored));
    } catch (error) {
      console.error("Failed to load added subjects from localStorage:", error);
    }
    return new Set();
  });

  // Persist added subjects to localStorage per-user
  useEffect(() => {
    try {
      localStorage.setItem(ADDED_KEY, JSON.stringify(Array.from(addedSubjectIds)));
    } catch (error) {
      console.error("Failed to save added subjects to localStorage:", error);
    }
  }, [addedSubjectIds, ADDED_KEY]);
  
  // Track Schedule box height to match SubjectList
  const [scheduleHeight, setScheduleHeight] = useState(null);

  // Helper function to check if two schedules conflict
  const hasScheduleConflict = useCallback((schedule1, schedule2) => {
    if (!schedule1 || !schedule2) return false;
    
    const parseSchedule = (scheduleStr) => {
      const parts = scheduleStr.split(" / ").map(s => s.trim()).filter(Boolean);
      const schedules = [];
      
      for (const part of parts) {
        const parsed = parseScheduleString(part);
        if (parsed) {
          schedules.push(parsed);
        }
      }
      return schedules;
    };
    
    const convertTo24h = (time12) => {
      const match = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (!match) return null;
      let [, h, m, period] = match;
      h = parseInt(h, 10);
      m = parseInt(m, 10);
      if (period.toUpperCase() === "PM" && h !== 12) h += 12;
      if (period.toUpperCase() === "AM" && h === 12) h = 0;
      return h * 60 + m; // Return minutes from midnight
    };
    
    const schedules1 = parseSchedule(schedule1);
    const schedules2 = parseSchedule(schedule2);
    
    for (const s1 of schedules1) {
      for (const s2 of schedules2) {
        // Check if same day
        if (s1.day === s2.day) {
          const s1Start = convertTo24h(s1.start);
          const s1End = convertTo24h(s1.end);
          const s2Start = convertTo24h(s2.start);
          const s2End = convertTo24h(s2.end);
          
          if (s1Start !== null && s1End !== null && s2Start !== null && s2End !== null) {
            // Check for overlap: s1 starts before s2 ends AND s2 starts before s1 ends
            if (s1Start < s2End && s2Start < s1End) {
              return true;
            }
          }
        }
      }
    }
    
    return false;
  }, []);

  const handleSubjectAdd = useCallback((item, isAdded) => {
    const id = String(item.data_id ?? `${item.subject_code}-${item.section || ""}`);
    const itemSubjectCode = (item.subject_code || "").trim().toUpperCase();
    
    setAddedSubjectIds((prev) => {
      const next = new Set(prev);
      
      if (isAdded) {
        // Check if a subject with the same subject code is already added
        const alreadyAddedSameCode = dataList.some((subject) => {
          const subjectId = String(subject.data_id ?? `${subject.subject_code}-${subject.section || ""}`);
          const subjectCode = (subject.subject_code || "").trim().toUpperCase();
          return prev.has(subjectId) && subjectCode === itemSubjectCode && subjectId !== id;
        });
        
        if (alreadyAddedSameCode) {
          setSnackMsg(`Cannot add duplicate subject: A subject with code ${itemSubjectCode} is already in the schedule`);
          setSnackSeverity("error");
          setSnackOpen(true);
          return prev; // Don't modify the set
        }
        
        // Check for schedule conflicts
        const conflictingSubject = dataList.find((subject) => {
          const subjectId = String(subject.data_id ?? `${subject.subject_code}-${subject.section || ""}`);
          return prev.has(subjectId) && subjectId !== id && hasScheduleConflict(item.schedule, subject.schedule);
        });
        
        if (conflictingSubject) {
          setSnackMsg(`Schedule conflict: ${itemSubjectCode} conflicts with ${conflictingSubject.subject_code} (${conflictingSubject.section || ""})`);
          setSnackSeverity("error");
          setSnackOpen(true);
          return prev; // Don't modify the set
        }
        
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, [dataList, hasScheduleConflict]);

  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState("");
  const [snackSeverity, setSnackSeverity] = useState("success");

  const handleImportParsed = useCallback(
    (parsedArray = []) => {
      const filtered = filterSubjects(parsedArray || []);
      if ((filtered || []).length > 0) {
        handleAddMany(filtered);
        setSnackMsg(`Successfully added ${filtered.length} subject(s)`);
        setSnackSeverity("success");
        setSnackOpen(true);
      } else {
        setSnackMsg("No subjects matched the active filters. Adjust filters or clear them and try again.");
        setSnackSeverity("warning");
        setSnackOpen(true);
      }
    },
    [filterSubjects, handleAddMany]
  );

  const handleClearAll = useCallback(async () => {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      setSnackMsg("No subjects to delete");
      setSnackSeverity("info");
      setSnackOpen(true);
      return;
    }
    
    try {
      const userId = localStorage.getItem("user_id");
      if (!userId) {
        setSnackMsg("User not logged in");
        setSnackSeverity("error");
        setSnackOpen(true);
        return;
      }

      // Call backend to clear all user data
      const response = await apiFetch(`/data/clear?userId=${userId}`, {
        method: "DELETE",
      });
      
      // Clear local state only - saved schedules are NOT affected
      setSubjects([]);
      setAddedSubjectIds(new Set());
      
      setSnackMsg(response?.message || `Deleted ${dataList.length} subject(s)`);
      setSnackSeverity("success");
      setSnackOpen(true);
    } catch (error) {
      console.error("Failed to clear subjects:", error);
      setSnackMsg(error.message || "Failed to clear subjects");
      setSnackSeverity("error");
      setSnackOpen(true);
    }
  }, [dataList, setSubjects]);

  return (
    <Box className="App" sx={{ minHeight: "100vh", bgcolor: "#fff6db" }}>
      <Header onMenu={() => setSidebarOpen(true)} cartCount={scheduleList.length} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNavigate={() => setSidebarOpen(false)} />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <SetFilter
            breakBetweenMinutes={breakBetweenMinutes}
            setBreakBetweenMinutes={setBreakBetweenMinutes}
            excludeDays={excludeDays}
            toggleExcludeDay={toggleExcludeDay}
            classTypes={classTypes}
            toggleClassType={toggleClassType}
          />
        </Box>

        <Box sx={{ mb: 4 }}>
          <ImportData onCreateMany={handleImportParsed} />
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 3,
            alignItems: "flex-start",
            width: "100%",
          }}
        >
          <Box
            sx={{
              flex: 3.2,
              bgcolor: "#fffef7",
              borderRadius: 3,
              boxShadow: "0 2px 12px rgba(158, 8, 7, 0.08)",
              p: 3,
              minHeight: 640,
              width: "100%",
              display: "flex",
              flexDirection: "column",
              border: "1px solid rgba(244, 197, 34, 0.15)",
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              Schedule
            </Typography>

            <Box sx={{ flex: 1 }}>
              <Schedule
                dataList={openSubjects}
                schedules={scheduleList}
                onSaveSchedule={handleSaveSchedule}
                onDeleteSchedule={handleDeleteSchedule}
                addedSubjectIds={Array.from(addedSubjectIds)}
                onRemoveSubject={handleSubjectAdd}
                onHeightChange={setScheduleHeight}
              />
            </Box>
          </Box>

          <Box
            sx={{
              flex: 1,
              bgcolor: "#fffef7",
              borderRadius: 3,
              boxShadow: "0 2px 12px rgba(158, 8, 7, 0.08)",
              p: 2.5,
              height: scheduleHeight ? `${scheduleHeight}px` : "640px",
              minHeight: scheduleHeight ? `${scheduleHeight}px` : 640,
              maxHeight: scheduleHeight ? `${scheduleHeight}px` : 640,
              overflowY: "auto",
              width: "100%",
              boxSizing: "border-box",
              border: "1px solid rgba(244, 197, 34, 0.15)",
            }}
          >
            <SubjectList
              dataList={dataList}
              onEdit={handleEditOpen}
              onDelete={handleDeleteDataWrapper}
              onAdd={handleSubjectAdd}
              addedIds={Array.from(addedSubjectIds)}
              onGenerate={() => console.log("Generate Schedule clicked")}
              onClear={handleClearAll}
              totalImported={dataList.length}
              filtersActive={Boolean(
                breakBetweenMinutes ||
                excludeDays?.length ||
                classTypes?.length
              )}
            />
          </Box>
        </Box>
      </Container>

      <DataForm 
        open={editOpen} 
        initial={editing} 
        onClose={() => setEditOpen(false)} 
        onSave={handleSaveEditedWrapper}
        existingSubjects={dataList}
      />

      <Snackbar
        open={snackOpen}
        autoHideDuration={5000}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackOpen(false)}
          severity={snackSeverity}
          variant="filled"
          sx={{ width: "100%", fontSize: "1.05rem", py: 1.5, px: 3, fontWeight: 700 }}
        >
          {snackMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
/*import React, { useMemo, useState, useCallback } from "react";
import { Container, Box, Typography } from "@mui/material";
import Header from "./Header";
import Sidebar from "./Sidebar";
import ImportData from "./ImportData";
import Schedule from "./Schedule";
import SubjectList from "./SubjectList";
import DataForm from "./DataForm";
import useSubjects from "../hooks/useSubjects";
import useSchedules from "../hooks/useSchedules";


  Dashboard Component
  Main schedule management interface (previously the main App component)
 
export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { subjects: dataList, addMany: handleAddMany, save: handleSaveEdited, remove: handleDeleteData } = useSubjects([]);
  const { schedules: scheduleList, saveSchedule: handleSaveSchedule, deleteSchedule: handleDeleteSchedule, removeSubjectFromSchedules } = useSchedules([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const handleEditOpen = useCallback((item) => {
    setEditing(item);
    setEditOpen(true);
  }, []);

  const handleSaveEditedWrapper = useCallback((item) => {
    handleSaveEdited(item);
    setEditOpen(false);
    setEditing(null);
  }, [handleSaveEdited]);

  const handleDeleteDataWrapper = useCallback((id) => {
    handleDeleteData(id);
    removeSubjectFromSchedules(id);
  }, [handleDeleteData, removeSubjectFromSchedules]);

  const openSubjects = useMemo(() => (dataList || []).filter((d) => !d.is_closed), [dataList]);

  return (
    <Box className="App" sx={{ minHeight: "100vh", bgcolor: "#f5f5f5" }}>
      <Header onMenu={() => setSidebarOpen(true)} cartCount={scheduleList.length} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNavigate={() => setSidebarOpen(false)} />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <ImportData onCreateMany={handleAddMany} />
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 3,
            alignItems: "flex-start",
            width: "100%",
          }}
        >
          <Box
            sx={{
              flex: 3.2,
              bgcolor: "#fffef7",
              borderRadius: 3,
              boxShadow: "0 2px 12px rgba(158, 8, 7, 0.08)",
              p: 3,
              minHeight: 640,
              width: "100%",
              display: "flex",
              flexDirection: "column",
              border: "1px solid rgba(244, 197, 34, 0.15)",
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              Schedule
            </Typography>

            <Box sx={{ flex: 1 }}>
              <Schedule
                dataList={openSubjects}
                schedules={scheduleList}
                onSaveSchedule={handleSaveSchedule}
                onDeleteSchedule={handleDeleteSchedule}
              />
            </Box>
          </Box>

          <Box
            sx={{
              flex: 1,
              bgcolor: "#fdfaf0",
              borderRadius: 3,
              boxShadow: "0 1px 8px rgba(0,0,0,0.12)",
              p: 2.5,
              minHeight: 640,
              maxHeight: 640,
              overflowY: "auto",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: "#9e0807" }}>
              Subjects
            </Typography>

            <SubjectList dataList={dataList} onEdit={handleEditOpen} onDelete={handleDeleteDataWrapper} />
          </Box>
        </Box>
      </Container>

      <DataForm open={editOpen} initial={editing} onClose={() => setEditOpen(false)} onSave={handleSaveEditedWrapper} />
    </Box>
  );
}

---
import React, { useMemo, useState, useCallback } from "react";
import { Container, Box, Typography, Snackbar, Alert } from "@mui/material";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import ImportData from "./components/ImportData";
import Schedule from "./components/Schedule";
import SubjectList from "./components/SubjectList";
import DataForm from "./components/DataForm";
import useSubjects from "./hooks/useSubjects";
import useSchedules from "./hooks/useSchedules";
import useFilters from "./hooks/useFilters";
import SetFilter from "./components/SetFilter";
import "./App.css";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { subjects: dataList, addMany: handleAddMany, save: handleSaveEdited, remove: handleDeleteData } = useSubjects([]);
  const { schedules: scheduleList, saveSchedule: handleSaveSchedule, deleteSchedule: handleDeleteSchedule, removeSubjectFromSchedules } = useSchedules([]);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const {
    breakBetweenMinutes,
    setBreakBetweenMinutes,
    excludeDays,
    toggleExcludeDay,
    classTypes,
    toggleClassType,
    filterSubjects,
  } = useFilters({});

  const handleEditOpen = useCallback((item) => {
    setEditing(item);
    setEditOpen(true);
  }, []);

  const handleSaveEditedWrapper = useCallback((item) => {
    handleSaveEdited(item);
    setEditOpen(false);
    setEditing(null);
  }, [handleSaveEdited]);

  const handleDeleteDataWrapper = useCallback((id) => {
    handleDeleteData(id);
    removeSubjectFromSchedules(id);
  }, [handleDeleteData, removeSubjectFromSchedules]);

  const openSubjects = useMemo(() => (dataList || []).filter((d) => !d.is_closed), [dataList]);

  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState("");
  const [snackSeverity, setSnackSeverity] = useState("success");

  const handleImportParsed = useCallback(
    (parsedArray = []) => {
      const filtered = filterSubjects(parsedArray || []);
      if ((filtered || []).length > 0) {
        handleAddMany(filtered);
        setSnackMsg(`Successfully added ${filtered.length} subject(s) matching the filter`);
        setSnackSeverity("success");
      } else {
        // clearer message when nothing matched
        setSnackMsg("No subjects matched the active filters. Adjust filters or clear them and try again.");
        setSnackSeverity("warning");
      }
      setSnackOpen(true);
    },
    [filterSubjects, handleAddMany]
  );

  const handleClearAll = useCallback(async () => {
    if (!Array.isArray(dataList) || dataList.length === 0) {
      setSnackMsg("No subjects to delete");
      setSnackSeverity("info");
      setSnackOpen(true);
      return;
    }
    
    try {
      const userId = localStorage.getItem("user_id");
      if (!userId) {
        setSnackMsg("User not logged in");
        setSnackSeverity("error");
        setSnackOpen(true);
        return;
      }

      // Call backend to clear all user data
      const response = await apiFetch(`/data/clear?userId=${userId}`, {
        method: "DELETE",
      });
      
      // Clear local state only - saved schedules are NOT affected
      setSubjects([]);
      setAddedSubjectIds(new Set());
      
      setSnackMsg(response?.message || `Deleted ${dataList.length} subject(s)`);
      setSnackSeverity("success");
      setSnackOpen(true);
    } catch (error) {
      console.error("Failed to clear subjects:", error);
      setSnackMsg(error.message || "Failed to clear subjects");
      setSnackSeverity("error");
      setSnackOpen(true);
    }
  }, [dataList, setSubjects]);

  return (
    <Box className="App" sx={{ minHeight: "100vh", bgcolor: "#f5f5f5" }}>
      <Header onMenu={() => setSidebarOpen(true)} cartCount={scheduleList.length} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNavigate={() => setSidebarOpen(false)} />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <SetFilter
            breakBetweenMinutes={breakBetweenMinutes}
            setBreakBetweenMinutes={setBreakBetweenMinutes}
            excludeDays={excludeDays}
            toggleExcludeDay={toggleExcludeDay}
            classTypes={classTypes}
            toggleClassType={toggleClassType}
          />
        </Box>

        <Box sx={{ mb: 4 }}>
          <ImportData onCreateMany={handleImportParsed} />
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 3,
            alignItems: "flex-start",
            width: "100%",
          }}
        >
          <Box
            sx={{
              flex: 3.2,
              bgcolor: "#fffef7",
              borderRadius: 3,
              boxShadow: "0 2px 12px rgba(158, 8, 7, 0.08)",
              p: 3,
              minHeight: 640,
              width: "100%",
              display: "flex",
              flexDirection: "column",
              border: "1px solid rgba(244, 197, 34, 0.15)",
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              Schedule
            </Typography>

            <Box sx={{ flex: 1 }}>
              <Schedule
                dataList={openSubjects}
                schedules={scheduleList}
                onSaveSchedule={handleSaveSchedule}
                onDeleteSchedule={handleDeleteSchedule}
              />
            </Box>
          </Box>

          <Box
            sx={{
              flex: 1,
              bgcolor: "#fdfaf0",
              borderRadius: 3,
              boxShadow: "0 1px 8px rgba(0,0,0,0.12)",
              p: 2.5,
              minHeight: 640,
              maxHeight: 640,
              overflowY: "auto",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <SubjectList
              dataList={dataList}
              onEdit={handleEditOpen}
              onDelete={handleDeleteDataWrapper}
              onGenerate={() => console.log("Generate Schedule clicked")}
              onClear={handleClearAll}
              totalImported={dataList.length}
              filtersActive={Boolean(breakBetweenMinutes || (excludeDays && excludeDays.length) || (classTypes && classTypes.length))}
            />
          </Box>
        </Box>
      </Container>

      <DataForm open={editOpen} initial={editing} onClose={() => setEditOpen(false)} onSave={handleSaveEditedWrapper} />

      <Snackbar
        open={snackOpen}
        autoHideDuration={5000}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackOpen(false)}
          severity={snackSeverity}
          variant="filled"
          sx={{ width: "100%", fontSize: "1.05rem", py: 1.5, px: 3, fontWeight: 700 }}
        >
          {snackMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
*/