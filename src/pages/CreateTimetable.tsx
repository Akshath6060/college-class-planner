import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wand2, FileDown, Loader2, RotateCcw, Save, ArrowLeft } from 'lucide-react';
import { TeacherForm } from '@/components/timetable/TeacherForm';
import { SubjectForm } from '@/components/timetable/SubjectForm';
import { ConfigForm } from '@/components/timetable/ConfigForm';
import { TimetableGrid } from '@/components/timetable/TimetableGrid';
import { SubjectPalette } from '@/components/timetable/SubjectPalette';
import { useTimetable } from '@/hooks/useTimetable';
import { toast } from 'sonner';
import { DAYS } from '@/types/timetable';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function CreateTimetable() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const {
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
  } = useTimetable();

  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [timetableName, setTimetableName] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    initializeSlots();
  }, [initializeSlots]);

  const handleGenerate = async () => {
    if (subjects.length === 0) {
      toast.error('Please add at least one subject');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-timetable', {
        body: { teachers, subjects, config },
      });

      if (error) throw error;

      if (data?.slots) {
        setTimetable(data.slots);
        toast.success('Timetable generated successfully!');
      }
    } catch (error) {
      toast.error('Failed to generate timetable. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportPDF = async () => {
    if (slots.every((s) => !s.subjectId)) {
      toast.error('Please generate or create a timetable first');
      return;
    }

    setIsExporting(true);
    try {
      const timetableData = {
        config,
        days: DAYS,
        periods: Array.from({ length: config.periodsPerDay }, (_, i) => i + 1),
        slots: slots.map((slot) => {
          const subject = subjects.find((s) => s.id === slot.subjectId);
          const teacher = subject ? teachers.find((t) => t.id === subject.teacherId) : null;
          return {
            ...slot,
            subjectName: subject?.name || null,
            teacherName: teacher?.name || null,
            isLab: subject?.isLab || false,
            color: subject?.color || null,
          };
        }),
      };

      const { data, error } = await supabase.functions.invoke('export-timetable-pdf', {
        body: timetableData,
      });

      if (error) throw error;

      if (data?.pdf) {
        const byteCharacters = atob(data.pdf);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'timetable.pdf';
        a.click();
        URL.revokeObjectURL(url);
        toast.success('PDF exported successfully!');
      }
    } catch (error) {
      toast.error('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSave = async () => {
    if (!timetableName.trim()) {
      toast.error('Please enter a name for your timetable');
      return;
    }

    if (slots.every((s) => !s.subjectId)) {
      toast.error('Please generate or create a timetable first');
      return;
    }

    setIsSaving(true);
    const { error } = await supabase.from('timetables').insert([{
      user_id: user!.id,
      name: timetableName.trim(),
      teachers: teachers as unknown as Json,
      subjects: subjects as unknown as Json,
      slots: slots as unknown as Json,
      config: config as unknown as Json,
    }]);
    setIsSaving(false);

    if (error) {
      toast.error('Failed to save timetable');
    } else {
      toast.success('Timetable saved!');
      setSaveDialogOpen(false);
      navigate('/');
    }
  };

  const handleReset = () => {
    initializeSlots();
    toast.info('Timetable cleared');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4">
        <header className="mb-8 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Timetable</h1>
            <p className="text-muted-foreground mt-1">
              Add teachers and subjects, then generate or manually create your schedule
            </p>
          </div>
        </header>

        <div className="grid lg:grid-cols-[350px_1fr] gap-6">
          <aside className="space-y-4">
            <TeacherForm teachers={teachers} onAddTeacher={addTeacher} onRemoveTeacher={removeTeacher} />
            <SubjectForm
              teachers={teachers}
              onAddSubject={addSubject}
              subjects={subjects}
              onRemoveSubject={removeSubject}
            />
            <ConfigForm config={config} onConfigChange={setConfig} />

            <div className="flex flex-col gap-2">
              <Button onClick={handleGenerate} disabled={isGenerating || subjects.length === 0} className="w-full">
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Auto-Generate Timetable
                  </>
                )}
              </Button>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button variant="outline" onClick={handleExportPDF} disabled={isExporting}>
                  {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                </Button>
                <Button onClick={() => setSaveDialogOpen(true)} disabled={slots.every((s) => !s.subjectId)}>
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </aside>

          <main className="space-y-4">
            {subjects.length > 0 && (
              <SubjectPalette
                subjects={subjects}
                teachers={teachers}
                selectedSubjectId={selectedSubjectId}
                onSelectSubject={setSelectedSubjectId}
                subjectHours={subjectHours}
              />
            )}

            {conflicts.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm">
                <div className="font-medium text-destructive mb-1">⚠️ Conflicts Detected</div>
                <ul className="space-y-1 text-destructive/80">
                  {conflicts.map((conflict, i) => (
                    <li key={i}>{conflict.message}</li>
                  ))}
                </ul>
              </div>
            )}

            <TimetableGrid
              slots={slots}
              subjects={subjects}
              teachers={teachers}
              config={config}
              conflicts={conflicts}
              onSlotClick={handleSlotClick}
              onSlotDrop={updateSlot}
              selectedSubjectId={selectedSubjectId}
            />
          </main>
        </div>
      </div>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Timetable</DialogTitle>
            <DialogDescription>Give your timetable a name to save it for later.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="timetable-name">Name</Label>
            <Input
              id="timetable-name"
              placeholder="e.g., Spring 2025 Schedule"
              value={timetableName}
              onChange={(e) => setTimetableName(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
