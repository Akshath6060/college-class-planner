import { useMemo, useState } from 'react';
import { Subject, Teacher, TimetableSlot, TimetableConfig, DAYS, Conflict } from '@/types/timetable';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface TimetableGridProps {
  slots: TimetableSlot[];
  subjects: Subject[];
  teachers: Teacher[];
  config: TimetableConfig;
  conflicts: Conflict[];
  onSlotClick: (slot: TimetableSlot) => void;
  onSlotDrop: (slotId: string, subjectId: string | null) => void;
  selectedSubjectId: string | null;
}

export function TimetableGrid({
  slots,
  subjects,
  teachers,
  config,
  conflicts,
  onSlotClick,
  onSlotDrop,
  selectedSubjectId,
}: TimetableGridProps) {
  const [draggedSubjectId, setDraggedSubjectId] = useState<string | null>(null);

  const getTimeForPeriod = (period: number) => {
    const [hours, minutes] = config.startTime.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes;

    for (let i = 0; i < period; i++) {
      totalMinutes += config.periodDuration;
      if (i === config.lunchBreakPeriod - 1) {
        totalMinutes += 30; // lunch break duration
      }
    }

    const startHour = Math.floor(totalMinutes / 60);
    const startMin = totalMinutes % 60;
    const endMinutes = totalMinutes + config.periodDuration;
    const endHour = Math.floor(endMinutes / 60);
    const endMin = endMinutes % 60;

    return `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')} - ${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
  };

  const conflictSlotIds = useMemo(() => {
    return new Set(conflicts.flatMap((c) => c.slots));
  }, [conflicts]);

  const handleDragStart = (e: React.DragEvent, subjectId: string) => {
    setDraggedSubjectId(subjectId);
    e.dataTransfer.setData('subjectId', subjectId);
  };

  const handleDrop = (e: React.DragEvent, slotId: string) => {
    e.preventDefault();
    const subjectId = e.dataTransfer.getData('subjectId');
    onSlotDrop(slotId, subjectId || null);
    setDraggedSubjectId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border border-border p-2 bg-muted w-24">Time</th>
            {DAYS.map((day) => (
              <th key={day} className="border border-border p-2 bg-muted font-medium">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: config.periodsPerDay }, (_, periodIndex) => (
            <>
              <tr key={periodIndex}>
                <td className="border border-border p-2 text-center text-xs text-muted-foreground bg-muted/50">
                  <div className="font-medium">P{periodIndex + 1}</div>
                  <div>{getTimeForPeriod(periodIndex)}</div>
                </td>
                {DAYS.map((_, dayIndex) => {
                  const slot = slots.find((s) => s.day === dayIndex && s.period === periodIndex);
                  if (!slot) return <td key={dayIndex} className="border border-border p-2" />;

                  const subject = slot.subjectId ? subjects.find((s) => s.id === slot.subjectId) : null;
                  const teacher = subject ? teachers.find((t) => t.id === subject.teacherId) : null;
                  const hasConflict = conflictSlotIds.has(slot.id);

                  return (
                    <td
                      key={dayIndex}
                      className={cn(
                        'border border-border p-1 h-16 cursor-pointer transition-all relative',
                        hasConflict && 'ring-2 ring-destructive',
                        !subject && 'hover:bg-accent/50',
                        selectedSubjectId && !subject && 'bg-accent/30'
                      )}
                      style={subject ? { backgroundColor: subject.color } : undefined}
                      onClick={() => onSlotClick(slot)}
                      onDrop={(e) => handleDrop(e, slot.id)}
                      onDragOver={handleDragOver}
                    >
                      {subject && (
                        <div
                          draggable
                          onDragStart={(e) => handleDragStart(e, subject.id)}
                          className="h-full flex flex-col justify-center items-center text-center"
                        >
                          <div className="font-medium text-foreground text-xs leading-tight">{subject.name}</div>
                          <div className="text-[10px] text-muted-foreground">{teacher?.name}</div>
                          {subject.isLab && (
                            <div className="text-[10px] font-medium text-primary">LAB</div>
                          )}
                        </div>
                      )}
                      {hasConflict && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="absolute top-1 right-1">
                              <AlertTriangle className="w-4 h-4 text-destructive" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {conflicts.find((c) => c.slots.includes(slot.id))?.message}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </td>
                  );
                })}
              </tr>
              {periodIndex === config.lunchBreakPeriod - 1 && (
                <tr key="lunch">
                  <td
                    colSpan={6}
                    className="border border-border p-2 text-center bg-muted/70 text-muted-foreground font-medium"
                  >
                    🍴 Lunch Break (30 min)
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
