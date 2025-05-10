
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface JuzData {
  id: number;  // Number to match the database schema
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
      // Log the fetch attempt
      console.log('Fetching juz data...');
      
      const { data, error } = await supabase
        .from('juz')
        .select('id, juz_number, surah_list')
        .order('juz_number', { ascending: true });

      if (error) {
        console.error('Error fetching juz data:', error);
        return [] as JuzData[];
      }
      
      console.log('Juz data received:', data);
      return data as unknown as JuzData[];
    },
  });

  // Fetch all surah data
  const { data: surahData, isLoading: surahLoading } = useQuery({
    queryKey: ['quran-surah-data'],
    queryFn: async () => {
      // Log the fetch attempt
      console.log('Fetching surah data...');
      
      const { data, error } = await supabase
        .from('surah')
        .select('id, surah_number, total_ayat, name')
        .order('surah_number', { ascending: true });

      if (error) {
        console.error('Error fetching surah data:', error);
        return [] as SurahData[];
      }
      
      console.log('Surah data received:', data);
      return data as SurahData[];
    },
  });

  // Update surahs in juz when selectedJuz changes
  useEffect(() => {
    if (selectedJuz && surahData && juzData) {
      console.log(`Selected Juz changed to: ${selectedJuz}`);
      
      // Find the juz in our data
      const juz = juzData.find(j => j.juz_number === selectedJuz);
      
      console.log('Found juz data:', juz);
      
      if (juz && juz.surah_list) {
        try {
          // Log raw surah_list for debugging
          console.log("Raw surah_list from DB:", juz.surah_list);
          
          // Parse the surah list from the juz data
          const surahRanges = juz.surah_list.split(',');
          console.log("Split surah ranges:", surahRanges);
          
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
          
          // Log the parsed surah numbers for debugging
          console.log("Parsed surah numbers:", surahNumbers);
          
          // Filter the surah data to only include those in this juz
          if (surahData && surahNumbers.length > 0) {
            const filtered = surahData.filter(surah => 
              surahNumbers.includes(surah.surah_number)
            );
            
            console.log("Filtered surahs for juz:", filtered);
            setSurahsInJuz(filtered);
          } else {
            console.log("No surah data or surah numbers available");
            setSurahsInJuz([]);
          }
        } catch (error) {
          console.error('Error parsing surah list:', error);
          setSurahsInJuz([]);
        }
      } else {
        console.log("No surah_list found for juz:", selectedJuz);
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
