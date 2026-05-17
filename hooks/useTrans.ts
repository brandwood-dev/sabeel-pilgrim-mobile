import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { uiTranslations, translationService, SupportedLang } from '@/services/translationService';
import { useState, useEffect } from 'react';

/**
 * Custom Hook for App-wide Translation
 * Combined static dictionary (instant) + dynamic LibreTranslate (async)
 */
export function useTrans() {
  const language = useSelector((state: RootState) => state.ui.language) as SupportedLang;

  /**
   * Translates a string. 
   * Returns a static translation if available, or attempts a dynamic one.
   */
  const t = (key: string): string => {
    if (uiTranslations[key] && uiTranslations[key][language]) {
      return uiTranslations[key][language];
    }
    return key;
  };

  /**
   * For Dynamic Content (like hotel names/descriptions)
   */
  const translateDynamic = async (text: string): Promise<string> => {
    return translationService.translate(text, language);
  };

  return { t, language, translateDynamic };
}
