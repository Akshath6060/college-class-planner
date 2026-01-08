import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { TimetableGrid } from '@/components/timetable/TimetableGrid';
import { ArrowLeft, FileDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Teacher, Subject, TimetableSlot, TimetableConfig, DAYS } from '@/types/timetable';
import { Json } from '@/integrations/supabase/types';

export default function ViewTimetable() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [timetable, setTimetable] = useState<{
    name: string;
    teachers: Teacher[];
    subjects: Subject[];
    slots: TimetableSlot[];
    config: TimetableConfig;
  } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (id && user) {
      fetchTimetable();
    }
  }, [id, user]);

  const fetchTimetable = async () => {
    const { data, error } = await supabase
      .from('timetables')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      toast.error('Failed to load timetable');
      navigate('/');
    } else if (data) {
      setTimetable({
        name: data.name,
        teachers: data.teachers as unknown as Teacher[],
        subjects: data.subjects as unknown as Subject[],
        slots: data.slots as unknown as TimetableSlot[],
        config: data.config as unknown as TimetableConfig,
      });
    }
    setIsLoading(false);
  };

  const handleExportPDF = async () => {
    if (!timetable) return;

    setIsExporting(true);
    try {
      const timetableData = {
        config: timetable.config,
        days: DAYS,
        periods: Array.from({ length: timetable.config.periodsPerDay }, (_, i) => i + 1),
        slots: timetable.slots.map((slot) => {
          const subject = timetable.subjects.find((s) => s.id === slot.subjectId);
          const teacher = subject ? timetable.teachers.find((t) => t.id === subject.teacherId) : null;
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
        a.download = `${timetable.name}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('PDF exported successfully!');
      }
    } catch (error) {
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!timetable) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold">{timetable.name}</h1>
          </div>
          <Button variant="outline" onClick={handleExportPDF} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4 mr-2" />
            )}
            Export PDF
          </Button>
        </div>

        <TimetableGrid
          slots={timetable.slots}
          subjects={timetable.subjects}
          teachers={timetable.teachers}
          config={timetable.config}
          conflicts={[]}
          onSlotClick={() => {}}
          onSlotDrop={() => {}}
          selectedSubjectId={null}
        />
      </div>
    </div>
  );
}
