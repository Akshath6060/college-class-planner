import { useState, useCallback, useMemo } from 'react';
import { Subject, Teacher, TimetableSlot, TimetableConfig, Conflict, SUBJECT_COLORS, DAYS } from '@/types/timetable';

const generateId = () => Math.random().toString(36).substring(2, 9);

export function useTimetable() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [config, setConfig] = useState<TimetableConfig>({
    periodsPerDay: 8,
    lunchBreakPeriod: 4,
    startTime: '09:00',
    periodDuration: 50,
  });
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  // Initialize empty slots when config changes
  const initializeSlots = useCallback(() => {
    const newSlots: TimetableSlot[] = [];
    for (let day = 0; day < DAYS.length; day++) {
      for (let period = 0; period < config.periodsPerDay; period++) {
        newSlots.push({
          id: `${day}-${period}`,
          subjectId: null,
          day,
          period,
          isLunchBreak: false,
        });
      }
    }
    setSlots(newSlots);
  }, [config.periodsPerDay]);

  // Add teacher
  const addTeacher = useCallback((name: string) => {
    setTeachers((prev) => [...prev, { id: generateId(), name }]);
  }, []);

  // Remove teacher
  const removeTeacher = useCallback((id: string) => {
    setTeachers((prev) => prev.filter((t) => t.id !== id));
    setSubjects((prev) => prev.filter((s) => s.teacherId !== id));
  }, []);

  // Add subject
  const addSubject = useCallback((subject: Omit<Subject, 'id' | 'color'>) => {
    const colorIndex = subjects.length % SUBJECT_COLORS.length;
    setSubjects((prev) => [
      ...prev,
      { ...subject, id: generateId(), color: SUBJECT_COLORS[colorIndex] },
    ]);
  }, [subjects.length]);

  // Remove subject
  const removeSubject = useCallback((id: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    setSlots((prev) => prev.map((slot) => (slot.subjectId === id ? { ...slot, subjectId: null } : slot)));
  }, []);

  // Update slot
  const updateSlot = useCallback((slotId: string, subjectId: string | null) => {
    setSlots((prev) => prev.map((slot) => (slot.id === slotId ? { ...slot, subjectId } : slot)));
  }, []);

  // Handle slot click (for manual placement)
  const handleSlotClick = useCallback(
    (slot: TimetableSlot) => {
      if (selectedSubjectId === null) {
        // Clear mode
        updateSlot(slot.id, null);
      } else if (slot.subjectId === null) {
        // Place subject
        updateSlot(slot.id, selectedSubjectId);
      } else if (slot.subjectId === selectedSubjectId) {
        // Remove if clicking same subject
        updateSlot(slot.id, null);
      }
    },
    [selectedSubjectId, updateSlot]
  );

  // Calculate subject hours placed
  const subjectHours = useMemo(() => {
    const hours: Record<string, number> = {};
    slots.forEach((slot) => {
      if (slot.subjectId) {
        hours[slot.subjectId] = (hours[slot.subjectId] || 0) + 1;
      }
    });
    return hours;
  }, [slots]);

  // Detect conflicts
  const conflicts = useMemo(() => {
    const conflictList: Conflict[] = [];

    // Teacher double-booking: same teacher in same period across slots
    for (let period = 0; period < config.periodsPerDay; period++) {
      const teacherSlots: Record<string, string[]> = {};

      slots
        .filter((s) => s.period === period && s.subjectId)
        .forEach((slot) => {
          const subject = subjects.find((s) => s.id === slot.subjectId);
          if (subject) {
            if (!teacherSlots[subject.teacherId]) {
              teacherSlots[subject.teacherId] = [];
            }
            teacherSlots[subject.teacherId].push(slot.id);
          }
        });

      Object.entries(teacherSlots).forEach(([teacherId, slotIds]) => {
        if (slotIds.length > 1) {
          const teacher = teachers.find((t) => t.id === teacherId);
          conflictList.push({
            type: 'teacher-double-booking',
            message: `${teacher?.name || 'Teacher'} is scheduled in multiple classes at the same time`,
            slots: slotIds,
          });
        }
      });
    }

    return conflictList;
  }, [slots, subjects, teachers, config.periodsPerDay]);

  // Set timetable from AI generation
  const setTimetable = useCallback((newSlots: TimetableSlot[]) => {
    setSlots(newSlots);
  }, []);

  return {
    teachers,
    subjects,
    slots,
    config,
    conflicts,
    selectedSubjectId,
    subjectHours,
    addTeacher,
    removeTeacher,
    addSubject,
    removeSubject,
    updateSlot,
    handleSlotClick,
    setSelectedSubjectId,
    setConfig,
    initializeSlots,
    setTimetable,
  };
}
