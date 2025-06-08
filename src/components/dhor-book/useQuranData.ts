import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client.ts";

export interface JuzData {
  id: number;  // Number to match the database schema
  juz_number: number;
  surah_list: string;
}

export interface SurahData {
  id: number;  // Changed from string to number to match the database schema
  surah_number: number;
  total_ayat: number;
  name: string;
}

// Define an interface for the Juz data we expect, specifically the surah_list
interface JuzSurahList {
  surah_list: string;
}

export const useQuranData = () => {
  const [selectedJuz, setSelectedJuz] = useState<number | null>(null);
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [surahListForSelectedJuz, setSurahListForSelectedJuz] = useState<string | null>(null);
  const [isLoadingSurahList, setIsLoadingSurahList] = useState<boolean>(false);
  const [errorFetchingSurahList, setErrorFetchingSurahList] = useState<string | null>(null);

  const [parsedSurahNumbers, setParsedSurahNumbers] = useState<number[] | null>(null); // Stores numbers from surah_list string

  const [surahDetailsForSelectedJuz, setSurahDetailsForSelectedJuz] = useState<SurahData[]>([]);
  const [isLoadingSurahDetails, setIsLoadingSurahDetails] = useState<boolean>(false);
  const [errorFetchingSurahDetails, setErrorFetchingSurahDetails] = useState<string | null>(null);

  // Fetch all Juz data for the Juz dropdown
  const { data: juzData, isLoading: juzLoading } = useQuery<JuzData[]> ({
    queryKey: ['quran-juz-data'],
    queryFn: async () => {
      console.log('Fetching all juz data...');
      const { data, error } = await supabase
        .from('juz')
        .select('id, juz_number, surah_list')
        .order('juz_number', { ascending: true });

      if (error) {
        console.error('Error fetching all juz data:', error);
        return [];
      }
      console.log('All juz data received:', data?.length);
      return data as unknown as JuzData[];
    },
    staleTime: Infinity, // Juz data is static
  });

  // Fetch all Surah data for name-to-number mapping and details
  const { data: allSurahsData, isLoading: allSurahsLoading } = useQuery<SurahData[]> ({
    queryKey: ['quran-all-surahs'],
    queryFn: async () => {
      console.log('Fetching all surahs data...');
      const { data, error } = await supabase
        .from('surah')
        .select('id, surah_number, name, total_ayat')
        .order('surah_number', { ascending: true });

      if (error) {
        console.error('Error fetching all surahs data:', error);
        return [];
      }
      console.log('All surahs data received:', data?.length);
      return data as unknown as SurahData[];
    },
    staleTime: Infinity, // Surah data is static
  });

  const parseSurahListToNumbers = useCallback((listString: string | null, allSurahs: SurahData[] | undefined) => {
    if (!listString || !allSurahs || allSurahs.length === 0) {
      setParsedSurahNumbers(null);
      return;
    }
    console.log(`Parsing surah list string for numbers: "${listString}"`);
    const numbers: number[] = [];
    let processedStr = listString.trim();
    if (processedStr.startsWith('{') && processedStr.endsWith('}')) {
      processedStr = processedStr.substring(1, processedStr.length - 1);
    }
    const parts = processedStr.split(',').map(part => part.trim());
    parts.forEach(part => {
      // Attempt 1: Parse as a direct number
      const num = parseInt(part, 10);
      if (!isNaN(num)) {
        numbers.push(num);
        return; // Part processed
      }

      // Attempt 2: Match as a whole Surah name
      const matchedSurah = allSurahs.find(s => s.name.toLowerCase() === part.toLowerCase());
      if (matchedSurah) {
        numbers.push(matchedSurah.surah_number);
        return; // Part processed
      }

      // Attempt 3: Parse as a range (if it contains a hyphen and wasn't a direct match above)
      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-').map(numStr => numStr.trim());
        console.log(`Range parsing: part="${part}", startStr="${startStr}", endStr="${endStr}"`);
        let startNum = parseInt(startStr, 10);
        let endNum = parseInt(endStr, 10);

        // Check if start or end of range are names
        if (isNaN(startNum)) {
          const startSurahObj = allSurahs.find(s => s.name.toLowerCase() === startStr.toLowerCase());
          if (startSurahObj) {
            startNum = startSurahObj.surah_number;
          } else {
            console.warn(`Could not resolve start of range: "${startStr}" in part "${part}"`);
            return; // Skip this part
          }
        }
        if (isNaN(endNum)) {
          const endSurahObj = allSurahs.find(s => s.name.toLowerCase() === endStr.toLowerCase());
          if (endSurahObj) {
            endNum = endSurahObj.surah_number;
          } else {
            console.warn(`Could not resolve end of range: "${endStr}" in part "${part}"`);
            return; // Skip this part
          }
        }

        if (!isNaN(startNum) && !isNaN(endNum) && startNum <= endNum) {
          for (let i = startNum; i <= endNum; i++) numbers.push(i);
        } else {
          console.warn(`Invalid or unresolvable range after attempting to resolve names: "${part}"`);
        }
      } else {
        // If it wasn't a number, wasn't a full surah name, and isn't a range,
        // then it's an unparsable part.
        console.warn(`Could not parse "${part}" as a number, a recognized surah name, or a valid range.`);
      }
    });
    const uniqueSortedNumbers = [...new Set(numbers)].sort((a, b) => a - b);
    console.log("Parsed surah numbers for selected Juz:", uniqueSortedNumbers);
    setParsedSurahNumbers(uniqueSortedNumbers);
  }, []);

  const fetchSurahDetailsByNumbers = useCallback(async (numbersToFetch: number[]) => {
    if (!numbersToFetch || numbersToFetch.length === 0) {
      setSurahDetailsForSelectedJuz([]);
      setErrorFetchingSurahDetails(null);
      return;
    }
    console.log('Fetching details for surah numbers:', numbersToFetch);
    setIsLoadingSurahDetails(true);
    setErrorFetchingSurahDetails(null);
    try {
      const { data, error } = await supabase
        .from('surah')
        .select('*')
        .in('surah_number', numbersToFetch)
        .order('surah_number', { ascending: true });
      if (error) {
        console.error('Error fetching surah details by numbers:', error);
        setErrorFetchingSurahDetails(error.message);
        setSurahDetailsForSelectedJuz([]);
      } else {
        console.log('Successfully fetched surah details:', data);
        setSurahDetailsForSelectedJuz(data as SurahData[]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      console.error('Unexpected error fetching surah details by numbers:', errorMessage);
      setErrorFetchingSurahDetails(errorMessage);
      setSurahDetailsForSelectedJuz([]);
    } finally {
      setIsLoadingSurahDetails(false);
    }
  }, []); // Dependencies: supabase client, but it's stable globally.

  // Function to fetch the surah_list for a given juz_number
  const fetchAndStoreSurahList = async (juzNumber: number) => {
    if (!juzNumber) {
      setSurahListForSelectedJuz(null);
      setErrorFetchingSurahList(null);
      setParsedSurahNumbers(null); // Clear parsed numbers too
      return;
    }

    console.log(`Fetching surah_list for Juz ${juzNumber}...`);
    setIsLoadingSurahList(true);
    setErrorFetchingSurahList(null);
    setSurahListForSelectedJuz(null); // Clear previous list
    setParsedSurahNumbers(null); // Clear parsed numbers before new fetch

    try {
      const { data, error } = await supabase
        .from('juz')
        .select('surah_list')
        .eq('juz_number', juzNumber)
        .single(); // We expect only one Juz for a given number

      if (error) {
        console.error(`Error fetching surah_list for Juz ${juzNumber}:`, error);
        setErrorFetchingSurahList(error.message);
        setSurahListForSelectedJuz(null);
      } else if (data) {
        const typedData = data as unknown as JuzSurahList; // Cast to our interface
        console.log(`Successfully fetched surah_list for Juz ${juzNumber}:`, typedData.surah_list);
        setSurahListForSelectedJuz(typedData.surah_list);
      } else {
        console.warn(`No data found for Juz ${juzNumber}.`);
        setErrorFetchingSurahList(`No surah_list found for Juz ${juzNumber}.`);
        setSurahListForSelectedJuz(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      console.error(`Unexpected error fetching surah_list for Juz ${juzNumber}:`, errorMessage);
      setErrorFetchingSurahList(errorMessage);
      setSurahListForSelectedJuz(null);
    } finally {
      setIsLoadingSurahList(false);
    }
  };

  // useEffect to trigger the fetch when selectedJuz changes
  useEffect(() => {
    if (selectedJuz !== null) {
      setSelectedSurah(null); // Reset selected surah when Juz changes
      fetchAndStoreSurahList(selectedJuz);
    } else {
      setSurahListForSelectedJuz(null);
      setErrorFetchingSurahList(null);
      setIsLoadingSurahList(false);
      setParsedSurahNumbers(null); // Clear when no juz selected
      setSurahDetailsForSelectedJuz([]); // Clear details when no juz selected
      setSelectedSurah(null); // Also reset selected surah if no Juz is selected
    }
  }, [selectedJuz]);

  // useEffect to parse the surah list string when it changes or when allSurahsData is loaded
  useEffect(() => {
    if (surahListForSelectedJuz && allSurahsData && allSurahsData.length > 0) {
      parseSurahListToNumbers(surahListForSelectedJuz, allSurahsData);
    } else if (!surahListForSelectedJuz) {
      // If the list string is cleared (e.g., juz deselected), clear details
      setParsedSurahNumbers(null); // Clear if source string is gone
    }
    // Do not run if allSurahsData is not yet loaded to avoid issues on initial load
  }, [surahListForSelectedJuz, allSurahsData, parseSurahListToNumbers]);

  useEffect(() => {
    if (parsedSurahNumbers && parsedSurahNumbers.length > 0) {
      fetchSurahDetailsByNumbers(parsedSurahNumbers);
    } else if (parsedSurahNumbers === null || parsedSurahNumbers.length === 0) {
      // If parsed numbers are cleared or empty, clear the details too
      setSurahDetailsForSelectedJuz([]);
      setErrorFetchingSurahDetails(null); // Clear any previous fetch error for details
    }
  }, [parsedSurahNumbers, fetchSurahDetailsByNumbers]);

  return {
    selectedJuz,
    setSelectedJuz,
    selectedSurah,
    setSelectedSurah,
    surahListForSelectedJuz,
    isLoadingSurahList,
    errorFetchingSurahList,
    juzData: juzData || [],
    juzLoading,
    allSurahsData: allSurahsData || [],
    allSurahsLoading,
    surahsInJuz: surahDetailsForSelectedJuz,
    isLoadingSurahs: isLoadingSurahList || allSurahsLoading || isLoadingSurahDetails,
    error: errorFetchingSurahList || errorFetchingSurahDetails,
  };
};
