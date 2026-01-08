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
import { UniversityHeader } from '@/components/layout/UniversityHeader';
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
  const { user, loading: authLoading, signOut } = useAuth();
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

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleGenerate = async () => {
    if (subjects.length === 0) {
      toast.error('Please add at least one course');
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
        toast.success('Schedule generated successfully!');
      }
    } catch (error) {
      toast.error('Failed to generate schedule. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportPDF = async () => {
    if (slots.every((s) => !s.subjectId)) {
      toast.error('Please generate or create a schedule first');
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
        a.download = 'academic-schedule.pdf';
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
      toast.error('Please enter a name for your schedule');
      return;
    }

    if (slots.every((s) => !s.subjectId)) {
      toast.error('Please generate or create a schedule first');
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
      toast.error('Failed to save schedule');
    } else {
      toast.success('Schedule saved!');
      setSaveDialogOpen(false);
      navigate('/');
    }
  };

  const handleReset = () => {
    initializeSlots();
    toast.info('Schedule cleared');
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
      <UniversityHeader onSignOut={handleSignOut} />

      <div className="container mx-auto py-6 px-4">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Create Academic Schedule
            </h1>
            <p className="text-muted-foreground text-sm">
              Add faculty and courses, then generate or manually arrange your timetable
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[380px_1fr] gap-6">
          <aside className="space-y-4">
            <div className="bg-card rounded-lg border-2 p-4 space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Setup</h3>
              <TeacherForm teachers={teachers} onAddTeacher={addTeacher} onRemoveTeacher={removeTeacher} />
              <SubjectForm
                teachers={teachers}
                onAddSubject={addSubject}
                subjects={subjects}
                onRemoveSubject={removeSubject}
              />
              <ConfigForm config={config} onConfigChange={setConfig} />
            </div>

            <div className="bg-card rounded-lg border-2 p-4 space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Actions</h3>
              <Button onClick={handleGenerate} disabled={isGenerating || subjects.length === 0} className="w-full">
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Auto-Generate Schedule
                  </>
                )}
              </Button>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" onClick={handleReset} title="Reset">
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button variant="outline" onClick={handleExportPDF} disabled={isExporting} title="Export PDF">
                  {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                </Button>
                <Button onClick={() => setSaveDialogOpen(true)} disabled={slots.every((s) => !s.subjectId)} title="Save">
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </aside>

          <main className="space-y-4">
            {subjects.length > 0 && (
              <div className="bg-card rounded-lg border-2 p-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                  Course Palette
                </h3>
                <SubjectPalette
                  subjects={subjects}
                  teachers={teachers}
                  selectedSubjectId={selectedSubjectId}
                  onSelectSubject={setSelectedSubjectId}
                  subjectHours={subjectHours}
                />
              </div>
            )}

            {conflicts.length > 0 && (
              <div className="bg-destructive/10 border-2 border-destructive/30 rounded-lg p-4">
                <div className="font-semibold text-destructive mb-2">⚠️ Scheduling Conflicts</div>
                <ul className="space-y-1 text-sm text-destructive/80">
                  {conflicts.map((conflict, i) => (
                    <li key={i}>{conflict.message}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-card rounded-lg border-2 p-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                Weekly Schedule
              </h3>
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
            </div>
          </main>
        </div>
      </div>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Academic Schedule</DialogTitle>
            <DialogDescription>Enter a name for this schedule to save it to your account.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="timetable-name">Schedule Name</Label>
            <Input
              id="timetable-name"
              placeholder="e.g., Computer Science - Spring 2025"
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
                'Save Schedule'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
