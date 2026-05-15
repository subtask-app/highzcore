'use client';

// Wraps the YouTube embed + the survey form, sharing watch-seconds state
// between them. Lives as a small client island inside the server-rendered
// task page.

import { useState } from 'react';
import { YoutubeEmbed } from '@/components/insights/YoutubeEmbed';
import { StudyForm } from '@/components/insights/StudyForm';
import type { InsightQuestion } from '@/lib/supabase/types';

interface Props {
  taskId: string;
  videoId: string;
  videoSeconds: number;
  questions: InsightQuestion[];
}

export function InsightsStudyClient({ taskId, videoId, videoSeconds, questions }: Props) {
  const [watchSeconds, setWatchSeconds] = useState(0);
  return (
    <div className="space-y-8">
      <YoutubeEmbed
        videoId={videoId}
        onPlayingTick={setWatchSeconds}
      />
      <StudyForm
        taskId={taskId}
        questions={questions}
        videoSeconds={videoSeconds}
        watchSeconds={watchSeconds}
      />
    </div>
  );
}
