import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TimetableConfig } from '@/types/timetable';

interface ConfigFormProps {
  config: TimetableConfig;
  onConfigChange: (config: TimetableConfig) => void;
}

export function ConfigForm({ config, onConfigChange }: ConfigFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Periods/Day</Label>
            <Select
              value={String(config.periodsPerDay)}
              onValueChange={(v) => onConfigChange({ ...config, periodsPerDay: Number(v) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[6, 7, 8, 9].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} periods
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Lunch Break After</Label>
            <Select
              value={String(config.lunchBreakPeriod)}
              onValueChange={(v) => onConfigChange({ ...config, lunchBreakPeriod: Number(v) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: config.periodsPerDay - 1 }, (_, i) => i + 1).map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    Period {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Start Time</Label>
            <Input
              type="time"
              value={config.startTime}
              onChange={(e) => onConfigChange({ ...config, startTime: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Period Duration (min)</Label>
            <Input
              type="number"
              min={30}
              max={90}
              value={config.periodDuration}
              onChange={(e) => onConfigChange({ ...config, periodDuration: Number(e.target.value) })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
