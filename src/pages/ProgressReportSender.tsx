import React, { useState, useMemo } from 'react';
import { useStudentProgressReportData } from '@/hooks/useStudentProgressReportData';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { CalendarIcon, Mail, Send, Loader2, AlertCircle, Users, Trash2 } from 'lucide-react';
import { StudentProgressReportData } from '@/types/reports';
import { supabase } from '@/integrations/supabase/client'; // Import Supabase client

const ProgressReportSender: React.FC = () => {
  const [reportDate, setReportDate] = useState<Date | undefined>(new Date());
  const { toast } = useToast();
  const { data: reportData, isLoading, error } = useStudentProgressReportData(reportDate);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [isSending, setIsSending] = useState(false); // State to track sending status

  const eligibleStudents = useMemo(() => {
    return reportData?.filter(student => student.guardian_email) || [];
  }, [reportData]);

  const callSendEmailFunction = async (student: StudentProgressReportData) => {
    if (!student.guardian_email) {
      toast({
        title: "Missing Email",
        description: `Guardian email for ${student.student_name} is not available. Cannot send report.`,
        variant: "destructive",
      });
      return false;
    }

    setIsSending(true);
    try {
      const { data, error: funcError } = await supabase.functions.invoke('send-progress-report', {
        body: { 
          reportData: student, 
          recipientEmail: student.guardian_email 
        },
      });

      if (funcError) {
        console.error('Supabase function error:', funcError);
        toast({
          title: "Function Error",
          description: funcError.message || "Failed to invoke email sending function.",
          variant: "destructive",
        });
        return false;
      }
      
      console.log('Supabase function success:', data);
      toast({
        title: "Report Sent (Actual)",
        description: `Progress report for ${student.student_name} sent to ${student.guardian_email}.`,
      });
      return true;
    } catch (e: any) {
      console.error('Error calling Supabase function:', e);
      toast({
        title: "Invocation Error",
        description: e.message || "An unexpected error occurred while trying to send the email.",
        variant: "destructive",
      });
      return false;
    } finally {
      // setIsSending(false); // Managed per batch or overall action
    }
  };

  const handleSendReport = async (student: StudentProgressReportData) => {
    await callSendEmailFunction(student);
  };

  const handleSendSelectedReports = async () => {
    const selectedStudentsData = reportData?.filter(student => 
      selectedStudentIds.has(student.student_id) && student.guardian_email
    );
    
    if (!selectedStudentsData || selectedStudentsData.length === 0) {
      toast({
        title: "No Valid Selection",
        description: "Please select students with available guardian emails.",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);
    let successCount = 0;
    for (const student of selectedStudentsData) {
      if (await callSendEmailFunction(student)) {
        successCount++;
      }
    }
    setIsSending(false);

    if (successCount > 0) {
        toast({
            title: `${successCount} Report(s) Sent`,
            description: `Successfully sent reports for ${successCount} of ${selectedStudentsData.length} selected students.`,
        });
    }
    if (successCount < selectedStudentsData.length && successCount > 0) {
        toast({
            title: "Some Reports Failed",
            description: `${selectedStudentsData.length - successCount} report(s) could not be sent. Check console for errors.`,
            variant: "destructive"
        })
    }
    if (successCount === 0 && selectedStudentsData.length > 0){
        // Individual errors already toasted by callSendEmailFunction or general error if no emails
         toast({
            title: "All Selected Reports Failed",
            description: "None of the selected reports could be sent. Please check individual errors or configurations.",
            variant: "destructive"
        });
    }
  };

  const handleSendAllReports = async () => {
    if (eligibleStudents.length === 0) {
      toast({
        title: "No Eligible Students",
        description: "No students have guardian emails for sending reports.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    let successCount = 0;
    for (const student of eligibleStudents) {
      if (await callSendEmailFunction(student)) {
        successCount++;
      }
    }
    setIsSending(false);

    if (successCount > 0) {
        toast({
            title: `All ${successCount} Reports Sent`,
            description: `Successfully sent reports for all ${successCount} eligible students.`,
        });
    }
     if (successCount < eligibleStudents.length && successCount > 0) {
        toast({
            title: "Some Reports Failed",
            description: `${eligibleStudents.length - successCount} report(s) could not be sent. Check console for errors.`,
            variant: "destructive"
        })
    }
    if (successCount === 0 && eligibleStudents.length > 0){
         toast({
            title: "All Reports Failed",
            description: "None of the reports could be sent. Please check errors or configurations.",
            variant: "destructive"
        });
    }
  };

  const toggleSelectStudent = (studentId: string) => {
    setSelectedStudentIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedStudentIds.size === eligibleStudents.length && eligibleStudents.length > 0) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(eligibleStudents.map(s => s.student_id)));
    }
  };

  const isAllSelected = eligibleStudents.length > 0 && selectedStudentIds.size === eligibleStudents.length;

  const isSelectionMode = selectedStudentIds.size > 0;
  const sendButtonText = isSelectionMode 
    ? `Send Selected (${selectedStudentIds.size})` 
    : `Send All (${eligibleStudents.length})`;
  const sendButtonAction = isSelectionMode ? handleSendSelectedReports : handleSendAllReports;
  const isSendButtonDisabled = isLoading || isSending || (isSelectionMode ? selectedStudentIds.size === 0 : eligibleStudents.length === 0);

  return (
    <div className="container mx-auto p-4 animate-fadeIn space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
            Student Progress Report Center
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Dispatch daily academic updates to parents for {format(reportDate || new Date(), "PPP")}.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className="w-full sm:w-auto justify-start text-left font-normal"
                disabled={isSending}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {reportDate ? format(reportDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={reportDate}
                onSelect={setReportDate}
                initialFocus
                disabled={(date) => date > new Date() || date < new Date("2000-01-01") || isSending}
              />
            </PopoverContent>
          </Popover>
          <Button 
            onClick={sendButtonAction} 
            className="w-full sm:w-auto"
            disabled={isSendButtonDisabled || isSending}
          >
            {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isSelectionMode ? <Mail className="mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />)}
            {sendButtonText}
          </Button>
        </div>
      </header>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5 text-primary"/> 
              Students for {format(reportDate || new Date(), "PPP")}
            </CardTitle>
            {selectedStudentIds.size > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedStudentIds(new Set())} disabled={isSending}>
                    <Trash2 className="mr-1 h-4 w-4"/> Clear Selection
                </Button>
            )}
          </div>
          <CardDescription>
            Select students to send individual reports, or use the send button above to dispatch reports in bulk.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && !isSending && (
            <div className="flex items-center justify-center h-60">
              <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading student progress data...</p>
            </div>
          )}
          {isSending && (
             <div className="flex items-center justify-center h-60">
              <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Sending emails, please wait...</p>
            </div>
          )}
          {error && !isSending && (
            <div className="flex flex-col items-center justify-center h-60 text-destructive">
              <AlertCircle className="mr-2 h-8 w-8" />
              <p className="font-semibold">Error loading data: {error.message}</p>
              <p>Please try selecting a different date or refreshing the page.</p>
            </div>
          )}
          {!isLoading && !error && !isSending && reportData && (
            reportData.length === 0 ? (
                <div className="text-center text-muted-foreground py-10">
                    <Users className="mx-auto h-12 w-12 mb-3"/>
                    <p className="font-semibold">No student data available for this date.</p>
                    <p>Ensure progress and attendance have been recorded.</p>
                </div>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox 
                        checked={isAllSelected}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all eligible students"
                        disabled={eligibleStudents.length === 0 || isSending}
                    />
                  </TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Guardian Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.map((student) => {
                  const hasEmail = !!student.guardian_email;
                  return (
                    <TableRow 
                        key={student.student_id} 
                        data-state={selectedStudentIds.has(student.student_id) ? 'selected' : undefined}
                    >
                      <TableCell>
                        <Checkbox 
                            checked={selectedStudentIds.has(student.student_id)}
                            onCheckedChange={() => toggleSelectStudent(student.student_id)}
                            aria-label={`Select ${student.student_name}`}
                            disabled={!hasEmail || isSending}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{student.student_name}</TableCell>
                      <TableCell>{student.guardian_email || <span className="text-xs text-muted-foreground italic">Not set</span>}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendReport(student)}
                          disabled={!hasEmail || isSending}
                        >
                          {isSending && selectedStudentIds.has(student.student_id) ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Mail className="mr-2 h-4 w-4" />}
                          Send Report
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressReportSender; 