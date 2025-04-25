
import React from 'react';
import { Button } from '@/components/ui/button';
import { RevisionsListProps, JuzRevision } from '@/types/progress';
import { CalendarDays, Plus } from 'lucide-react';

export function RevisionsList({ studentId, revisions = [], studentName = '', onAddRevision }: RevisionsListProps) {
  if (!revisions || revisions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">No revision history found for this student.</p>
        {onAddRevision && (
          <Button onClick={onAddRevision} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Record New Revision
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-lg">Revision History for {studentName}</h3>
        {onAddRevision && (
          <Button onClick={onAddRevision} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Revision
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {revisions.map((revision: JuzRevision) => (
          <div key={revision.id} className="bg-muted/30 p-4 rounded-lg border">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-medium">Juz {revision.juz_revised}</h4>
                <div className="flex items-center text-sm text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5 mr-1" />
                  <span>{new Date(revision.revision_date).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                  revision.memorization_quality === 'excellent' ? 'bg-green-100 text-green-800' :
                  revision.memorization_quality === 'good' ? 'bg-blue-100 text-blue-800' :
                  revision.memorization_quality === 'average' ? 'bg-yellow-100 text-yellow-800' :
                  revision.memorization_quality === 'needsWork' ? 'bg-orange-100 text-orange-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {revision.memorization_quality && revision.memorization_quality.charAt(0).toUpperCase() + revision.memorization_quality.slice(1)}
                </span>
              </div>
            </div>
            {revision.teacher_notes && (
              <div className="mt-3 bg-white p-3 rounded border text-sm">
                <p className="text-xs font-medium mb-1">Teacher Notes:</p>
                <p className="text-muted-foreground">{revision.teacher_notes}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
