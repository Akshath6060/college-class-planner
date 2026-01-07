import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X } from 'lucide-react';
import { Teacher } from '@/types/timetable';

interface TeacherFormProps {
  teachers: Teacher[];
  onAddTeacher: (name: string) => void;
  onRemoveTeacher: (id: string) => void;
}

export function TeacherForm({ teachers, onAddTeacher, onRemoveTeacher }: TeacherFormProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddTeacher(name.trim());
    setName('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Teachers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Teacher name"
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!name.trim()}>
            <Plus className="w-4 h-4" />
          </Button>
        </form>

        {teachers.length > 0 && (
          <div className="space-y-2">
            <Label className="text-muted-foreground">Added Teachers</Label>
            <div className="flex flex-wrap gap-2">
              {teachers.map((teacher) => (
                <div
                  key={teacher.id}
                  className="flex items-center gap-1 px-3 py-1 bg-secondary rounded-full text-sm"
                >
                  <span>{teacher.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 hover:bg-destructive/20"
                    onClick={() => onRemoveTeacher(teacher.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
