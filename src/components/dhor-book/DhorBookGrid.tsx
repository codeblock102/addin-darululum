import { useState } from "react";
import { DailyActivityEntry, JuzRevisionEntry } from "@/types/dhor-book.ts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import { Button } from "@/components/ui/button.tsx";
import { NewEntryDialog } from "./NewEntryDialog.tsx";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

interface DhorBookGridProps {
  entries: DailyActivityEntry[];
  studentId: string;
  teacherId: string | undefined;
  currentWeek?: Date;
  currentMonth?: Date;
  viewMode: "weekly" | "monthly";
  onRefresh: () => void;
  readOnly?: boolean;
}

export function DhorBookGrid(
  { entries, studentId, teacherId, currentWeek, currentMonth, viewMode, onRefresh, readOnly = false }: DhorBookGridProps,
) {
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);

  // Generate days based on view mode
  const getDaysToShow = () => {
    if (viewMode === "weekly" && currentWeek) {
      return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(currentWeek);
        date.setDate(date.getDate() - date.getDay() + i);
        return date;
      });
    } else if (viewMode === "monthly" && currentMonth) {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      return eachDayOfInterval({ start: monthStart, end: monthEnd });
    }
    return [];
  };

  const daysToShow = getDaysToShow();

  // Determine if Nazirah/Qaida columns should be shown based on data presence
  const showNazirahCol = entries.some((e) => e.nazirah_entries && e.nazirah_entries.length > 0);
  const showQaidaCol = entries.some((e) => e.qaida_entries && e.qaida_entries.length > 0);
  const totalColumns = 7 + (showNazirahCol ? 1 : 0) + (showQaidaCol ? 1 : 0); // base 7: Date,Sabaq,SabaqPara,Dhor1,Dhor2,Quality,Notes

  const handleEntrySuccess = () => {
    setIsNewEntryOpen(false);
    console.log("Entry success - triggering refresh in DhorBookGrid");
    onRefresh(); // Simplified refresh, DhorBook.tsx handles staggered if needed
  };

  console.log("Entries received in DhorBookGrid:", entries);

  // Determine if weekly view has any data at all; if not, show compact empty state on mobile
  const isWeekly = viewMode === "weekly";
  const weeklyHasAnyData = isWeekly && daysToShow.some((date) => {
    const dateString = format(date, "yyyy-MM-dd");
    const entry = entries.find((e) => e.entry_date === dateString);
    if (!entry) return false;
    const hasProgress = Boolean(entry.current_juz && entry.current_surah && entry.start_ayat && entry.end_ayat);
    const hasSabaq = Boolean(entry.sabaq_para_data);
    const hasRevisions = Boolean(entry.juz_revisions_data && entry.juz_revisions_data.length > 0);
    const hasNazirah = Boolean(entry.nazirah_entries && entry.nazirah_entries.length > 0);
    const hasQaida = Boolean(entry.qaida_entries && entry.qaida_entries.length > 0);
    const hasQualityOrNotes = Boolean(entry.memorization_quality || entry.comments);
    return hasProgress || hasSabaq || hasRevisions || hasNazirah || hasQaida || hasQualityOrNotes;
  });

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">
          {viewMode === "weekly" ? "Weekly Records" : "Monthly Records"}
        </h3>
        {!readOnly && (
          <Button onClick={() => setIsNewEntryOpen(true)}>Add Entry</Button>
        )}
      </div>

      {isWeekly && !weeklyHasAnyData ? (
        <div className="rounded-md border p-3 text-sm text-muted-foreground">
          No records for this week.
        </div>
      ) : (
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Sabaq</TableHead>
              <TableHead className="hidden sm:table-cell">Sabaq Para</TableHead>
              {showNazirahCol && (
                <TableHead className="hidden sm:table-cell">Nazirah</TableHead>
              )}
              {showQaidaCol && (
                <TableHead className="hidden sm:table-cell">Qaida</TableHead>
              )}
              <TableHead>Dhor 1</TableHead>
              <TableHead className="hidden md:table-cell">Dhor 2</TableHead>
              <TableHead className="hidden md:table-cell">Quality</TableHead>
              <TableHead className="hidden lg:table-cell">Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {viewMode === "weekly" ? (
              // Weekly view - show all 7 days
              daysToShow.map((date) => {
                const dateString = format(date, "yyyy-MM-dd");
                const entry = entries.find((e) => e.entry_date === dateString);

                const dhor1Entry = entry?.juz_revisions_data?.find((
                  jr: JuzRevisionEntry,
                ) => jr.dhor_slot === 1);
                const dhor2Entry = entry?.juz_revisions_data?.find((
                  jr: JuzRevisionEntry,
                ) => jr.dhor_slot === 2);

                return (
                  <TableRow key={date.toISOString()}>
                    <TableCell className="font-medium">
                      {format(date, "E, MMM d")}
                    </TableCell>
                    <TableCell>
                      {entry?.current_juz && entry.current_surah &&
                          entry.start_ayat && entry.end_ayat
                        ? `J${entry.current_juz} S${entry.current_surah}:${entry.start_ayat}-${entry.end_ayat}`
                        : "—"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {entry?.sabaq_para_data
                        ? `J${entry.sabaq_para_data.juz_number}` +
                          `${entry.sabaq_para_data.sabaq_para_pages ? ", " + entry.sabaq_para_data.sabaq_para_pages + "p" : ""}` +
                          `${entry.sabaq_para_data.quarters_revised ? ", " + entry.sabaq_para_data.quarters_revised.replace("_", "").replace("quarters", "q").replace("1st", "1").replace("2", "2").replace("3", "3").replace("4", "4") : ""}` +
                          `${entry.sabaq_para_data.quality_rating ? ", Q " + entry.sabaq_para_data.quality_rating : ""}`
                        : "—"}
                    </TableCell>
                    {showNazirahCol && (
                      <TableCell className="hidden sm:table-cell">
                        {entry?.nazirah_entries && entry.nazirah_entries.length > 0
                          ? entry.nazirah_entries
                              .map((n) => `J${n.juz ?? "?"} S${n.surah ?? "?"}:${n.start_ayat ?? "?"}-${n.end_ayat ?? "?"}${n.quality ? ` (Q: ${n.quality})` : ""}`)
                              .join("; ")
                          : "—"}
                      </TableCell>
                    )}
                    {showQaidaCol && (
                      <TableCell className="hidden sm:table-cell">
                        {entry?.qaida_entries && entry.qaida_entries.length > 0
                          ? entry.qaida_entries
                              .map((q) => {
                                const raw = (q.lesson || "").trim();
                                const hasLessonWord = /^lesson\b/i.test(raw);
                                const numericOnly = /^\d+$/.test(raw);
                                const startsNum = raw.match(/^(\d+)(.*)$/);
                                let display: string;
                                if (hasLessonWord) display = raw;
                                else if (numericOnly) display = `Lesson ${raw}`;
                                else if (startsNum) display = `Lesson ${startsNum[1]}${startsNum[2]}`;
                                else display = raw || "Lesson";
                                return `${display}${q.quality ? ` (Q: ${q.quality})` : ""}`;
                              })
                              .join("; ")
                          : "—"}
                      </TableCell>
                    )}
                    {/* Dhor 1 Cell */}
                    <TableCell>
                      {dhor1Entry
                        ? `${
                          dhor1Entry.juz_number
                            ? `J${dhor1Entry.juz_number}`
                            : (dhor1Entry.juz_revised
                              ? `J${dhor1Entry.juz_revised}`
                              : "N/A")
                        } ` +
                          `${
                            dhor1Entry.quarter_start
                              ? `(Qtr ${dhor1Entry.quarter_start}`
                              : ""
                          }` +
                          `${
                            dhor1Entry.quarters_covered
                              ? `, ${dhor1Entry.quarters_covered}c`
                              : ""
                          }` +
                          `${dhor1Entry.quarter_start ? ")" : ""} ` +
                          `Q: ${dhor1Entry.memorization_quality || "N/A"}`
                        : "—"}
                    </TableCell>
                    {/* Dhor 2 Cell */}
                    <TableCell className="hidden md:table-cell">
                      {dhor2Entry
                        ? `${
                          dhor2Entry.juz_number
                            ? `J${dhor2Entry.juz_number}`
                            : (dhor2Entry.juz_revised
                              ? `J${dhor2Entry.juz_revised}`
                              : "N/A")
                        } ` +
                          `${
                            dhor2Entry.quarter_start
                              ? `(Qtr ${dhor2Entry.quarter_start}`
                              : ""
                          }` +
                          `${
                            dhor2Entry.quarters_covered
                              ? `, ${dhor2Entry.quarters_covered}c`
                              : ""
                          }` +
                          `${dhor2Entry.quarter_start ? ")" : ""} ` +
                          `Q: ${dhor2Entry.memorization_quality || "N/A"}`
                        : "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {entry?.memorization_quality || "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{entry?.comments || "—"}</TableCell>
                  </TableRow>
                );
              })
            ) : (
              // Monthly view - show only days with entries
              entries.length > 0 ? (
                entries.map((entry) => {
                  const entryDate = new Date(entry.entry_date);
                  const dhor1Entry = entry?.juz_revisions_data?.find((
                    jr: JuzRevisionEntry,
                  ) => jr.dhor_slot === 1);
                  const dhor2Entry = entry?.juz_revisions_data?.find((
                    jr: JuzRevisionEntry,
                  ) => jr.dhor_slot === 2);

                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {format(entryDate, "E, MMM d")}
                      </TableCell>
                      <TableCell className="hidden xs:table-cell">
                        {entry?.current_juz && entry.current_surah &&
                            entry.start_ayat && entry.end_ayat
                          ? `J${entry.current_juz} S${entry.current_surah}:${entry.start_ayat}-${entry.end_ayat}`
                          : "—"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {entry?.sabaq_para_data
                          ? `J${entry.sabaq_para_data.juz_number}` +
                            `${entry.sabaq_para_data.sabaq_para_pages ? ", " + entry.sabaq_para_data.sabaq_para_pages + "p" : ""}` +
                            `${entry.sabaq_para_data.quarters_revised ? ", " + entry.sabaq_para_data.quarters_revised.replace("_", "").replace("quarters", "q").replace("1st", "1").replace("2", "2").replace("3", "3").replace("4", "4") : ""}` +
                            `${entry.sabaq_para_data.quality_rating ? ", Q " + entry.sabaq_para_data.quality_rating : ""}`
                          : "—"}
                      </TableCell>
                      {showNazirahCol && (
                        <TableCell className="hidden sm:table-cell">
                          {entry?.nazirah_entries && entry.nazirah_entries.length > 0
                            ? entry.nazirah_entries
                                .map((n) => `J${n.juz ?? "?"} S${n.surah ?? "?"}:${n.start_ayat ?? "?"}-${n.end_ayat ?? "?"}${n.quality ? ` (Q: ${n.quality})` : ""}`)
                                .join("; ")
                            : "—"}
                        </TableCell>
                      )}
                      {showQaidaCol && (
                        <TableCell className="hidden sm:table-cell">
                          {entry?.qaida_entries && entry.qaida_entries.length > 0
                            ? entry.qaida_entries
                                .map((q) => {
                                  const raw = (q.lesson || "").trim();
                                  const hasLessonWord = /^lesson\b/i.test(raw);
                                  const numericOnly = /^\d+$/.test(raw);
                                  const startsNum = raw.match(/^(\d+)(.*)$/);
                                  let display: string;
                                  if (hasLessonWord) display = raw;
                                  else if (numericOnly) display = `Lesson ${raw}`;
                                  else if (startsNum) display = `Lesson ${startsNum[1]}${startsNum[2]}`;
                                  else display = raw || "Lesson";
                                  return `${display}${q.quality ? ` (Q: ${q.quality})` : ""}`;
                                })
                                .join("; ")
                            : "—"}
                        </TableCell>
                      )}
                      {/* Dhor 1 Cell */}
                      <TableCell>
                        {dhor1Entry
                          ? `${
                            dhor1Entry.juz_number
                              ? `J${dhor1Entry.juz_number}`
                              : (dhor1Entry.juz_revised
                                ? `J${dhor1Entry.juz_revised}`
                                : "N/A")
                          } ` +
                            `${
                              dhor1Entry.quarter_start
                                ? `(Qtr ${dhor1Entry.quarter_start}`
                                : ""
                            }` +
                            `${
                              dhor1Entry.quarters_covered
                                ? `, ${dhor1Entry.quarters_covered}c`
                                : ""
                            }` +
                            `${dhor1Entry.quarter_start ? ")" : ""} ` +
                            `Q: ${dhor1Entry.memorization_quality || "N/A"}`
                          : "—"}
                      </TableCell>
                      {/* Dhor 2 Cell */}
                      <TableCell className="hidden md:table-cell">
                        {dhor2Entry
                          ? `${
                            dhor2Entry.juz_number
                              ? `J${dhor2Entry.juz_number}`
                              : (dhor2Entry.juz_revised
                                ? `J${dhor2Entry.juz_revised}`
                                : "N/A")
                          } ` +
                            `${
                              dhor2Entry.quarter_start
                                ? `(Qtr ${dhor2Entry.quarter_start}`
                                : ""
                            }` +
                            `${
                              dhor2Entry.quarters_covered
                                ? `, ${dhor2Entry.quarters_covered}c`
                                : ""
                            }` +
                            `${dhor2Entry.quarter_start ? ")" : ""} ` +
                            `Q: ${dhor2Entry.memorization_quality || "N/A"}`
                          : "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {entry?.memorization_quality || "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{entry?.comments || "—"}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={totalColumns} className="text-center text-muted-foreground py-8">
                    No entries found for this month
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      </div>
      )}

      {!readOnly && (
        <NewEntryDialog
          open={isNewEntryOpen}
          onOpenChange={setIsNewEntryOpen}
          studentId={studentId}
          teacherId={teacherId ?? "system-unknown"}
          onSuccess={handleEntrySuccess}
        />
      )}
    </div>
  );
}
