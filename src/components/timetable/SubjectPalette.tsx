import { Subject, Teacher } from '@/types/timetable';
import { cn } from '@/lib/utils';

interface SubjectPaletteProps {
  subjects: Subject[];
  teachers: Teacher[];
  selectedSubjectId: string | null;
  onSelectSubject: (id: string | null) => void;
  subjectHours: Record<string, number>;
}

export function SubjectPalette({
  subjects,
  teachers,
  selectedSubjectId,
  onSelectSubject,
  subjectHours,
}: SubjectPaletteProps) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-muted-foreground">Click to select, then click on grid to place</div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onSelectSubject(null)}
          className={cn(
            'px-3 py-2 rounded-md text-sm border transition-all',
            selectedSubjectId === null
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/50'
          )}
        >
          🧹 Clear
        </button>
        {subjects.map((subject) => {
          const teacher = teachers.find((t) => t.id === subject.teacherId);
          const placed = subjectHours[subject.id] || 0;
          const remaining = subject.hoursPerWeek - placed;

          return (
            <button
              key={subject.id}
              onClick={() => onSelectSubject(subject.id)}
              className={cn(
                'px-3 py-2 rounded-md text-sm border transition-all',
                selectedSubjectId === subject.id
                  ? 'ring-2 ring-primary ring-offset-2'
                  : 'hover:ring-1 hover:ring-primary/50'
              )}
              style={{ backgroundColor: subject.color }}
            >
              <div className="font-medium">{subject.name}</div>
              <div className="text-[10px] text-muted-foreground">
                {teacher?.name} • {remaining > 0 ? `${remaining}h left` : '✓'}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
