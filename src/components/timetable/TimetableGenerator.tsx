import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wand2, FileDown, Loader2, RotateCcw } from 'lucide-react';
import { TeacherForm } from './TeacherForm';
import { SubjectForm } from './SubjectForm';
import { ConfigForm } from './ConfigForm';
import { TimetableGrid } from './TimetableGrid';
import { SubjectPalette } from './SubjectPalette';
import { useTimetable } from '@/hooks/useTimetable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DAYS } from '@/types/timetable';

export function TimetableGenerator() {
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
        body: {
          teachers,
          subjects,
          config,
        },
      });

      if (error) throw error;

      if (data?.slots) {
        setTimetable(data.slots);
        toast.success('Timetable generated successfully!');
      }
    } catch (error) {
      console.error('Generation error:', error);
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
      // Build timetable data for PDF
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
        // Download PDF
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
      console.error('Export error:', error);
      toast.error('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    initializeSlots();
    toast.info('Timetable cleared');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">College Timetable Generator</h1>
          <p className="text-muted-foreground mt-1">
            Add teachers and subjects, then generate or manually create your schedule
          </p>
        </header>

        <div className="grid lg:grid-cols-[350px_1fr] gap-6">
          {/* Left sidebar - Input forms */}
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
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleReset} className="flex-1">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
                <Button variant="outline" onClick={handleExportPDF} disabled={isExporting} className="flex-1">
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <FileDown className="w-4 h-4 mr-2" />
                  )}
                  Export PDF
                </Button>
              </div>
            </div>
          </aside>

          {/* Main content - Timetable grid */}
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
    </div>
  );
}
