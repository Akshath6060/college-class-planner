import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X } from 'lucide-react';
import { Subject, Teacher, SUBJECT_COLORS } from '@/types/timetable';

interface SubjectFormProps {
  teachers: Teacher[];
  onAddSubject: (subject: Omit<Subject, 'id' | 'color'>) => void;
  subjects: Subject[];
  onRemoveSubject: (id: string) => void;
}

export function SubjectForm({ teachers, onAddSubject, subjects, onRemoveSubject }: SubjectFormProps) {
  const [name, setName] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [hoursPerWeek, setHoursPerWeek] = useState(3);
  const [isLab, setIsLab] = useState(false);
  const [labDuration, setLabDuration] = useState<2 | 3>(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !teacherId) return;

    onAddSubject({
      name,
      teacherId,
      hoursPerWeek,
      isLab,
      labDuration: isLab ? labDuration : 2,
    });

    setName('');
    setTeacherId('');
    setHoursPerWeek(3);
    setIsLab(false);
    setLabDuration(2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Subjects</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="subject-name">Subject Name</Label>
              <Input
                id="subject-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Mathematics"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacher">Teacher</Label>
              <Select value={teacherId} onValueChange={setTeacherId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="hours">Hours/Week</Label>
              <Input
                id="hours"
                type="number"
                min={1}
                max={10}
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(Number(e.target.value))}
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch id="is-lab" checked={isLab} onCheckedChange={setIsLab} />
              <Label htmlFor="is-lab">Lab Session</Label>
            </div>
          </div>

          {isLab && (
            <div className="space-y-2">
              <Label>Lab Duration (consecutive periods)</Label>
              <Select value={String(labDuration)} onValueChange={(v) => setLabDuration(Number(v) as 2 | 3)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 periods</SelectItem>
                  <SelectItem value="3">3 periods</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={!name || !teacherId || teachers.length === 0}>
            <Plus className="w-4 h-4 mr-2" />
            Add Subject
          </Button>
        </form>

        {subjects.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <Label className="text-muted-foreground">Added Subjects</Label>
            <div className="space-y-2">
              {subjects.map((subject) => {
                const teacher = teachers.find((t) => t.id === subject.teacherId);
                return (
                  <div
                    key={subject.id}
                    className="flex items-center justify-between p-2 rounded-md text-sm"
                    style={{ backgroundColor: subject.color }}
                  >
                    <div>
                      <span className="font-medium">{subject.name}</span>
                      <span className="text-muted-foreground ml-2">
                        ({teacher?.name} • {subject.hoursPerWeek}h{subject.isLab ? ` • Lab ${subject.labDuration}p` : ''})
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => onRemoveSubject(subject.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
