import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog.tsx";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import { supabase } from "@/integrations/supabase/client.ts";
import { useToast } from "@/components/ui/use-toast.ts";
import { 
  Clock, 
  Mail, 
  Play, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Calendar,
  Settings,
  RefreshCw,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";

interface EmailLog {
  id: number;
  trigger_source: string;
  triggered_at: string;
  status: string;
  emails_sent: number;
  emails_skipped: number;
  message: string;
  activity_status: string;
}

interface ScheduledJob {
  jobname: string;
  schedule: string;
  active: boolean;
  jobid: number;
}

export const EmailScheduleManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [isSendingWelcomeEmails, setIsSendingWelcomeEmails] = useState(false);
  const [time, setTime] = useState<string>("16:30");
  const [timezone, setTimezone] = useState<string>("America/New_York");
  const [enabled, setEnabled] = useState<boolean>(true);

  // Fetch email logs
  const { data: emailLogs, isLoading: logsLoading } = useQuery({
    queryKey: ["email-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recent_email_activity")
        .select("*")
        .order("triggered_at", { ascending: false });
      
      if (error) throw error;
      return data as EmailLog[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch scheduled jobs status
  const { data: scheduledJobs, isLoading: jobsLoading } = useQuery({
    queryKey: ["scheduled-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scheduled_jobs_status")
        .select("*");
      
      if (error) {
        console.error("Error fetching scheduled jobs:", error);
        return [];
      }
      return data as ScheduledJob[];
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch current schedule settings
  useQuery({
    queryKey: ["email-schedule-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", ["email_schedule_time", "email_timezone", "email_schedule_enabled"]);
      if (error) throw error;
      const map = Object.fromEntries((data || []).map((r: { key: string; value: string }) => [r.key, r.value]));
      if (map.email_schedule_time) setTime(map.email_schedule_time);
      if (map.email_timezone) setTimezone(map.email_timezone);
      if (map.email_schedule_enabled) setEnabled(map.email_schedule_enabled === "true");
      return map;
    },
  });

  const saveScheduleMutation = useMutation({
    mutationFn: async (payload: { enabled: boolean; time: string; timezone: string }) => {
      const { error } = await supabase.rpc("set_email_schedule", {
        p_enabled: payload.enabled,
        p_time: payload.time,
        p_timezone: payload.timezone,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Schedule updated", description: "Daily email time saved and rescheduled." });
      queryClient.invalidateQueries({ queryKey: ["scheduled-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["email-schedule-settings"] });
    },
    onError: (e: Error) => {
      toast({ title: "Save failed", description: e.message || "Unable to save", variant: "destructive" });
    },
  });

  // Test email function
  const testEmailMutation = useMutation({
    mutationFn: async () => {
      setIsTestingEmail(true);
      
      const { data, error } = await supabase.functions.invoke('daily-progress-email', {
        headers: { 'Content-Type': 'application/json' },
        body: { 
          source: 'manual_test',
          timestamp: new Date().toISOString()
        }
      });

      if (error) {
        const msg = (error as unknown as { message?: string })?.message || '';
        // Workaround: sometimes a 2xx with non-standard body triggers a client error
        if (/2xx/i.test(msg) && data) return data as Record<string, unknown>;
        // Try to parse body from error context when available
        const ctxBody = (error as unknown as { context?: { body?: string } })?.context?.body;
        if (ctxBody) {
          try { return JSON.parse(ctxBody) as Record<string, unknown>; } catch {/* ignore parse error */}
        }
        throw error;
      }
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Test Email Completed",
        description: `Successfully sent ${data.emailsSent || 0} emails. Skipped ${data.emailsSkipped || 0}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["email-logs"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Test Email Failed",
        description: error.message || "Failed to send test emails",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsTestingEmail(false);
    }
  });

  // Send welcome emails to all parents
  const sendWelcomeEmailsMutation = useMutation({
    mutationFn: async () => {
      setIsSendingWelcomeEmails(true);
      
      const { data, error } = await supabase.functions.invoke('send-parent-welcome-emails', {
        headers: { 'Content-Type': 'application/json' },
        body: {}
      });

      if (error) {
        const msg = (error as unknown as { message?: string })?.message || '';
        // Workaround: sometimes a 2xx with non-standard body triggers a client error
        if (/2xx/i.test(msg) && data) return data as Record<string, unknown>;
        // Try to parse body from error context when available
        const ctxBody = (error as unknown as { context?: { body?: string } })?.context?.body;
        if (ctxBody) {
          try { return JSON.parse(ctxBody) as Record<string, unknown>; } catch {/* ignore parse error */}
        }
        throw error;
      }
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Welcome Emails Sent",
        description: `Successfully sent ${data.emailsSent || 0} welcome emails to parents. Skipped ${data.emailsSkipped || 0}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["email-logs"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Welcome Emails Failed",
        description: error.message || "Failed to send welcome emails",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSendingWelcomeEmails(false);
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'no_data':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string, triggerSource: string) => {
    const variant = status === 'success' ? 'default' : 
                   status === 'error' ? 'destructive' : 'secondary';
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {getStatusIcon(status)}
        {triggerSource}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Email Schedule Manager</h2>
          <p className="text-gray-600">Manage automatic daily email reports and test the system</p>
        </div>
        <Button
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ["email-logs"] });
            queryClient.invalidateQueries({ queryKey: ["scheduled-jobs"] });
          }}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Configure Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Daily Email Time
          </CardTitle>
          <CardDescription>Choose the local time and timezone for sending progress emails daily.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="email-time">Time (HH:MM)</Label>
              <Input id="email-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-tz">Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger id="email-tz"><SelectValue placeholder="Select timezone" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">America/New_York</SelectItem>
                  <SelectItem value="America/Chicago">America/Chicago</SelectItem>
                  <SelectItem value="America/Denver">America/Denver</SelectItem>
                  <SelectItem value="America/Los_Angeles">America/Los_Angeles</SelectItem>
                  <SelectItem value="Europe/London">Europe/London</SelectItem>
                  <SelectItem value="Asia/Karachi">Asia/Karachi</SelectItem>
                  <SelectItem value="Asia/Dubai">Asia/Dubai</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant={enabled ? "default" : "secondary"} onClick={() => setEnabled((v) => !v)} className="w-32">
                {enabled ? "Enabled" : "Disabled"}
              </Button>
              <Button onClick={() => saveScheduleMutation.mutate({ enabled, time, timezone })}>
                Save
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Status
          </CardTitle>
          <CardDescription>
            Current status of automated email scheduling (4:30 PM daily)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {jobsLoading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading schedule status...</span>
            </div>
          ) : scheduledJobs && scheduledJobs.length > 0 ? (
            <div className="space-y-4">
              {scheduledJobs.map((job) => (
                <div key={job.jobid} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">{job.jobname}</h4>
                    <p className="text-sm text-gray-600">Schedule: {job.schedule} (UTC)</p>
                    <p className="text-sm text-gray-600">Job ID: {job.jobid}</p>
                  </div>
                  <Badge variant={job.active ? "default" : "destructive"}>
                    {job.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-4 text-gray-500">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>No scheduled jobs found. Run the migration to set up scheduling.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Test Email System
          </CardTitle>
          <CardDescription>
            Send a test email to verify the system is working correctly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={isTestingEmail} className="w-full sm:w-auto">
                {isTestingEmail ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending Test Emails...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Run Test Email
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Run Test Email</AlertDialogTitle>
                <AlertDialogDescription>
                  This will send progress report emails to all guardians with students who have 
                  progress data from the last 24 hours. This action will actually send real emails.
                  <br /><br />
                  <strong>Are you sure you want to proceed?</strong>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => testEmailMutation.mutate()}>
                  Yes, Send Test Emails
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Send Welcome Emails */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Welcome Emails to All Parents
          </CardTitle>
          <CardDescription>
            Send welcome emails with login credentials to all parents who have accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={isSendingWelcomeEmails} variant="outline" className="w-full sm:w-auto">
                {isSendingWelcomeEmails ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending Welcome Emails...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Welcome Emails
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Send Welcome Emails to All Parents</AlertDialogTitle>
                <AlertDialogDescription>
                  This will send welcome emails with login credentials and app link to all parents 
                  who have accounts in the system. This action will actually send real emails.
                  <br /><br />
                  <strong>Are you sure you want to proceed?</strong>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => sendWelcomeEmailsMutation.mutate()}>
                  Yes, Send Welcome Emails
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Email Activity Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Recent Email Activity
          </CardTitle>
          <CardDescription>
            Last 50 email sending events (manual and automatic)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading email logs...</span>
            </div>
          ) : emailLogs && emailLogs.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Emails Sent</TableHead>
                    <TableHead>Emails Skipped</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emailLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(log.triggered_at), 'MMM dd, yyyy HH:mm:ss')}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(log.activity_status, log.trigger_source)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={log.status === 'completed' ? 'default' : 
                                      log.status === 'error' ? 'destructive' : 'secondary'}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {log.emails_sent || 0}
                      </TableCell>
                      <TableCell className="text-center">
                        {log.emails_skipped || 0}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                        {log.message || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center p-8 text-gray-500">
              <Mail className="h-8 w-8 mx-auto mb-2" />
              <p>No email activity recorded yet.</p>
              <p className="text-sm">Run a test email to see activity here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 