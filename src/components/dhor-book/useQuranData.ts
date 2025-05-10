
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface JuzData {
  id: number;  // Changed from string to number to match the database schema
  juz_number: number;
  surah_list: string;
}

export interface SurahData {
  id: string;
  surah_number: number;
  total_ayat: number;
  name: string;
}

export const useQuranData = () => {
  const [selectedJuz, setSelectedJuz] = useState<number | null>(null);
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [surahsInJuz, setSurahsInJuz] = useState<SurahData[]>([]);

  // Fetch all juz data
  const { data: juzData, isLoading: juzLoading } = useQuery({
    queryKey: ['quran-juz-data'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('juz')
        .select('id, juz_number, surah_list')
        .order('juz_number', { ascending: true });

      if (error) {
        console.error('Error fetching juz data:', error);
        return [] as JuzData[];
      }
      return data as unknown as JuzData[]; // Added explicit type casting
    },
  });

  // Fetch all surah data
  const { data: surahData, isLoading: surahLoading } = useQuery({
    queryKey: ['quran-surah-data'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('surah')
        .select('id, surah_number, total_ayat, name')
        .order('surah_number', { ascending: true });

      if (error) {
        console.error('Error fetching surah data:', error);
        return [] as SurahData[];
      }
      return data as SurahData[];
    },
  });

  // Update surahs in juz when selectedJuz changes
  useEffect(() => {
    if (selectedJuz && surahData && juzData) {
      // Find the juz in our data
      const juz = juzData.find(j => j.juz_number === selectedJuz);
      
      if (juz && juz.surah_list) {
        try {
          // Parse the surah list from the juz data
          // Expected format is something like "1-2,3,4-6" 
          const surahRanges = juz.surah_list.split(',');
          const surahNumbers: number[] = [];
          
          surahRanges.forEach(range => {
            if (range.includes('-')) {
              const [start, end] = range.split('-').map(Number);
              for (let i = start; i <= end; i++) {
                surahNumbers.push(i);
              }
            } else {
              surahNumbers.push(Number(range));
            }
          });
          
          // Filter the surah data to only include those in this juz
          const filtered = surahData.filter(surah => 
            surahNumbers.includes(surah.surah_number)
          );
          
          setSurahsInJuz(filtered);
          console.log("Surahs in selected juz:", filtered);
        } catch (error) {
          console.error('Error parsing surah list:', error);
          setSurahsInJuz([]);
        }
      } else {
        setSurahsInJuz([]);
      }
    } else {
      setSurahsInJuz([]);
    }
  }, [selectedJuz, surahData, juzData]);

  return {
    juzData,
    juzLoading,
    surahData,
    surahLoading,
    surahsInJuz,
    selectedJuz,
    setSelectedJuz,
    selectedSurah,
    setSelectedSurah,
  };
};
